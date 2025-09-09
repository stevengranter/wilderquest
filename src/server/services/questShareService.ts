import {
    QuestRepository,
    QuestToTaxa,
    QuestToTaxaRepository,
} from '../repositories/QuestRepository.js'
import type {
    QuestShare,
    QuestShareRepository,
    SharedQuestProgressRepository,
} from '../repositories/QuestShareRepository.js'
import { sendEvent } from './questEventsService.js'
import { UserRepository } from '../repositories/UserRepository.js'
import { AppError } from '../middlewares/errorHandler.js'

export type QuestShareService = ReturnType<typeof createQuestShareService>

export function createQuestShareService(
    questRepo: QuestRepository,
    questToTaxaRepo: QuestToTaxaRepository,
    questShareRepo: QuestShareRepository,
    progressRepo: SharedQuestProgressRepository,
    userRepo: UserRepository
) {
    async function assertQuestOwnership(questId: number, userId: number) {
        const quest = await questRepo.findById(questId)
        if (!quest) throw new AppError('Quest not found', 404)
        if (quest.user_id !== userId) throw new AppError('Access denied', 403)
        return quest
    }

    async function createShare(
        questId: number,
        userId: number,
        data: {
            guest_name?: string | null
            shared_with_user_id?: number | null
            expires_at?: string | Date | null
        }
    ) {
        await assertQuestOwnership(questId, userId)

        // Validate invited user exists if provided
        if (data.shared_with_user_id) {
            const invitedUser = await userRepo.findUserForDisplay({
                id: data.shared_with_user_id,
            })
            if (!invitedUser) {
                throw new AppError('Invited user not found', 404)
            }

            // Check for duplicate invitation
            const existingShares = await questShareRepo.findByQuestId(questId)
            const duplicateInvitation = existingShares.find(
                (s) => s.shared_with_user_id === data.shared_with_user_id
            )
            if (duplicateInvitation) {
                throw new AppError(
                    'User has already been invited to this quest',
                    409
                )
            }
        }

        // Check if this should be the primary share
        const existingShares = await questShareRepo.findByQuestId(questId)
        const ownerShares = existingShares.filter(
            (s) => s.created_by_user_id === userId
        )
        const hasPrimaryShare = ownerShares.some((s) => s.is_primary)

        // A share is primary if:
        // 1. No primary share exists yet for this quest+owner
        // 2. The new share is created by the owner
        // 3. Both guest_name and shared_with_user_id are null (or not provided)
        const isPrimary =
            !hasPrimaryShare && !data.guest_name && !data.shared_with_user_id

        const shareId = await questShareRepo.createShare({
            quest_id: questId,
            created_by_user_id: userId,
            guest_name: data.guest_name ?? null,
            shared_with_user_id: data.shared_with_user_id ?? null,
            expires_at: data.expires_at ? new Date(data.expires_at) : null,
            is_primary: isPrimary,
        })
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new AppError('Failed to create share', 500)
        return share
    }

    async function listSharesForQuest(questId: number, userId: number) {
        await assertQuestOwnership(questId, userId)
        return questShareRepo.findByQuestId(questId)
    }

    async function deleteShare(shareId: number, userId: number) {
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new AppError('Share not found', 404)
        // Only the creator (quest owner) can delete
        if (share.created_by_user_id !== userId)
            throw new AppError('Access denied', 403)
        await questShareRepo.deleteShare(shareId)
        return { success: true }
    }

    async function getShareDetailsByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new AppError('Share not found or expired', 404)

        const quest = await questRepo.findById(share.quest_id)
        if (!quest) throw new AppError('Quest not found', 404)

        const owner = await userRepo.findUserForDisplay({ id: quest.user_id })

        const taxaMappings = await questToTaxaRepo.findByQuestId(share.quest_id)
        const progress = await progressRepo.findByShareId(share.id)

        // Filter out invalid taxon IDs
        const validTaxonIds = taxaMappings
            .map((t) => t.taxon_id)
            .filter((id) => id && true && id > 0)

        return {
            share,
            quest: {
                ...quest,
                username: owner?.username,
                taxon_ids: validTaxonIds,
            },
            taxa_mappings: taxaMappings, // contains id (mapping id) and taxon_id (iNat id)
            progress,
        }
    }

    async function getProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new AppError('Share not found or expired', 404)
        return progressRepo.findByShareId(share.id)
    }

    async function setObservedByToken(
        token: string,
        mappingId: number,
        observed: boolean
    ) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new AppError('Share not found or expired', 404)
        const guestName = share.guest_name ?? null
        const questId = share.quest_id ?? null

        // Validate the mapping belongs to the quest of the share
        const mapping = (await questToTaxaRepo.findOne({
            id: mappingId,
        })) as QuestToTaxa
        if (!mapping) throw new AppError('Invalid taxon mapping', 400)
        if (mapping.quest_id !== share.quest_id) {
            throw new AppError('Mapping does not belong to this quest', 400)
        }

        // Get quest to check mode
        const quest = await questRepo.findById(questId!)
        if (!quest) throw new AppError('Quest not found', 404)

        if (observed) {
            // In competitive mode, check if species is already found by someone else
            if (quest.mode === 'competitive') {
                const existingProgress =
                    await progressRepo.getAggregatedProgress(questId!)
                const speciesAlreadyFound = existingProgress.find(
                    (p) => p.mapping_id === mappingId && p.count > 0
                )

                if (speciesAlreadyFound) {
                    throw new AppError(
                        'This species has already been found by another participant in competitive mode',
                        409
                    )
                }
            }

            try {
                await progressRepo.addProgress(share.id, mappingId)
            } catch (_err) {
                // ignore duplicates because of unique constraint
                console.log(
                    'DB: QuestShareService: Duplicate progress entry, ignoring'
                )
            }
            sendEvent(String(questId), {
                type: 'SPECIES_FOUND',
                payload: { mappingId, guestName },
            })
        } else {
            await progressRepo.removeProgress(share.id, mappingId)
            sendEvent(String(questId), {
                type: 'SPECIES_UNFOUND',
                payload: { mappingId, guestName },
            })
        }

        return progressRepo.findByShareId(share.id)
    }

    async function getAggregatedProgressForQuest(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible)
            throw new AppError('Quest not found or access denied', 404)
        return progressRepo.getAggregatedProgress(questId)
    }

    async function getQuestTaxaMappings(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible)
            throw new AppError('Quest not found or access denied', 404)
        return questToTaxaRepo.findByQuestId(questId)
    }

    async function getAggregatedProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new AppError('Share not found or expired', 404)
        return progressRepo.getAggregatedProgress(share.quest_id)
    }

    async function setObservedAsOwner(
        questId: number,
        mappingId: number,
        observed: boolean,
        userId: number
    ) {
        // Ensure ownership
        await assertQuestOwnership(questId, userId)
        const user = await userRepo.findUserForDisplay({ id: userId })

        // Get quest to check mode
        const quest = await questRepo.findById(questId)
        if (!quest) throw new AppError('Quest not found', 404)

        // Find or create the primary owner share for this quest
        const existingShares = await questShareRepo.findByQuestId(questId)
        let share =
            existingShares.find(
                (s) => s.is_primary && s.created_by_user_id === userId
            ) || null

        if (!share) {
            // Create primary share if it doesn't exist
            const shareId = await questShareRepo.createShare({
                quest_id: questId,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
                is_primary: true,
            })
            share = await questShareRepo.findById(shareId)
        }

        if (!share) throw new AppError('Unable to resolve owner share', 500)

        if (observed) {
            // In competitive mode, check if species is already found by someone else
            if (quest.mode === 'competitive') {
                const existingProgress =
                    await progressRepo.getAggregatedProgress(questId)
                const speciesAlreadyFound = existingProgress.find(
                    (p) => p.mapping_id === mappingId && p.count > 0
                )

                if (speciesAlreadyFound) {
                    throw new AppError(
                        'This species has already been found by another participant in competitive mode',
                        409
                    )
                }
            }

            try {
                await progressRepo.addProgress(share.id, mappingId)
                sendEvent(String(questId), {
                    type: 'SPECIES_FOUND',
                    payload: { mappingId, guestName: user?.username },
                })
            } catch (_err) {
                // ignore unique constraint violation
            }
        } else {
            await progressRepo.removeProgress(share.id, mappingId)
            sendEvent(String(questId), {
                type: 'SPECIES_UNFOUND',
                payload: { mappingId, guestName: user?.username },
            })
        }

        return true
    }

    async function getDetailedProgressForQuest(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible)
            throw new AppError('Quest not found or access denied', 404)
        return progressRepo.getDetailedProgress(questId)
    }

    async function getLeaderboardForQuest(
        questId: number,
        viewerUserId?: number
    ) {
        const accessible = await questRepo.findAccessibleById(
            questId,
            viewerUserId
        )
        if (!accessible)
            throw new AppError('Quest not found or access denied', 404)
        return progressRepo.getLeaderboardProgress(questId)
    }

    async function getLeaderboardForQuestByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new AppError('Share not found or expired', 404)
        return progressRepo.getLeaderboardProgress(share.quest_id)
    }

    async function deleteProgressEntry(
        questId: number,
        progressId: number,
        userId: number
    ) {
        await assertQuestOwnership(questId, userId)
        await progressRepo.deleteProgressEntry(progressId, questId)
        return { success: true }
    }

    async function clearMappingProgress(
        questId: number,
        mappingId: number,
        userId: number
    ) {
        await assertQuestOwnership(questId, userId)
        await progressRepo.clearMappingProgress(questId, mappingId)
        return { success: true }
    }

    async function trackPageAccess(token: string) {
        const share = await questShareRepo.findByToken(token)
        if (!share) throw new AppError('Share not found', 404)

        const now = new Date()
        if (!share.first_accessed_at) {
            // First time accessing
            await questShareRepo.update(share.id, {
                first_accessed_at: now,
                last_accessed_at: now,
            })
        } else {
            // Update last accessed time
            await questShareRepo.update(share.id, {
                last_accessed_at: now,
            })
        }
        return { success: true }
    }

    return {
        createShare,
        listSharesForQuest,
        deleteShare,
        getShareDetailsByToken,
        getProgressByToken,
        setObservedByToken,
        getAggregatedProgressForQuest,
        getQuestTaxaMappings,
        getAggregatedProgressByToken,
        setObservedAsOwner,
        getDetailedProgressForQuest,
        deleteProgressEntry,
        clearMappingProgress,
        getLeaderboardForQuest,
        getLeaderboardForQuestByToken,
        trackPageAccess,
    }
}
