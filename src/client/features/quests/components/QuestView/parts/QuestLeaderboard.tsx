import { AnimatePresence, motion } from 'motion/react'
import { FaChevronDown, FaLink, FaPlus, FaShareFromSquare, FaTrash } from 'react-icons/fa6'
import { LeaderboardEntry } from '@/features/quests/types'
import { AvatarOverlay } from '../../AvatarOverlay'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import api from '@/api/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type QuestShare = {
    id: number
    guest_name: string | null
    token: string
    expires_at?: string
}

type QuestLeaderboardProps = {
    leaderboard: LeaderboardEntry[] | undefined
    questStatus?: 'pending' | 'active' | 'paused' | 'ended'
    questId?: number | string
    ownerUserId?: number | string
    questName?: string
    isOwner?: boolean
}

const getParticipantBadge = (entry: LeaderboardEntry, questStatus?: string) => {
    // Quest not started yet
    if (questStatus === 'pending') {
        return entry.has_accessed_page ? 'Joined' : 'Invited'
    }

    // Quest is active/ended
    if (entry.observation_count === 0) {
        return entry.has_accessed_page ? 'Joined' : 'Invited'
    }

    // Has progress - check if recently active
    if (entry.last_progress_at) {
        const daysSinceLastProgress =
            (Date.now() - new Date(entry.last_progress_at).getTime()) /
            (1000 * 60 * 60 * 24)
        if (daysSinceLastProgress <= 7) {
            return '🏆 Active'
        } else if (daysSinceLastProgress <= 30) {
            return 'Recent'
        }
    }

    // Has progress but not recent
    return 'Explorer'
}

const getBadgeStyles = (badgeType: string) => {
    switch (badgeType) {
        case 'Invited':
            return 'bg-gray-100 text-gray-600'
        case 'Joined':
            return 'bg-blue-100 text-blue-600'
        case '🏆 Active':
            return 'bg-green-100 text-green-600'
        case 'Recent':
            return 'bg-yellow-100 text-yellow-600'
        case 'Explorer':
            return 'bg-purple-100 text-purple-600'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

export const QuestLeaderboard = ({
    leaderboard,
    questStatus,
    questId,
    ownerUserId,
    questName,
    isOwner,
}: QuestLeaderboardProps) => {
    const [showAddForm, setShowAddForm] = useState(false)
    const [guestName, setGuestName] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [creating, setCreating] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [participantToDelete, setParticipantToDelete] =
        useState<LeaderboardEntry | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
    const queryClient = useQueryClient()

    const createShare = async () => {
        if (!questId) return

        setCreating(true)
        try {
            const payload: { guest_name?: string; expires_at?: string } = {}
            if (guestName) payload.guest_name = guestName
            if (expiresAt)
                payload.expires_at = new Date(expiresAt).toISOString()

            await api.post(`/quest-sharing/quests/${questId}/shares`, payload)
            setGuestName('')
            setExpiresAt('')
            setShowAddForm(false)

            // Invalidate leaderboard queries so they update immediately
            queryClient.invalidateQueries({
                queryKey: ['leaderboard', questId],
            })
        } catch (e) {
            console.error('Failed to create share', e)
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteClick = (entry: LeaderboardEntry) => {
        setParticipantToDelete(entry)
        setShowDeleteDialog(true)
    }

    const toggleEntryExpansion = (entryKey: string) => {
        setExpandedEntry(expandedEntry === entryKey ? null : entryKey)
    }

    const confirmDeleteParticipant = async () => {
        if (!participantToDelete || !questId) return

        setDeleting(true)
        try {
            // Get all shares for this quest
            const response = await api.get(
                `/quest-sharing/quests/${questId}/shares`
            )
            const shares = response.data || []
            const matchingShare = shares.find(
                (s: QuestShare) =>
                    s.guest_name === participantToDelete.display_name ||
                    (s.guest_name === null &&
                        participantToDelete.display_name === 'Guest')
            )

            if (matchingShare) {
                // Delete the share - database CASCADE will handle deleting all related progress
                await api.delete(`/quest-sharing/shares/${matchingShare.id}`)

                queryClient.invalidateQueries({
                    queryKey: ['leaderboard', questId],
                })
            }
        } catch (e) {
            console.error('Failed to remove participant', e)
        } finally {
            setDeleting(false)
            setShowDeleteDialog(false)
            setParticipantToDelete(null)
        }
    }

    const buildShareLink = async (entry: LeaderboardEntry) => {
        if (!questId) return `${window.location.origin}/share/placeholder-token`

        try {
            // Get all shares for this quest
            const response = await api.get(
                `/quest-sharing/quests/${questId}/shares`
            )
            const shares = response.data || []

            // Find the share that matches this entry
            const matchingShare = shares.find(
                (s: QuestShare) =>
                    s.guest_name === entry.display_name ||
                    (s.guest_name === null && entry.display_name === 'Guest')
            )

            if (matchingShare) {
                return `${window.location.origin}/share/${matchingShare.token}`
            }
        } catch (e) {
            console.error('Failed to get share link', e)
        }

        return `${window.location.origin}/share/placeholder-token`
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quest Explorers</h2>
                {questId && isOwner && (
                    <Button
                        size="sm"
                        onClick={() => setShowAddForm(!showAddForm)}
                        variant="default"
                    >
                        <FaPlus className="h-4 w-4 mr-2" />
                        Add Explorer
                    </Button>
                )}
            </div>

            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md"
                >
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <Label htmlFor="guestName">
                                Explorer name (optional)
                            </Label>
                            <Input
                                id="guestName"
                                placeholder="e.g. Alex"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expiresAt">
                                Expires at (optional)
                            </Label>
                            <Input
                                id="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={createShare}
                                disabled={creating}
                                size="sm"
                            >
                                {creating ? 'Creating…' : 'Create invitation'}
                            </Button>
                            <Button
                                variant="neutral"
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

            {questStatus === 'pending' && (
                <div className="text-sm text-amber-600 mb-3 bg-amber-50 p-3 rounded-md border border-amber-200">
                    🕒 Quest hasn't started yet. Leaderboard will show progress
                    once the quest begins.
                </div>
            )}

            {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                    <AnimatePresence>
                        {leaderboard.map(
                            (entry: LeaderboardEntry, index: number) => {
                                const badgeType = getParticipantBadge(
                                    entry,
                                    questStatus
                                )
                                const badgeStyles = getBadgeStyles(badgeType)

                                const entryKey = `${entry.display_name}-${entry.invited_at}`
                                const isExpanded = expandedEntry === entryKey

                                return (
                                    <motion.div
                                        key={entryKey}
                                        initial={{
                                            opacity: 0,
                                            y: 20,
                                            scale: 0.95,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: 1,
                                            transition: {
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 30,
                                                delay: index * 0.05, // Staggered entrance
                                            },
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: -20,
                                            scale: 0.95,
                                            transition: { duration: 0.2 },
                                        }}
                                        className={`flex flex-col gap-3 p-3 rounded-xl border-1 border-slate-400 transition-all duration-300 ease-out ${
                                            isOwner
                                                ? 'cursor-pointer hover:shadow-sm'
                                                : ''
                                        } ${
                                            entry.observation_count > 0
                                                ? 'bg-green-100'
                                                : 'bg-background'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (questId && isOwner) {
                                                toggleEntryExpansion(entryKey)
                                            }
                                        }}
                                    >
                                        {/* First row: Participant info and progress */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <motion.div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-sm">
                                                    <motion.span
                                                        className="text-sm font-bold text-gray-700"
                                                        key={index + 1}
                                                        initial={{
                                                            scale: 1.2,
                                                            color: '#10b981',
                                                        }}
                                                        animate={{
                                                            scale: 1,
                                                            color: '#374151',
                                                        }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </motion.span>
                                                </motion.div>
                                                <AvatarOverlay
                                                    displayName={
                                                        entry.display_name ||
                                                        'Guest'
                                                    }
                                                    className="w-14 h-14 border-0"
                                                />
                                                <div className="flex flex-col">
                                                    <motion.span className="font-medium">
                                                        {entry.display_name ||
                                                            'Guest'}
                                                    </motion.span>
                                                    <motion.span
                                                        className={`text-xs px-2 py-0.5 rounded-full w-fit ${badgeStyles}`}
                                                    >
                                                        {badgeType}
                                                    </motion.span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`text-sm font-medium ${
                                                        entry.observation_count >
                                                        0
                                                            ? 'text-green-700'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {entry.observation_count}{' '}
                                                    taxa found
                                                </span>
                                                {entry.observation_count > 0 &&
                                                    entry.last_progress_at && (
                                                        <div className="text-xs text-green-600 mt-0.5">
                                                            Last active:{' '}
                                                            {new Date(
                                                                entry.last_progress_at
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    )}
                                            </div>
                                            {questId && isOwner && (
                                                <div className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors">
                                                    <FaChevronDown className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer row: Action buttons */}
                                        {questId && isOwner && (
                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-out border-t border-gray-200 ${
                                                    isExpanded
                                                        ? 'max-h-20 opacity-100 pt-2'
                                                        : 'max-h-0 opacity-0 pt-0'
                                                }`}
                                            >
                                                <div className="flex justify-end">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="noShadow"
                                                            className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                                                            onClick={async (
                                                                e
                                                            ) => {
                                                                e.stopPropagation()
                                                                const shareUrl =
                                                                    await buildShareLink(
                                                                        entry
                                                                    )
                                                                navigator.clipboard.writeText(
                                                                    shareUrl
                                                                )
                                                                toast.success('Link Copied!', {
                                                                    description: `The share link for ${
                                                                        entry.display_name ||
                                                                        'Guest'
                                                                    } has been copied to your clipboard.`,
                                                                })
                                                            }}
                                                        >
                                                            <FaLink className="h-3 w-3 mr-1" />
                                                            Copy Link
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="noShadow"
                                                            className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                                                            onClick={async (
                                                                e
                                                            ) => {
                                                                e.stopPropagation()
                                                                const shareUrl =
                                                                    await buildShareLink(
                                                                        entry
                                                                    )

                                                                if (
                                                                    navigator.share
                                                                ) {
                                                                    navigator.share(
                                                                        {
                                                                            title: `Join my quest: ${questName || 'Quest'}`,
                                                                            text: `Join my quest to discover species!`,
                                                                            url: shareUrl,
                                                                        }
                                                                    )
                                                                } else {
                                                                    navigator.clipboard.writeText(
                                                                        shareUrl
                                                                    )
                                                                    toast.success('Link Copied!', {
                                                                        description: `The share link for ${
                                                                            entry.display_name ||
                                                                            'Guest'
                                                                        } has been copied to your clipboard.`,
                                                                    })
                                                                }
                                                            }}
                                                        >
                                                            <FaShareFromSquare className="h-3 w-3 mr-1" />
                                                            Share
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            variant="noShadow"
                                                            className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteClick(
                                                                    entry
                                                                )
                                                            }}
                                                        >
                                                            <FaTrash className="h-3 w-3 mr-1" />
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )
                            }
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-left text-muted-foreground py-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {questStatus === 'pending'
                        ? 'Quest participants will appear here once the quest starts.'
                        : 'No participants have joined this quest yet.'}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <>
                <Dialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove Participant</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove{' '}
                                <strong>
                                    {participantToDelete?.display_name}
                                </strong>{' '}
                                from this quest?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-sm text-amber-800">
                                    <strong>Warning:</strong> This action will
                                    permanently delete:
                                </p>
                                <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                                    <li>
                                        All of their progress and observations
                                    </li>
                                    <li>Their access to this quest</li>
                                    <li>
                                        Any leaderboard rankings they've
                                        achieved
                                    </li>
                                </ul>
                                <p className="mt-2 text-sm text-amber-800 font-medium">
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="neutral"
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                onClick={confirmDeleteParticipant}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting ? 'Removing…' : 'Remove Participant'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        </div>
    )
}
