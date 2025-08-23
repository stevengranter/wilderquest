import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera } from 'lucide-react'
import { ClientQuest, SpeciesCardWithObservations } from './SpeciesCardWithObservations'
import { AggregatedProgress, DetailedProgress, Share } from '../types'
import { INatTaxon } from '@shared/types/iNatTypes'
import { User } from '@/models/user'
import api from '@/api/api'
import { toast } from 'sonner'

type TaxaWithProgress = INatTaxon & {
    mapping?: any
    progressCount: number
    recentEntries: DetailedProgress[]
}

type QuestListViewProps = {
    taxaWithProgress: TaxaWithProgress[]
    questData: ClientQuest
    isOwner: boolean
    token?: string
    share?: Share
    user?: User | null
    detailedProgress?: DetailedProgress[]
    aggregatedProgress?: AggregatedProgress[]
    updateStatus: (status: any) => void
}

export const QuestListView = ({
    taxaWithProgress,
    questData,
    isOwner,
    token,
    share,
    user,
    detailedProgress,
    aggregatedProgress,
}: QuestListViewProps) => {
    return (
        <div className="space-y-4">
            {taxaWithProgress.map((taxon) => (
                <Card key={taxon.id} className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Taxon Image */}
                        <div className="flex-shrink-0">
                            {taxon.default_photo ? (
                                <img
                                    src={taxon.default_photo.medium_url}
                                    alt={taxon.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Camera className="h-8 w-8 text-gray-400" />
                                </div>
                            )}
                        </div>

                        {/* Taxon Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {taxon.preferred_common_name || taxon.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 italic">
                                        {taxon.name}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {taxon.observations_count?.toLocaleString() || 0} observations
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="capitalize">
                                            {taxon.rank}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Progress Status */}
                                <div className="flex items-center gap-2">
                                    {taxon.progressCount > 0 && (
                                        <Badge className="bg-emerald-600 text-white">
                                            Found x{taxon.progressCount}
                                        </Badge>
                                    )}
                                    
                                    {(isOwner || token) && taxon.mapping && (
                                        <Button
                                            size="sm"
                                            variant={taxon.progressCount > 0 ? "outline" : "default"}
                                            disabled={questData.status !== 'active'}
                                            onClick={async () => {
                                                try {
                                                    let progress
                                                    if (isOwner) {
                                                        progress = detailedProgress?.find(
                                                            (p) =>
                                                                p.display_name === user?.username &&
                                                                p.mapping_id === taxon.mapping.id
                                                        )
                                                    } else if (token) {
                                                        progress = detailedProgress?.find(
                                                            (p) =>
                                                                p.display_name === share?.guest_name &&
                                                                p.mapping_id === taxon.mapping.id
                                                        )
                                                    }
                                                    const next = !progress
                                                    
                                                    if (isOwner) {
                                                        await api.post(
                                                            `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping.id}`,
                                                            { observed: next }
                                                        )
                                                    } else if (token) {
                                                        await api.post(
                                                            `/quest-sharing/shares/token/${token}/progress/${taxon.mapping.id}`,
                                                            { observed: next }
                                                        )
                                                    }
                                                    
                                                    toast.success(next ? 'Marked as found!' : 'Marked as not found')
                                                } catch (error) {
                                                    toast.error('Failed to update progress')
                                                }
                                            }}
                                        >
                                            {taxon.progressCount > 0 ? 'Found' : 'Mark Found'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            {taxon.recentEntries && taxon.recentEntries.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Recent Activity
                                    </h4>
                                    <div className="space-y-1">
                                        {taxon.recentEntries.map((entry) => (
                                            <div key={entry.progress_id} className="text-xs text-gray-600">
                                                <span className="font-medium">
                                                    {entry.display_name || 'Someone'}
                                                </span>
                                                {' found this species on '}
                                                <span>
                                                    {new Date(entry.observed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
