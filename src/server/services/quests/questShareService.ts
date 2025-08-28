import { QuestRepository, QuestToTaxa, QuestToTaxaRepository } from '../../repositories/QuestRepository.js'
import type { QuestShareRepository, SharedQuestProgressRepository } from '../../repositories/QuestShareRepository.js'
import { sendEvent } from './questEventsService.js'
import { QuestShare } from '../../models/quest_shares.js'
import { UserRepository } from '../../repositories/UserRepository.js'

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
        if (!quest) throw new Error('Quest not found')
        if (quest.user_id !== userId) throw new Error('Access denied')
        return quest
    }

    async function createShare(
        questId: number,
        userId: number,
        data: { guest_name?: string | null; expires_at?: string | Date | null }
    ) {
        await assertQuestOwnership(questId, userId)
        const shareId = await questShareRepo.createShare({
            quest_id: questId,
            created_by_user_id: userId,
            guest_name: data.guest_name ?? null,
            expires_at: data.expires_at ? new Date(data.expires_at) : null,
        })
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new Error('Failed to create share')
        return share
    }

    async function listSharesForQuest(questId: number, userId: number) {
        await assertQuestOwnership(questId, userId)
        return questShareRepo.findByQuestId(questId)
    }

    async function deleteShare(shareId: number, userId: number) {
        const share = await questShareRepo.findById(shareId)
        if (!share) throw new Error('Share not found')
        // Only the creator (quest owner) can delete
        if (share.created_by_user_id !== userId)
            throw new Error('Access denied')
        await questShareRepo.deleteShare(shareId)
        return { success: true }
    }

    async function getShareDetailsByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')

        const quest = await questRepo.findById(share.quest_id)
        if (!quest) throw new Error('Quest not found')

        const owner = await userRepo.findUser({ id: quest.user_id })

        const taxaMappings = await questToTaxaRepo.findByQuestId(share.quest_id)
        const progress = await progressRepo.findByShareId(share.id)

        return {
            share,
            quest: {
                ...quest,
                username: owner?.username,
                taxon_ids: taxaMappings.map((t) => t.taxon_id),
            },
            taxa_mappings: taxaMappings, // contains id (mapping id) and taxon_id (iNat id)
            progress,
        }
    }

    async function getProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')
        return progressRepo.findByShareId(share.id)
    }

    async function setObservedByToken(
        token: string,
        mappingId: number,
        observed: boolean
    ) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')
        const guestName = share.guest_name ?? null
        const questId = share.quest_id ?? null

        // Validate the mapping belongs to the quest of the share
        const mapping = (await questToTaxaRepo.findOne({
            id: mappingId,
        })) as QuestToTaxa
        if (!mapping) throw new Error('Invalid taxon mapping')
        if (mapping.quest_id !== share.quest_id) {
            throw new Error('Mapping does not belong to this quest')
        }

        // Get quest to check mode
        const quest = await questRepo.findById(questId!)
        if (!quest) throw new Error('Quest not found')

        if (observed) {
            // In competitive mode, check if species is already found by someone else
            if (quest.mode === 'competitive') {
                const existingProgress =
                    await progressRepo.getAggregatedProgress(questId!)
                const speciesAlreadyFound = existingProgress.find(
                    (p) => p.mapping_id === mappingId && p.count > 0
                )

                if (speciesAlreadyFound) {
                    throw new Error(
                        'This species has already been found by another participant in competitive mode'
                    )
                }
            }

            try {
                await progressRepo.addProgress(share.id, mappingId)
            } catch (_err) {
                // ignore duplicates because of unique constraint
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
        if (!accessible) throw new Error('Quest not found or access denied')
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
        if (!accessible) throw new Error('Quest not found or access denied')
        return questToTaxaRepo.findByQuestId(questId)
    }

    async function getAggregatedProgressByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')
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
        const user = await userRepo.findUser({ id: userId })

        // Get quest to check mode
        const quest = await questRepo.findById(questId)
        if (!quest) throw new Error('Quest not found')

        // Find or create an owner share for this quest (guest_name null)
        const possibleShares = (await questShareRepo.findMany({
            quest_id: questId,
            created_by_user_id: userId,
        })) as QuestShare[]
        let share = possibleShares.find((s) => !s.guest_name) || null
        if (!share) {
            const shareId = await questShareRepo.createShare({
                quest_id: questId,
                created_by_user_id: userId,
                guest_name: null,
                expires_at: null,
            })
            share = await questShareRepo.findById(shareId)
        }

        if (!share) throw new Error('Unable to resolve owner share')

        if (observed) {
            // In competitive mode, check if species is already found by someone else
            if (quest.mode === 'competitive') {
                const existingProgress =
                    await progressRepo.getAggregatedProgress(questId)
                const speciesAlreadyFound = existingProgress.find(
                    (p) => p.mapping_id === mappingId && p.count > 0
                )

                if (speciesAlreadyFound) {
                    throw new Error(
                        'This species has already been found by another participant in competitive mode'
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
        if (!accessible) throw new Error('Quest not found or access denied')
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
        if (!accessible) throw new Error('Quest not found or access denied')
        return progressRepo.getLeaderboardProgress(questId)
    }

    async function getLeaderboardForQuestByToken(token: string) {
        const share = await questShareRepo.findActiveByToken(token)
        if (!share) throw new Error('Share not found or expired')
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
    }
}
