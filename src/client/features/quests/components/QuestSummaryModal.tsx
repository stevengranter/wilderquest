import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
    X,
    Share2,
    Download,
    Calendar,
    Users,
    Target,
    TrendingUp,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeaderboardEntry } from '@/features/quests/types'
import { AvatarOverlay } from './AvatarOverlay'
import { Quest } from '../../../../types/types'
import { INatTaxon } from '../../../../shared/types/iNatTypes'
import { QuestMapping, DetailedProgress } from '../types'

type TaxonWithProgress = INatTaxon & {
    mapping?: QuestMapping
    progressCount: number
    recentEntries: DetailedProgress[]
    isFound: boolean
}

interface QuestSummaryModalProps {
    isOpen: boolean
    onClose: () => void
    questData: Quest
    leaderboard: LeaderboardEntry[]
    taxaWithProgress: TaxonWithProgress[]
    totalParticipants: number
}

interface QuestStats {
    totalObservations: number
    completionRate: number
    questDuration: string
    mostActiveParticipant: LeaderboardEntry | null
    totalSpecies: number
    completedSpecies: number
}

export function QuestSummaryModal({
    isOpen,
    onClose,
    questData,
    leaderboard,
    taxaWithProgress,
    totalParticipants,
}: QuestSummaryModalProps) {
    const [showConfetti, setShowConfetti] = useState(false)

    // Calculate quest statistics
    const stats: QuestStats = {
        totalObservations: leaderboard.reduce(
            (sum, entry) => sum + entry.observation_count,
            0
        ),
        completionRate:
            taxaWithProgress.length > 0
                ? (taxaWithProgress.filter((taxon) => taxon.progressCount > 0)
                      .length /
                      taxaWithProgress.length) *
                  100
                : 0,
        questDuration: calculateQuestDuration(
            questData?.starts_at,
            questData?.ends_at
        ),
        mostActiveParticipant: leaderboard.length > 0 ? leaderboard[0] : null,
        totalSpecies: taxaWithProgress.length,
        completedSpecies: taxaWithProgress.filter(
            (taxon) => taxon.progressCount > 0
        ).length,
    }

    // Trigger confetti animation when modal opens
    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true)
            const timer = setTimeout(() => setShowConfetti(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const handleShare = () => {
        const shareText = `🎉 I just completed the "${questData?.name}" quest! Found ${stats.totalObservations} species with ${totalParticipants} participants. Check it out!`
        if (navigator.share) {
            navigator.share({
                title: `Quest Completed: ${questData?.name}`,
                text: shareText,
                url: window.location.href,
            })
        } else {
            navigator.clipboard.writeText(
                `${shareText} ${window.location.href}`
            )
            // Could show a toast notification here
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
                <DialogHeader className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-center"
                    >
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                            🎉 Quest Complete!
                        </DialogTitle>
                        <p className="text-xl text-gray-700 font-medium">
                            {questData?.name}
                        </p>
                    </motion.div>

                    <Button
                        variant="neutral"
                        size="sm"
                        onClick={onClose}
                        className="absolute right-4 top-4 hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="space-y-8">
                    {/* Celebration Confetti Effect */}
                    <AnimatePresence>
                        {showConfetti && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                        initial={{
                                            x:
                                                Math.random() *
                                                window.innerWidth,
                                            y: -10,
                                            rotate: 0,
                                        }}
                                        animate={{
                                            y: window.innerHeight + 10,
                                            rotate: 360,
                                            transition: {
                                                duration: 2 + Math.random() * 2,
                                                delay: Math.random() * 0.5,
                                            },
                                        }}
                                        style={{
                                            left: Math.random() * 100 + '%',
                                        }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quest Statistics */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <StatCard
                            icon={<Users className="h-6 w-6 text-blue-600" />}
                            label="Participants"
                            value={totalParticipants.toString()}
                            delay={0.5}
                        />
                        <StatCard
                            icon={<Target className="h-6 w-6 text-green-600" />}
                            label="Species Found"
                            value={`${stats.completedSpecies}/${stats.totalSpecies}`}
                            delay={0.6}
                        />
                        <StatCard
                            icon={
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            }
                            label="Total Observations"
                            value={stats.totalObservations.toString()}
                            delay={0.7}
                        />
                        <StatCard
                            icon={
                                <Calendar className="h-6 w-6 text-orange-600" />
                            }
                            label="Quest Duration"
                            value={stats.questDuration}
                            delay={0.8}
                        />
                    </motion.div>

                    {/* Top Performers */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                        className="bg-white rounded-lg p-6 shadow-lg border border-gray-200"
                    >
                        <h3 className="text-xl font-semibold mb-4 text-center">
                            🏆 Top Performers
                        </h3>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {leaderboard.slice(0, 5).map((entry, index) => (
                                    <motion.div
                                        key={entry.display_name}
                                        initial={{
                                            opacity: 0,
                                            x: -50,
                                            scale: 0.9,
                                        }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                            delay: 1.0 + index * 0.1,
                                            type: 'spring',
                                            stiffness: 200,
                                            damping: 20,
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-lg ${
                                            index === 0
                                                ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300'
                                                : index === 1
                                                  ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300'
                                                  : index === 2
                                                    ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300'
                                                    : 'bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <motion.div
                                                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                                    index === 0
                                                        ? 'bg-yellow-500'
                                                        : index === 1
                                                          ? 'bg-gray-400'
                                                          : index === 2
                                                            ? 'bg-orange-500'
                                                            : 'bg-blue-500'
                                                } text-white font-bold text-lg`}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{
                                                    delay: 1.2 + index * 0.1,
                                                    type: 'spring',
                                                    stiffness: 300,
                                                }}
                                            >
                                                {index === 0
                                                    ? '🥇'
                                                    : index === 1
                                                      ? '🥈'
                                                      : index === 2
                                                        ? '🥉'
                                                        : `#${index + 1}`}
                                            </motion.div>
                                            <AvatarOverlay
                                                displayName={
                                                    entry.display_name ||
                                                    'Guest'
                                                }
                                                className="w-12 h-12 border-2 border-white shadow-sm"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    {entry.display_name ||
                                                        'Guest'}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {entry.observation_count}{' '}
                                                    species found
                                                </p>
                                            </div>
                                        </div>
                                        {entry.last_progress_at && (
                                            <div className="text-xs text-gray-500">
                                                Last active:{' '}
                                                {new Date(
                                                    entry.last_progress_at
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Quest Completion Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.6 }}
                        className="bg-white rounded-lg p-6 shadow-lg border border-gray-200"
                    >
                        <h3 className="text-xl font-semibold mb-4 text-center">
                            📊 Quest Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">
                                    Completion Progress
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Species Found</span>
                                        <span>
                                            {stats.completedSpecies}/
                                            {stats.totalSpecies}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <motion.div
                                            className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${stats.completionRate}%`,
                                            }}
                                            transition={{
                                                delay: 1.6,
                                                duration: 1.5,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {stats.completionRate.toFixed(1)}% of
                                        all species discovered
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">
                                    Participation Stats
                                </h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm">
                                            Total Participants
                                        </span>
                                        <Badge variant="neutral">
                                            {totalParticipants}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">
                                            Active Contributors
                                        </span>
                                        <Badge variant="neutral">
                                            {
                                                leaderboard.filter(
                                                    (entry) =>
                                                        entry.observation_count >
                                                        0
                                                ).length
                                            }
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">
                                            Average per Person
                                        </span>
                                        <Badge variant="neutral">
                                            {totalParticipants > 0
                                                ? (
                                                      stats.totalObservations /
                                                      totalParticipants
                                                  ).toFixed(1)
                                                : '0'}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">
                                            Active Contributors
                                        </span>
                                        <Badge variant="neutral">
                                            {
                                                leaderboard.filter(
                                                    (entry) =>
                                                        entry.observation_count >
                                                        0
                                                ).length
                                            }
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm">
                                            Average per Person
                                        </span>
                                        <Badge variant="neutral">
                                            {totalParticipants > 0
                                                ? (
                                                      stats.totalObservations /
                                                      totalParticipants
                                                  ).toFixed(1)
                                                : '0'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
                    >
                        <Button
                            onClick={handleShare}
                            className="flex items-center gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Share Results
                        </Button>
                        <Button
                            variant="neutral"
                            onClick={onClose}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Close Summary
                        </Button>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helper component for animated stat cards
function StatCard({
    icon,
    label,
    value,
    delay,
}: {
    icon: React.ReactNode
    label: string
    value: string
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay,
                duration: 0.5,
                type: 'spring',
                stiffness: 200,
            }}
            className="bg-white rounded-lg p-4 shadow-md border border-gray-200 text-center hover:shadow-lg transition-shadow"
        >
            <div className="flex justify-center mb-2">{icon}</div>
            <motion.div
                className="text-2xl font-bold text-gray-800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    delay: delay + 0.2,
                    type: 'spring',
                    stiffness: 300,
                }}
            >
                {value}
            </motion.div>
            <div className="text-sm text-gray-600 mt-1">{label}</div>
        </motion.div>
    )
}

// Helper function to calculate quest duration
function calculateQuestDuration(
    startDate?: string | Date | null,
    endDate?: string | Date | null
): string {
    if (!startDate || !endDate) return 'Unknown'

    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '1 day'
    if (diffDays < 7) return `${diffDays} days`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`
    return `${Math.floor(diffDays / 30)} months`
}
