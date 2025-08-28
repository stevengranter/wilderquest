import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera } from 'lucide-react'
import { ClientQuest } from './SpeciesCardWithObservations'
import { AggregatedProgress, DetailedProgress, QuestMapping, QuestStatus, Share } from '../types'
import { INatTaxon } from '@shared/types/iNatTypes'
import api from '@/api/api'
import { toast } from 'sonner'
import { ObservationDialog } from './ObservationDialog'
import { cn } from '@/lib/utils'
import { LoggedInUser } from '@shared/types/authTypes'
import { JSX } from 'react'
import { AvatarOverlay } from './AvatarOverlay'

type TaxaWithProgress = INatTaxon & {
    mapping?: QuestMapping
    progressCount: number
    recentEntries: DetailedProgress[]
}

type QuestListViewProps = {
    taxaWithProgress: TaxaWithProgress[]
    questData: ClientQuest
    isOwner: boolean
    token?: string
    share?: Share
    user?: LoggedInUser | null
    detailedProgress?: DetailedProgress[]
    aggregatedProgress?: AggregatedProgress[]
    updateStatus: (status: QuestStatus) => void
}

function SpeciesListCard(props: {
    taxon: TaxaWithProgress
    owner: boolean
    token: string | undefined
    status: 'pending' | 'active' | 'paused' | 'ended'
    onClick: (e: React.MouseEvent) => Promise<void>
    callbackfn: (entry: DetailedProgress) => JSX.Element
    latitude?: number
    longitude?: number
    locationName?: string
    hoverEffect?: 'lift' | 'shadow' | 'none'
    questMode?: 'competitive' | 'cooperative'
}) {
    const hoverClasses = {
        lift: 'hover:shadow-shadow hover:-translate-y-2 duration-250',
        shadow: 'hover:shadow-shadow',
        none: '',
    }

    // Determine avatar overlay for competitive/cooperative quests
    let avatarOverlay = null
    if (
        (props.questMode === 'competitive' ||
            props.questMode === 'cooperative') &&
        props.taxon.recentEntries.length > 0
    ) {
        // Get the most recent finder
        const mostRecentEntry = props.taxon.recentEntries.sort(
            (a, b) =>
                new Date(b.observed_at).getTime() -
                new Date(a.observed_at).getTime()
        )[0]
        avatarOverlay = {
            displayName: mostRecentEntry.display_name,
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
                    {avatarOverlay && (
                        <AvatarOverlay
                            displayName={avatarOverlay.displayName}
                            size={24}
                            className="w-6 h-6"
                        />
                    )}
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

                            {(props.owner || props.token) &&
                                props.taxon.mapping && (
                                    <Button
                                        size="sm"
                                        variant={
                                            props.taxon.progressCount > 0
                                                ? 'neutral'
                                                : 'default'
                                        }
                                        disabled={props.status !== 'active'}
                                        onClick={props.onClick}
                                    >
                                        {props.taxon.progressCount > 0
                                            ? 'Found'
                                            : 'Mark Found'}
                                    </Button>
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

    if (props.latitude && props.longitude) {
        return (
            <ObservationDialog
                species={props.taxon}
                latitude={props.latitude}
                longitude={props.longitude}
                locationName={props.locationName}
                found={props.taxon.progressCount > 0}
            >
                {cardContent}
            </ObservationDialog>
        )
    }

    return cardContent
}

export const QuestListView = ({
    taxaWithProgress,
    questData,
    isOwner,
    token,
    share,
    user,
    detailedProgress,
}: QuestListViewProps) => {
    return (
        <div className="space-y-3">
            {taxaWithProgress.map((taxon) => (
                <SpeciesListCard
                    key={taxon.id}
                    taxon={taxon}
                    owner={isOwner}
                    token={token}
                    status={questData.status}
                    latitude={questData.latitude}
                    longitude={questData.longitude}
                    locationName={questData.location_name}
                    hoverEffect="lift"
                    questMode={questData.mode}
                    onClick={async (e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        try {
                            let progress
                            if (!taxon.mapping) return

                            if (isOwner) {
                                progress = detailedProgress?.find(
                                    (p) =>
                                        p.display_name === user?.username &&
                                        p.mapping_id === taxon.mapping!.id
                                )
                            } else if (token) {
                                progress = detailedProgress?.find(
                                    (p) =>
                                        p.display_name === share?.guest_name &&
                                        p.mapping_id === taxon.mapping!.id
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

                            toast.success(
                                next
                                    ? 'Marked as found!'
                                    : 'Marked as not found'
                            )
                        } catch (_error) {
                            toast.error('Failed to update progress')
                        }
                    }}
                    callbackfn={(entry) => (
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
            ))}
        </div>
    )
}
