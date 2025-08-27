import { AnimatePresence, motion } from 'motion/react'
import { LeaderboardEntry } from '@/features/quests/types'

type QuestLeaderboardProps = {
    leaderboard: LeaderboardEntry[] | undefined
}

export const QuestLeaderboard = ({ leaderboard }: QuestLeaderboardProps) => {
    return (
        <div className="mt-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
            {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                    <AnimatePresence>
                        {leaderboard.map(
                            (entry: LeaderboardEntry, index: number) => (
                                <motion.div
                                    key={entry.display_name || index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-between items-center p-2 bg-gray-100 rounded-md"
                                >
                                    <span className="font-medium">
                                        {index + 1}.{' '}
                                        {entry.display_name || 'Anonymous'}
                                    </span>
                                    <span className="text-sm">
                                        {entry.observation_count} taxa found
                                    </span>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-left text-muted-foreground py-4">
                    No participants have joined yet.
                </div>
            )}
        </div>
    )
}
