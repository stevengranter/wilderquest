import { useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
    FaChevronDown,
    FaLink,
    FaShareFromSquare,
    FaTrash,
} from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useCopyToClipboard } from 'usehooks-ts'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import api from '@/lib/axios'
import { LeaderboardEntry } from '@/types/questTypes'
import { clientDebug } from '../lib/debug'
import { AvatarGroup } from './AvatarGroup'
import { useQuestContext } from './QuestContext'

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
    isOwner?: boolean
}

const BADGE_TYPES = {
    INVITED: 'Invited',
    JOINED: 'Joined',
    ACTIVE: '🏆 Active',
    RECENT: 'Recent',
    EXPLORER: 'Explorer',
} as const

const TIME_THRESHOLDS = {
    ACTIVE_DAYS: 7,
    RECENT_DAYS: 30,
    MS_PER_DAY: 1000 * 60 * 60 * 24,
} as const

const BADGE_STYLES = {
    [BADGE_TYPES.INVITED]: 'bg-gray-100 text-gray-600',
    [BADGE_TYPES.JOINED]: 'bg-blue-100 text-blue-600',
    [BADGE_TYPES.ACTIVE]: 'bg-green-100 text-green-600',
    [BADGE_TYPES.RECENT]: 'bg-yellow-100 text-yellow-600',
    [BADGE_TYPES.EXPLORER]: 'bg-purple-100 text-purple-600',
} as const

const getParticipantBadge = (entry: LeaderboardEntry, questStatus?: string) => {
    const isPending = questStatus === 'pending'
    const hasProgress = entry.observation_count > 0
    const hasAccessed = entry.has_accessed_page

    if (isPending || !hasProgress) {
        return hasAccessed ? BADGE_TYPES.JOINED : BADGE_TYPES.INVITED
    }

    if (!entry.last_progress_at) return BADGE_TYPES.EXPLORER

    const daysSinceProgress =
        (Date.now() - new Date(entry.last_progress_at).getTime()) /
        TIME_THRESHOLDS.MS_PER_DAY
    if (daysSinceProgress <= TIME_THRESHOLDS.ACTIVE_DAYS)
        return BADGE_TYPES.ACTIVE
    if (daysSinceProgress <= TIME_THRESHOLDS.RECENT_DAYS)
        return BADGE_TYPES.RECENT
    return BADGE_TYPES.EXPLORER
}

const getBadgeStyles = (badgeType: string) => {
    return (
        BADGE_STYLES[badgeType as keyof typeof BADGE_STYLES] ||
        BADGE_STYLES[BADGE_TYPES.INVITED]
    )
}

function ActionFooter(props: {
    expanded: boolean
    onCopyLink: (e: React.MouseEvent) => void
    onShare: (e: React.MouseEvent) => void
    onRemove: (e: React.MouseEvent) => void
    copyingLink: string | null
    entry: LeaderboardEntry
}) {
    return (
        <div
            className={`overflow-hidden transition-all duration-300 ease-out border-t border-gray-200 ${
                props.expanded
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
                        onClick={props.onCopyLink}
                        disabled={
                            props.copyingLink ===
                            `${props.entry.display_name}-${props.entry.invited_at}`
                        }
                    >
                        <FaLink className="h-3 w-3 mr-1" />
                        {props.copyingLink ===
                        `${props.entry.display_name}-${props.entry.invited_at}`
                            ? 'Copying...'
                            : 'Copy Link'}
                    </Button>

                    <Button
                        size="sm"
                        variant="noShadow"
                        className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                        onClick={props.onShare}
                    >
                        <FaShareFromSquare className="h-3 w-3 mr-1" />
                        Share
                    </Button>

                    <Button
                        size="sm"
                        variant="noShadow"
                        className="h-7 px-2 text-xs text-green-700 shadow-none border-0 bg-transparent hover:bg-gray-100"
                        onClick={props.onRemove}
                    >
                        <FaTrash className="h-3 w-3 mr-1" />
                        Remove
                    </Button>
                </div>
            </div>
        </div>
    )
}

export const QuestLeaderboard = ({
    leaderboard,
    isOwner,
}: QuestLeaderboardProps) => {
    const { questData } = useQuestContext()
    const questStatus = questData?.status
    const questId = questData?.id
    const questName = questData?.name

    const [deleteState, setDeleteState] = useState({
        showDialog: false,
        participant: null as LeaderboardEntry | null,
        isDeleting: false,
    })
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
    const [shareLinks, setShareLinks] = useState<Record<string, string>>({})
    const [copyingLink, setCopyingLink] = useState<string | null>(null)

    const [_copiedText, copyToClipboard] = useCopyToClipboard()
    const queryClient = useQueryClient()

    const handleApiError = (error: unknown, message: string) => {
        console.error(message, error)
        toast.error('Operation failed', { description: 'Please try again.' })
    }

    const findMatchingShare = (
        shares: QuestShare[],
        entry: LeaderboardEntry
    ): QuestShare | undefined => {
        return shares.find(
            (share) =>
                share.guest_name === entry.display_name ||
                (share.guest_name === null && entry.display_name === 'Guest') ||
                (share.shared_with_user_id &&
                    share.invited_username === entry.display_name)
        )
    }

    const getEntryClasses = (entry: LeaderboardEntry, isOwner: boolean) => {
        const baseClasses =
            'flex flex-col gap-3 py-3 px-4 rounded-xl border-1 border-slate-400 transition-all duration-300 ease-out'
        const ownerClasses = isOwner ? 'cursor-pointer hover:shadow-sm' : ''
        const progressClasses =
            entry.observation_count > 0 ? 'bg-green-100' : 'bg-background'

        return `${baseClasses} ${ownerClasses} ${progressClasses}`
    }

    const handleCopyShareLink = async (entry: LeaderboardEntry) => {
        const entryKey = `${entry.display_name}-${entry.invited_at}`
        setCopyingLink(entryKey)

        const shareUrl = shareLinks[entryKey]

        if (shareUrl) {
            try {
                await copyToClipboard(shareUrl)
                toast.success('Link Copied!', {
                    description: `The share link for ${entry.display_name || 'Guest'} has been copied to your clipboard.`,
                })
            } catch (error) {
                console.error('Failed to copy link:', error)
                toast.error('Failed to copy link', {
                    description: 'An error occurred while copying the link.',
                })
            }
        } else {
            toast.error('Link not available', {
                description:
                    'The share link is not ready yet. Please try again.',
            })
        }

        setCopyingLink(null)
    }

    // Fetch share links for all entries
    useEffect(() => {
        const fetchShareLinks = async () => {
            if (!leaderboard || !questId || !isOwner) return

            const links: Record<string, string> = {}

            for (const entry of leaderboard) {
                if (!entry.is_primary) {
                    const entryKey = `${entry.display_name}-${entry.invited_at}`
                    try {
                        const shareUrl = await buildShareLink(entry)
                        if (shareUrl) {
                            links[entryKey] = shareUrl
                        }
                    } catch (error) {
                        console.error(
                            'Failed to fetch share link for entry:',
                            entry.display_name,
                            error
                        )
                    }
                }
            }

            setShareLinks(links)
        }

        fetchShareLinks()
    }, [leaderboard, questId, isOwner])

    const handleDeleteClick = (entry: LeaderboardEntry) => {
        setDeleteState((prev) => ({
            ...prev,
            participant: entry,
            showDialog: true,
        }))
    }

    const toggleEntryExpansion = (entryKey: string) => {
        setExpandedEntry(expandedEntry === entryKey ? null : entryKey)
    }

    const handleEntryClick = (entryKey: string) => (e: React.MouseEvent) => {
        e.stopPropagation()
        if (questId && isOwner) {
            toggleEntryExpansion(entryKey)
        }
    }

    const handleActionClick = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation()
        action()
    }

    const handleShareClick =
        (entry: LeaderboardEntry) => (e: React.MouseEvent) => {
            e.stopPropagation()
            handleShare(entry, e)
        }

    const confirmDeleteParticipant = async () => {
        if (!deleteState.participant || !questId) return

        setDeleteState((prev) => ({ ...prev, isDeleting: true }))

        try {
            const { data: shares } = await api.get(
                `/quest-sharing/quests/${questId}/shares`
            )
            const matchingShare = findMatchingShare(
                shares,
                deleteState.participant!
            )

            if (matchingShare) {
                await api.delete(`/quest-sharing/shares/${matchingShare.id}`)
                queryClient.invalidateQueries({
                    queryKey: ['leaderboard', questId],
                })
            }
        } catch (error) {
            handleApiError(error, 'Failed to remove participant')
        } finally {
            setDeleteState({
                showDialog: false,
                participant: null,
                isDeleting: false,
            })
        }
    }

    const buildShareLink = async (entry: LeaderboardEntry): Promise<string> => {
        if (!questId) {
            console.error('No quest ID provided')
            return ''
        }

        try {
            const { data: shares } = await api.get(
                `/quest-sharing/quests/${questId}/shares`
            )
            const matchingShare = findMatchingShare(shares, entry)

            if (matchingShare) {
                const shareUrl = `${window.location.origin}/share/${matchingShare.token}`
                clientDebug.ui(
                    'Generated share URL: %s for entry: %s',
                    shareUrl,
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
        } catch (error) {
            console.error('Failed to get share link', error)
            return ''
        }
    }

    const handleShare = async (
        entry: LeaderboardEntry,
        e: React.MouseEvent
    ) => {
        e.stopPropagation()

        const loadingToast = toast.loading('Generating link...', {
            description: 'Please wait while we prepare the share link.',
        })

        try {
            const shareUrl = await buildShareLink(entry)

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
                    // User cancelled share or share failed
                    if ((shareError as Error).name !== 'AbortError') {
                        console.warn('Native share failed:', shareError)
                        toast.error('Failed to share link', {
                            description:
                                'The share link is displayed above for manual sharing.',
                        })
                    }
                }
            } else {
                toast.info('Share Link Available', {
                    description:
                        'The share link is displayed above. Copy it manually to share.',
                })
            }
        } catch (error) {
            toast.dismiss(loadingToast)
            console.error('Error sharing link:', error)
            toast.error('Failed to share link', {
                description: 'An error occurred while sharing the link.',
            })
        }
    }

    return (
        <div>
            {questStatus === 'pending' && (
                <div className="text-sm text-amber-600 mb-3 bg-amber-50 p-3 rounded-md border border-amber-200">
                    🕒 Quest hasn't started yet. Leaderboard will show progress
                    once the quest begins.
                </div>
            )}

            {!leaderboard?.length ? (
                <div className="text-left text-muted-foreground py-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                    {questStatus === 'pending'
                        ? 'Quest participants will appear here once the quest starts.'
                        : 'No participants have joined this quest yet.'}
                </div>
            ) : (
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
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 30,
                                            delay: index * 0.05,
                                        }}
                                        className={getEntryClasses(
                                            entry,
                                            !!isOwner
                                        )}
                                        onClick={handleEntryClick(entryKey)}
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
                                                <div className="flex items-center gap-3">
                                                    <AvatarGroup
                                                        displayName={
                                                            entry.display_name ||
                                                            'Guest'
                                                        }
                                                        className="w-14 h-14 border-0"
                                                        linkToProfile={
                                                            entry.is_registered_user
                                                        }
                                                    />
                                                    <div className="flex flex-col">
                                                        {entry.is_registered_user ? (
                                                            <Link
                                                                to={`/users/${entry.display_name}`}
                                                                className="hover:underline"
                                                            >
                                                                <motion.span className="font-medium">
                                                                    {
                                                                        entry.display_name
                                                                    }
                                                                </motion.span>
                                                            </Link>
                                                        ) : (
                                                            <motion.span className="font-medium">
                                                                {entry.display_name ||
                                                                    'Guest'}
                                                            </motion.span>
                                                        )}
                                                        <motion.span
                                                            className={`text-xs px-2 py-0.5 rounded-full w-fit ${badgeStyles}`}
                                                        >
                                                            {badgeType}
                                                        </motion.span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                    <span
                                                        className={`text-sm font-medium ${
                                                            entry.observation_count >
                                                            0
                                                                ? 'text-green-700'
                                                                : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {
                                                            entry.observation_count
                                                        }{' '}
                                                        taxa found
                                                    </span>
                                                    {entry.observation_count >
                                                        0 &&
                                                        entry.last_progress_at && (
                                                            <div className="text-xs text-green-600 mt-0.5">
                                                                Last active:{' '}
                                                                {new Date(
                                                                    entry.last_progress_at
                                                                ).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                </div>
                                                {questId &&
                                                    isOwner &&
                                                    !entry.is_primary && (
                                                        <div className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors">
                                                            <FaChevronDown className="h-3 w-3" />
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Footer row: Action buttons */}
                                        {questId &&
                                            isOwner &&
                                            !entry.is_primary && (
                                                <ActionFooter
                                                    expanded={isExpanded}
                                                    onCopyLink={handleActionClick(
                                                        () =>
                                                            handleCopyShareLink(
                                                                entry
                                                            )
                                                    )}
                                                    onShare={handleShareClick(
                                                        entry
                                                    )}
                                                    onRemove={handleActionClick(
                                                        () =>
                                                            handleDeleteClick(
                                                                entry
                                                            )
                                                    )}
                                                    copyingLink={copyingLink}
                                                    entry={entry}
                                                />
                                            )}
                                    </motion.div>
                                )
                            }
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteState.showDialog}
                onOpenChange={(open) =>
                    setDeleteState((prev) => ({ ...prev, showDialog: open }))
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Participant</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove{' '}
                            <strong>
                                {deleteState.participant?.display_name}
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
                                <li>All of their progress and observations</li>
                                <li>Their access to this quest</li>
                                <li>
                                    Any leaderboard rankings they've achieved
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
                            onClick={() =>
                                setDeleteState((prev) => ({
                                    ...prev,
                                    showDialog: false,
                                }))
                            }
                            disabled={deleteState.isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={confirmDeleteParticipant}
                            disabled={deleteState.isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteState.isDeleting
                                ? 'Removing…'
                                : 'Remove Participant'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
