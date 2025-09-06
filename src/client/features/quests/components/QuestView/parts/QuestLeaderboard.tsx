import { AnimatePresence, motion } from 'motion/react'
import {
    FaChevronDown,
    FaLink,
    FaShareFromSquare,
    FaTrash,
} from 'react-icons/fa6'
import { LeaderboardEntry } from '@/features/quests/types'
import { AvatarOverlay } from '../../AvatarOverlay'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
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
import { ShareQuest } from '../../ShareQuest'

type QuestShare = {
    id: number
    guest_name: string | null
    token: string
    expires_at?: string
    shared_with_user_id?: number | null
    invited_username?: string | null
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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [participantToDelete, setParticipantToDelete] =
        useState<LeaderboardEntry | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
    const [showInviteDrawer, setShowInviteDrawer] = useState(false)
    const queryClient = useQueryClient()

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

            // Find matching share - handle both guest and user shares
            const matchingShare = shares.find(
                (s: QuestShare) =>
                    // Match guest shares by name
                    s.guest_name === participantToDelete.display_name ||
                    (s.guest_name === null &&
                        participantToDelete.display_name === 'Guest') ||
                    // Match user shares by username (display_name will be the username for user shares)
                    (s.shared_with_user_id &&
                        s.invited_username === participantToDelete.display_name)
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

    const buildShareLink = async (entry: LeaderboardEntry): Promise<string> => {
        if (!questId) {
            console.error('No quest ID provided')
            return ''
        }

        try {
            // Get all shares for this quest
            const response = await api.get(
                `/quest-sharing/quests/${questId}/shares`
            )
            const shares = response.data || []

            // Find the share that matches this entry
            const matchingShare = shares.find((s: QuestShare) => {
                // For user shares (invited registered users)
                if (s.shared_with_user_id && s.invited_username) {
                    return s.invited_username === entry.display_name
                }

                // For guest shares (invited by name/email)
                if (s.guest_name) {
                    return s.guest_name === entry.display_name
                }

                // For generic guest entries
                if (s.guest_name === null && entry.display_name === 'Guest') {
                    return true
                }

                return false
            })

            if (matchingShare) {
                const shareUrl = `${window.location.origin}/share/${matchingShare.token}`
                console.log(
                    'Generated share URL:',
                    shareUrl,
                    'for entry:',
                    entry.display_name
                )
                return shareUrl
            } else {
                console.warn(
                    'No matching share found for entry:',
                    entry.display_name
                )
                return ''
            }
        } catch (e) {
            console.error('Failed to get share link', e)
            return ''
        }
    }

    const handleCopyLink = async (
        entry: LeaderboardEntry,
        e: React.MouseEvent
    ) => {
        e.stopPropagation()
        try {
            const shareUrl = await buildShareLink(entry)
            if (shareUrl) {
                await navigator.clipboard.writeText(shareUrl)
                toast.success('Link Copied!', {
                    description: `The share link for ${
                        entry.display_name || 'Guest'
                    } has been copied to your clipboard.`,
                })
            } else {
                toast.error('Failed to generate share link', {
                    description:
                        'Could not find a valid share link for this participant.',
                })
            }
        } catch (error) {
            console.error('Error copying link:', error)
            toast.error('Failed to copy link', {
                description:
                    'An error occurred while copying the link to your clipboard.',
            })
        }
    }

    const handleShare = async (
        entry: LeaderboardEntry,
        e: React.MouseEvent
    ) => {
        e.stopPropagation()

        // Show loading state immediately
        const loadingToast = toast.loading('Generating link...', {
            description: 'Please wait while we prepare the share link.',
        })

        try {
            const shareUrl = await buildShareLink(entry)

            // Dismiss loading toast
            toast.dismiss(loadingToast)

            if (!shareUrl) {
                toast.error('Failed to generate share link', {
                    description:
                        'Could not find a valid share link for this participant.',
                })
                return
            }

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Join my quest: ${questName || 'Quest'}`,
                        text: `Join my quest to discover species!`,
                        url: shareUrl,
                    })
                } catch (shareError) {
                    // User cancelled share or share failed, fall back to clipboard
                    if ((shareError as Error).name !== 'AbortError') {
                        console.warn(
                            'Native share failed, falling back to clipboard:',
                            shareError
                        )
                        await handleClipboardCopy(
                            shareUrl,
                            entry.display_name || 'Guest'
                        )
                    }
                }
            } else {
                await handleClipboardCopy(
                    shareUrl,
                    entry.display_name || 'Guest'
                )
            }
        } catch (error) {
            toast.dismiss(loadingToast)
            console.error('Error sharing link:', error)
            toast.error('Failed to share link', {
                description: 'An error occurred while sharing the link.',
            })
        }
    }

    const handleClipboardCopy = async (url: string, displayName: string) => {
        // Check if we're in a secure context
        const isSecureContext = window.isSecureContext
        const hasClipboard = !!navigator.clipboard

        console.log('Clipboard debug info:', {
            isSecureContext,
            hasClipboard,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
        })

        // Try modern clipboard API first (only in secure contexts)
        if (isSecureContext && hasClipboard) {
            try {
                await navigator.clipboard.writeText(url)
                toast.success('Link Copied!', {
                    description: `The share link for ${displayName} has been copied to your clipboard.`,
                })
                return
            } catch (clipboardError) {
                console.warn('Clipboard API failed:', clipboardError)
                // Continue to fallback method
            }
        }

        // Fallback method using execCommand (works in non-secure contexts)
        console.log('Using fallback copy method')
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
            const successful = document.execCommand('copy')
            if (successful) {
                toast.success('Link Copied!', {
                    description: `The share link for ${displayName} has been copied to your clipboard.`,
                })
            } else {
                throw new Error('Copy command failed')
            }
        } catch (fallbackError) {
            console.error('All copy methods failed:', fallbackError)
            // Last resort: show the URL for manual copying
            toast.info('Manual Copy Required', {
                description: `Copy this link: ${url}`,
                duration: 15000,
                action: {
                    label: 'Select All',
                    onClick: () => {
                        // Try to select the text in the toast if possible
                        const _selection = window.getSelection()
                        const _range = document.createRange()
                        // This won't work perfectly but gives user feedback
                        console.log('Manual copy needed:', url)
                    },
                },
            })
        } finally {
            document.body.removeChild(textArea)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quest Explorers</h2>
                {questId && ownerUserId && isOwner && (
                    <ShareQuest
                        questId={questId}
                        ownerUserId={ownerUserId}
                        questName={questName}
                        showDrawerOnly={false}
                        showForm={showInviteDrawer}
                        onToggleForm={setShowInviteDrawer}
                    />
                )}
            </div>

            {questId && ownerUserId && isOwner && (
                <ShareQuest
                    questId={questId}
                    ownerUserId={ownerUserId}
                    questName={questName}
                    showDrawerOnly={true}
                    showForm={showInviteDrawer}
                    onToggleForm={setShowInviteDrawer}
                />
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
                                                            onClick={(e) =>
                                                                handleCopyLink(
                                                                    entry,
                                                                    e
                                                                )
                                                            }
                                                        >
                                                            <FaLink className="h-3 w-3 mr-1" />
                                                            Copy Link
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="noShadow"
                                                            className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                                                            onClick={(e) =>
                                                                handleShare(
                                                                    entry,
                                                                    e
                                                                )
                                                            }
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
