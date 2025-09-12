import { AnimatePresence, motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera } from 'lucide-react'
import { ClientQuest } from '@/types/questTypes'
import { FoundButton } from './FoundButton'
import { INatTaxon } from '@shared/types/iNaturalist'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { ObservationDialog } from './ObservationDialog'
import { Observation } from './ObservationCard'
import { cn } from '@/lib/utils'
import { LoggedInUser } from '@/types/authTypes'
import { JSX, useState } from 'react'
import { SingleAvatar } from './SingleAvatar'
import { AvatarGroup } from './AvatarGroup'
import { Link } from 'react-router-dom'
import { DetailedProgress, QuestMapping, Share } from '@/types/questTypes'
import { useSpeciesActions } from '@/hooks/useSpeciesActions'
import { useQuestContext } from './QuestContext'

type TaxaWithProgress = INatTaxon & {
    mapping?: QuestMapping
    progressCount: number
    recentEntries: DetailedProgress[]
}

type QuestListViewProps = {
    taxaWithProgress: TaxaWithProgress[]
}

function SpeciesListCard(props: {
    taxon: TaxaWithProgress
    onClick: (e: React.MouseEvent) => Promise<void>
    callbackfn: (entry: DetailedProgress) => JSX.Element
    hoverEffect?: 'lift' | 'shadow' | 'none'
}) {
    // Use QuestContext for all values
    const questContext = useQuestContext()
    const { questData, isOwner, token, share, user, detailedProgress } =
        questContext

    // Get canInteract function
    const { canInteract } = useSpeciesActions({
        isOwner,
        token,
        questData: questData ? { status: questData.status } : undefined,
        user: user || undefined,
        share,
    })
    const hoverClasses = {
        lift: 'hover:shadow-shadow hover:-translate-y-2 duration-250',
        shadow: 'hover:shadow-shadow',
        none: '',
    }

    // Determine avatar overlay for competitive/cooperative quests
    let avatarOverlay = null
    if (props.taxon.recentEntries.length > 0) {
        if (questData?.mode === 'competitive') {
            // For competitive mode, show only the most recent finder
            const mostRecentEntry = props.taxon.recentEntries.sort(
                (a, b) =>
                    new Date(b.observed_at).getTime() -
                    new Date(a.observed_at).getTime()
            )[0]
            avatarOverlay = {
                username: mostRecentEntry.display_name,
                isRegistered: mostRecentEntry.is_registered_user,
            }
        } else if (questData?.mode === 'cooperative') {
            // For cooperative mode, show all users who found it
            const uniqueEntries = props.taxon.recentEntries.filter(
                (entry, index, arr) =>
                    arr.findIndex(
                        (e) => e.display_name === entry.display_name
                    ) === index
            )

            // Find the first finder (earliest observation)
            const firstFinderEntry = props.taxon.recentEntries.sort(
                (a, b) =>
                    new Date(a.observed_at).getTime() -
                    new Date(b.observed_at).getTime()
            )[0]

            avatarOverlay = {
                users: uniqueEntries.map((entry) => ({
                    username: entry.display_name,
                    isRegistered: entry.is_registered_user,
                })),
                firstFinder: firstFinderEntry.display_name,
            }
        }
    }

    const cardContent = (
        <Card
            className={cn(
                'p-4 shadow-0 border-1',
                props.hoverEffect && hoverClasses[props.hoverEffect]
            )}
        >
            <div className="flex items-start gap-4">
                {/* Taxon Image */}
                <div className="flex-shrink-0 relative">
                    {props.taxon.default_photo ? (
                        <img
                            src={props.taxon.default_photo.medium_url}
                            alt={props.taxon.name}
                            className="w-20 h-20 object-cover rounded-lg"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                    )}
                    {avatarOverlay &&
                        ('users' in avatarOverlay ? (
                            // Multiple users (cooperative mode)
                            <AvatarGroup
                                users={avatarOverlay.users}
                                firstFinder={avatarOverlay.firstFinder}
                                maxAvatars={3}
                                size={24}
                                className="border-0"
                            />
                        ) : (
                            // Single user (competitive mode)
                            <SingleAvatar
                                username={avatarOverlay.username}
                                isRegistered={avatarOverlay.isRegistered}
                                size={24}
                                className="w-6 h-6 border-0"
                            />
                        ))}
                </div>

                {/* Taxon Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {props.taxon.preferred_common_name ||
                                    props.taxon.name}
                            </h3>
                            <p className="text-sm text-gray-500 italic">
                                {props.taxon.name}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {props.taxon.observations_count?.toLocaleString() ||
                                            0}{' '}
                                        observations
                                    </span>
                                </div>
                                <Badge variant="neutral" className="capitalize">
                                    {props.taxon.rank}
                                </Badge>
                            </div>
                        </div>

                        {/* Progress Status */}
                        <div className="flex items-center gap-2">
                            {props.taxon.progressCount > 0 && (
                                <Badge className="bg-emerald-600 text-white">
                                    Found x{props.taxon.progressCount}
                                </Badge>
                            )}

                            {(isOwner || token) && props.taxon.mapping && (
                                <FoundButton
                                    mapping={props.taxon.mapping}
                                    progressCount={props.taxon.progressCount}
                                    detailedProgress={detailedProgress}
                                    questContext={{
                                        questData: {
                                            ...questData!,
                                            username: questData!.username || '',
                                        } as ClientQuest,
                                        user: user || undefined,
                                        share,
                                        token,
                                        isOwner,
                                        canInteract: (status?: string) =>
                                            Boolean(canInteract(status)),
                                    }}
                                    onClick={props.onClick}
                                    variant={
                                        props.taxon.progressCount > 0
                                            ? 'neutral'
                                            : 'default'
                                    }
                                    size="sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {props.taxon.recentEntries &&
                        props.taxon.recentEntries.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Recent Activity
                                </h4>
                                <div className="space-y-1">
                                    {props.taxon.recentEntries.map(
                                        props.callbackfn
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </Card>
    )

    if (questData?.latitude && questData?.longitude) {
        return (
            <>
                <ObservationDialog
                    species={props.taxon}
                    found={props.taxon.progressCount > 0}
                >
                    {cardContent}
                </ObservationDialog>
            </>
        )
    }

    return cardContent
}

export const QuestListView = ({ taxaWithProgress }: QuestListViewProps) => {
    // Use QuestContext for all other values
    const questContext = useQuestContext()
    const { questData, isOwner, token, share, user, detailedProgress } =
        questContext

    // Handle null questData
    if (!questData) {
        return <div>Loading...</div>
    }

    return (
        <AnimatePresence mode="popLayout">
            <motion.div className="space-y-3" layout>
                {taxaWithProgress.map((taxon, index) => (
                    <motion.div
                        key={taxon.id}
                        layout
                        layoutId={`species-${taxon.id}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{
                            delay: index * 0.05,
                            layout: {
                                duration: 0.4,
                                type: 'spring',
                                damping: 25,
                                stiffness: 200,
                            },
                            default: { duration: 0.3 },
                        }}
                    >
                        <SpeciesListCard
                            key={taxon.id}
                            taxon={taxon}
                            hoverEffect="lift"
                            onClick={async (e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                try {
                                    let progress
                                    if (!taxon.mapping) return

                                    if (isOwner) {
                                        progress = detailedProgress?.find(
                                            (p) =>
                                                p.display_name ===
                                                    user?.username &&
                                                p.mapping_id ===
                                                    taxon.mapping!.id
                                        )
                                    } else if (token) {
                                        progress = detailedProgress?.find(
                                            (p) =>
                                                p.display_name ===
                                                    share?.guest_name &&
                                                p.mapping_id ===
                                                    taxon.mapping!.id
                                        )
                                    }
                                    const next = !progress

                                    if (isOwner) {
                                        await api.post(
                                            `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping!.id}`,
                                            { observed: next }
                                        )
                                    } else if (token) {
                                        await api.post(
                                            `/quest-sharing/shares/token/${token}/progress/${taxon.mapping!.id}`,
                                            { observed: next }
                                        )
                                    }

                                    // Toast will be shown via real-time events
                                } catch (error: unknown) {
                                    // Handle specific competitive mode conflict
                                    const axiosError = error as {
                                        response?: {
                                            status?: number
                                            data?: { message?: string }
                                        }
                                    }
                                    if (axiosError?.response?.status === 409) {
                                        toast.error(
                                            axiosError?.response?.data
                                                ?.message ||
                                                'This species has already been found by another participant in competitive mode'
                                        )
                                    } else {
                                        toast.error('Failed to update progress')
                                    }
                                }
                            }}
                            callbackfn={(entry: DetailedProgress) => (
                                <div
                                    key={entry.progress_id}
                                    className="text-xs text-gray-600"
                                >
                                    <span className="font-medium">
                                        {entry.display_name || 'Someone'}
                                    </span>
                                    {' found this species on '}
                                    <span>
                                        {new Date(
                                            entry.observed_at
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </AnimatePresence>
    )
}
