import { AnimatePresence, motion } from 'motion/react'
import { LeaderboardEntry } from '@/features/quests/types'
import { AvatarOverlay } from '../../AvatarOverlay'

type QuestLeaderboardProps = {
    leaderboard: LeaderboardEntry[] | undefined
    questStatus?: 'pending' | 'active' | 'paused' | 'ended'
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
    return 'Participant'
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
        case 'Participant':
            return 'bg-purple-100 text-purple-600'
        default:
            return 'bg-gray-100 text-gray-600'
    }
}

export const QuestLeaderboard = ({
    leaderboard,
    questStatus,
}: QuestLeaderboardProps) => {
    return (
        <div className="mt-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>

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

                                return (
                                    <motion.div
                                        key={`${entry.display_name}-${entry.invited_at}`}
                                        layout
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
                                        layoutId={`leaderboard-${entry.display_name}-${entry.invited_at}`}
                                        className={`flex justify-between items-center p-3 rounded-md border transition-all duration-300 hover:shadow-md ${
                                            entry.observation_count > 0
                                                ? 'bg-green-50 border-green-200 shadow-sm'
                                                : 'bg-gray-50 border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-sm"
                                                layout
                                            >
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
                                                <motion.span
                                                    className="font-medium"
                                                    layout="position"
                                                >
                                                    {entry.display_name ||
                                                        'Guest'}
                                                </motion.span>
                                                <motion.span
                                                    className={`text-xs px-2 py-0.5 rounded-full w-fit ${badgeStyles}`}
                                                    layout="position"
                                                >
                                                    {badgeType}
                                                </motion.span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`text-sm font-medium ${
                                                    entry.observation_count > 0
                                                        ? 'text-green-700'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {entry.observation_count} taxa
                                                found
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
        </div>
    )
}
