import { AnimatePresence, motion } from 'motion/react'
import {
    Calendar,
    Download,
    Share2,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap,
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
import { Quest } from '../../../types/questTypes'
import { INatTaxon } from '@shared/types/iNaturalist'
import { DetailedProgress, QuestMapping } from '../types'
import { useEffect, useState } from 'react'

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
            <DialogContent className="sm:max-w-[80%] h-[80%] max-h-[90%] overflow-y-auto bg-yellow-100 border border-black rounded-md p-0">
                <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 p-8">
                    <DialogHeader className="relative mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -30, rotate: -5 }}
                            animate={{ opacity: 1, y: 0, rotate: 0 }}
                            transition={{
                                delay: 0.2,
                                duration: 0.8,
                                type: 'spring',
                            }}
                            className="text-center"
                        >
                            <div className="bg-yellow-300 border border-black p-6 rounded-md transform  mb-6 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-50"></div>
                                <DialogTitle className="text-5xl font-black text-black mb-2 relative z-10">
                                    Quest Complete!
                                </DialogTitle>
                                {/*<motion.div
                                    className="absolute top-2 right-2 text-6xl opacity-20"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                    }}
                                >
                                    ⚡
                                </motion.div>*/}
                            </div>
                            <div className="bg-white border border-black p-4 rounded-md">
                                <p className="text-2xl text-black font-bold uppercase">
                                    {questData?.name}
                                </p>
                            </div>
                        </motion.div>
                        {/*
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onClose}
                            className="absolute right-4 top-4 bg-red-400 hover:bg-red-500 border border-black rounded-md font-bold"
                        >
                            <X className="h-5 w-5 text-black" />
                        </Button>*/}
                    </DialogHeader>

                    <div className="space-y-8">
                        {/* Celebration Confetti Effect */}
                        <AnimatePresence>
                            {showConfetti && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 pointer-events-none z-50"
                                >
                                    {Array.from({ length: 60 }).map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className={`absolute w-3 h-3 rounded-full ${
                                                [
                                                    'bg-yellow-400',
                                                    'bg-pink-400',
                                                    'bg-blue-400',
                                                    'bg-green-400',
                                                    'bg-purple-400',
                                                ][i % 5]
                                            }`}
                                            initial={{
                                                x:
                                                    Math.random() *
                                                    window.innerWidth,
                                                y: -20,
                                                rotate: 0,
                                                scale: 0,
                                            }}
                                            animate={{
                                                y: window.innerHeight + 20,
                                                rotate: 720,
                                                scale: [0, 1, 0.5, 0],
                                                transition: {
                                                    duration:
                                                        3 + Math.random() * 2,
                                                    delay: Math.random() * 1,
                                                    ease: 'easeOut',
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
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-6"
                        >
                            <StatCard
                                icon={<Users className="h-8 w-8 text-black" />}
                                label="PARTICIPANTS"
                                value={totalParticipants.toString()}
                                delay={0.5}
                                color="bg-blue-300"
                            />
                            <StatCard
                                icon={<Target className="h-8 w-8 text-black" />}
                                label="SPECIES FOUND"
                                value={`${stats.completedSpecies}/${stats.totalSpecies}`}
                                delay={0.6}
                                color="bg-green-300"
                            />
                            <StatCard
                                icon={
                                    <TrendingUp className="h-8 w-8 text-black" />
                                }
                                label="TOTAL OBSERVATIONS"
                                value={stats.totalObservations.toString()}
                                delay={0.7}
                                color="bg-purple-300"
                            />
                            <StatCard
                                icon={
                                    <Calendar className="h-8 w-8 text-black" />
                                }
                                label="QUEST DURATION"
                                value={stats.questDuration}
                                delay={0.8}
                                color="bg-pink-300"
                            />
                        </motion.div>

                        {/* Top Performers */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="p-8"
                        >
                            <div className="bg-orange-300 border border-black p-4 mb-6 rounded-md">
                                <h3 className="text-3xl font-black uppercase text-center text-black flex items-center justify-center gap-3">
                                    <Trophy className="h-8 w-8" />
                                    TOP PERFORMERS
                                    <Trophy className="h-8 w-8" />
                                </h3>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {leaderboard
                                        .slice(0, 5)
                                        .map((entry, index) => (
                                            <motion.div
                                                key={entry.display_name}
                                                initial={{
                                                    opacity: 0,
                                                    x: -100,
                                                    scale: 0.8,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    scale: 1,
                                                }}
                                                transition={{
                                                    delay: 1.0 + index * 0.1,
                                                    type: 'spring',
                                                    stiffness: 200,
                                                    damping: 20,
                                                }}
                                                className={`flex items-center justify-between p-6 border border-black rounded-md ${
                                                    index === 0
                                                        ? 'bg-gradient-to-r from-yellow-300 to-yellow-200'
                                                        : index === 1
                                                          ? 'bg-gradient-to-r from-gray-300 to-gray-200'
                                                          : index === 2
                                                            ? 'bg-gradient-to-r from-orange-300 to-orange-200'
                                                            : 'bg-gradient-to-r from-blue-200 to-blue-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <motion.div
                                                        className={`flex items-center justify-center w-16 h-16 border border-black rounded-md font-black text-2xl ${
                                                            index === 0
                                                                ? 'bg-yellow-400'
                                                                : index === 1
                                                                  ? 'bg-gray-400'
                                                                  : index === 2
                                                                    ? 'bg-orange-400'
                                                                    : 'bg-blue-400'
                                                        }`}
                                                        initial={{
                                                            scale: 0,
                                                            rotate: -180,
                                                        }}
                                                        animate={{
                                                            scale: 1,
                                                            rotate: 0,
                                                        }}
                                                        transition={{
                                                            delay:
                                                                1.2 +
                                                                index * 0.1,
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
                                                        className="w-16 h-16 border border-black rounded-md"
                                                    />
                                                    <div>
                                                        <p className="font-black text-xl text-black uppercase">
                                                            {entry.display_name ||
                                                                'Guest'}
                                                        </p>
                                                        <div className="bg-black text-white px-3 py-1 text-sm font-bold uppercase">
                                                            {
                                                                entry.observation_count
                                                            }{' '}
                                                            species found
                                                        </div>
                                                    </div>
                                                </div>
                                                {entry.last_progress_at && (
                                                    <div className="text-sm font-bold text-black bg-white px-3 py-2 border border-black rounded-md">
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
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                            className="p-8"
                        >
                            <div className="bg-green-300 border border-black p-4 mb-6 rounded-md">
                                <h3 className="text-3xl font-black uppercase text-center text-black flex items-center justify-center gap-3">
                                    <Zap className="h-8 w-8" />
                                    QUEST SUMMARY
                                    <Zap className="h-8 w-8" />
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-yellow-200 border border-black p-6 rounded-md">
                                    <h4 className="font-black text-xl text-black mb-4 uppercase border-b border-black pb-2">
                                        COMPLETION PROGRESS
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>SPECIES FOUND</span>
                                            <span className="bg-black text-white px-2 py-1 rounded-md">
                                                {stats.completedSpecies}/
                                                {stats.totalSpecies}
                                            </span>
                                        </div>
                                        <div className="w-full bg-black border border-black h-8 rounded-md relative overflow-hidden">
                                            <motion.div
                                                className="bg-gradient-to-r from-green-400 to-blue-400 h-full border-r border-black rounded-r-md relative"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${stats.completionRate}%`,
                                                }}
                                                transition={{
                                                    delay: 1.6,
                                                    duration: 2,
                                                    ease: 'easeOut',
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30"></div>
                                            </motion.div>
                                        </div>
                                        <p className="text-lg font-bold text-black bg-white border border-black px-4 py-2 rounded-md">
                                            {stats.completionRate.toFixed(1)}%
                                            DISCOVERED!
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-pink-200 border border-black p-6 rounded-md">
                                    <h4 className="font-black text-xl text-black mb-4 uppercase border-b border-black pb-2">
                                        PARTICIPATION STATS
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold">
                                                TOTAL PARTICIPANTS
                                            </span>
                                            <Badge className="bg-black text-white border border-black text-lg px-3 py-1 font-bold rounded-md">
                                                {totalParticipants}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold">
                                                ACTIVE CONTRIBUTORS
                                            </span>
                                            <Badge className="bg-black text-white border border-black text-lg px-3 py-1 font-bold rounded-md">
                                                {
                                                    leaderboard.filter(
                                                        (entry) =>
                                                            entry.observation_count >
                                                            0
                                                    ).length
                                                }
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold">
                                                AVERAGE PER PERSON
                                            </span>
                                            <Badge className="bg-black text-white border border-black text-lg px-3 py-1 font-bold rounded-md">
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
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.8, duration: 0.6 }}
                            className="flex flex-col sm:flex-row gap-6 justify-center pt-4"
                        >
                            <Button
                                onClick={handleShare}
                                className="flex items-center gap-3 bg-green-400 hover:bg-green-500 border border-black rounded-md text-black font-black text-xl py-6 px-8 uppercase tracking-wider transition-all duration-150"
                            >
                                <Share2 className="h-6 w-6" />
                                SHARE RESULTS
                            </Button>
                            <Button
                                variant="default"
                                onClick={onClose}
                                className="flex items-center gap-3 bg-blue-400 hover:bg-blue-500 border border-black rounded-md text-black font-black text-xl py-6 px-8 uppercase tracking-wider transition-all duration-150"
                            >
                                <Download className="h-6 w-6" />
                                CLOSE SUMMARY
                            </Button>
                        </motion.div>
                    </div>
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
    color,
}: {
    icon: React.ReactNode
    label: string
    value: string
    delay: number
    color: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            transition={{
                delay,
                duration: 0.6,
                type: 'spring',
                stiffness: 200,
            }}
            className={`${color} border border-black p-3 sm:p-4 lg:p-6 rounded-md text-center transition-all duration-150 cursor-pointer min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] flex flex-col justify-center`}
        >
            <div className="flex justify-center mb-2 sm:mb-3 bg-white border border-black p-1 sm:p-2 mx-auto w-fit rounded-md">
                {icon}
            </div>
            <motion.div
                className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-1 sm:mb-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    delay: delay + 0.2,
                    type: 'spring',
                    stiffness: 400,
                }}
            >
                {value}
            </motion.div>
            <div className="text-xs sm:text-sm font-bold text-black uppercase tracking-wide bg-white border border-black px-1 sm:px-2 py-1 text-center rounded-md">
                {label}
            </div>
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
