import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Grid, List, Map as MapIcon } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ClientQuest, SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { SpeciesCardSkeleton } from '@/features/quests/components/SpeciesCard'
import { QuestListView } from '../../QuestListView'
import { QuestMapView } from '../../QuestMapView'
import { AggregatedProgress, DetailedProgress, QuestMapping, QuestStatus, Share } from '@/features/quests/types'
import { INatTaxon } from '@shared/types/iNatTypes'
import { useAuth } from '@/hooks/useAuth'

type QuestSpeciesProps = {
    taxaWithProgress: (INatTaxon & {
        mapping: QuestMapping | undefined
        progressCount: number
        recentEntries: DetailedProgress[]
        isFound: boolean
    })[]
    questData: ClientQuest
    isOwner: boolean
    token: string | undefined
    share: Share | undefined
    detailedProgress: DetailedProgress[] | undefined
    aggregatedProgress: AggregatedProgress[] | undefined
    isTaxaFetchingNextPage: boolean
    taxaHasNextPage: boolean
    fetchNextTaxaPage: () => void
    taxa: INatTaxon[] | undefined
    mappings: QuestMapping[] | undefined
    updateStatus: (status: QuestStatus) => void
    isTaxaLoading: boolean
}

export const QuestSpecies = ({
    taxaWithProgress,
    questData,
    isOwner,
    token,
    share,
    detailedProgress,
    aggregatedProgress,
    isTaxaFetchingNextPage,
    taxaHasNextPage,
    fetchNextTaxaPage,
    taxa,
    mappings,
    updateStatus,
    isTaxaLoading,
}: QuestSpeciesProps) => {
    const { user } = useAuth()
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')

    const observer = useRef<IntersectionObserver | null>(null)
    const lastTaxonElementRef = useCallback(
        (node: HTMLDivElement) => {
            if (isTaxaFetchingNextPage) return
            if (observer.current) observer.current.disconnect()
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && taxaHasNextPage) {
                    fetchNextTaxaPage()
                }
            })
            if (node) observer.current.observe(node)
        },
        [isTaxaFetchingNextPage, taxaHasNextPage, fetchNextTaxaPage]
    )

    return (
        <div className="mt-8">
            {/* View Mode Controls */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                    Species ({mappings?.length ?? 0})
                </h2>
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value: 'grid' | 'list' | 'map') =>
                        value && setViewMode(value)
                    }
                    className="border-0 rounded-lg"
                >
                    <ToggleGroupItem value="grid" aria-label="Grid view">
                        <Grid className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="list" aria-label="List view">
                        <List className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="map" aria-label="Map view">
                        <MapIcon className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* View Content */}
            {viewMode === 'grid' && (
                <div className="space-y-8">
                    {/* Not Found Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">
                            Not Found (
                            {isTaxaLoading
                                ? '...'
                                : taxaWithProgress.filter((t) => !t.isFound)
                                      .length}
                            )
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6 auto-rows-fr">
                            <AnimatePresence mode="popLayout">
                                {isTaxaLoading
                                    ? // Show skeleton cards while loading
                                      Array.from({
                                          length: Math.min(
                                              mappings?.length || 6,
                                              6
                                          ),
                                      }).map((_, i) => (
                                          <motion.div
                                              key={`skeleton-not-found-${i}`}
                                              className="relative"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              exit={{ opacity: 0 }}
                                          >
                                              <SpeciesCardSkeleton />
                                          </motion.div>
                                      ))
                                    : taxaWithProgress
                                          .filter((t) => !t.isFound)
                                          .map((taxon, index, arr) => {
                                              return (
                                                  <motion.div
                                                      key={taxon.id}
                                                      ref={
                                                          index ===
                                                          arr.length - 1
                                                              ? lastTaxonElementRef
                                                              : null
                                                      }
                                                      className="relative"
                                                      initial={{ opacity: 0 }}
                                                      animate={{ opacity: 1 }}
                                                      exit={{ opacity: 0 }}
                                                  >
                                                      <SpeciesCardWithObservations
                                                          species={taxon}
                                                          questData={questData}
                                                          found={
                                                              taxon.progressCount >
                                                              0
                                                          }
                                                          avatarOverlay={null}
                                                          actionArea={
                                                              (isOwner ||
                                                                  token) &&
                                                              taxon.mapping && (
                                                                  <div className="p-2">
                                                                      <Button
                                                                          className="w-full shadow-0 border-1"
                                                                          size="sm"
                                                                          variant="neutral"
                                                                          disabled={
                                                                              questData.status !==
                                                                              'active'
                                                                          }
                                                                          onClick={async (
                                                                              e
                                                                          ) => {
                                                                              e.stopPropagation()
                                                                              if (
                                                                                  !taxon.mapping
                                                                              )
                                                                                  return // ✅ safety
                                                                              try {
                                                                                  let progress
                                                                                  if (
                                                                                      isOwner
                                                                                  ) {
                                                                                      progress =
                                                                                          detailedProgress?.find(
                                                                                              (
                                                                                                  p
                                                                                              ) =>
                                                                                                  p.display_name ===
                                                                                                      user?.username &&
                                                                                                  p.mapping_id ===
                                                                                                      taxon.mapping!
                                                                                                          .id
                                                                                          )
                                                                                  } else if (
                                                                                      token
                                                                                  ) {
                                                                                      progress =
                                                                                          detailedProgress?.find(
                                                                                              (
                                                                                                  p
                                                                                              ) =>
                                                                                                  p.display_name ===
                                                                                                      share?.guest_name &&
                                                                                                  p.mapping_id ===
                                                                                                      taxon.mapping!
                                                                                                          .id
                                                                                          )
                                                                                  }
                                                                                  const next =
                                                                                      !progress
                                                                                  if (
                                                                                      isOwner
                                                                                  ) {
                                                                                      await api.post(
                                                                                          `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping!.id}`,
                                                                                          {
                                                                                              observed:
                                                                                                  next,
                                                                                          }
                                                                                      )
                                                                                  } else if (
                                                                                      token
                                                                                  ) {
                                                                                      await api.post(
                                                                                          `/quest-sharing/shares/token/${token}/progress/${taxon.mapping!.id}`,
                                                                                          {
                                                                                              observed:
                                                                                                  next,
                                                                                          }
                                                                                      )
                                                                                  }
                                                                                  console.log(
                                                                                      'Progress updated'
                                                                                  )
                                                                              } catch (_e) {
                                                                                  toast.error(
                                                                                      'Action failed'
                                                                                  )
                                                                              }
                                                                          }}
                                                                      >
                                                                          Found
                                                                      </Button>
                                                                  </div>
                                                              )
                                                          }
                                                      />
                                                  </motion.div>
                                              )
                                          })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Found Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">
                            Found (
                            {isTaxaLoading
                                ? '...'
                                : taxaWithProgress.filter((t) => t.isFound)
                                      .length}
                            )
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-6 auto-rows-fr">
                            {isTaxaLoading
                                ? // Show skeleton cards while loading
                                  Array.from({
                                      length: Math.min(
                                          mappings?.length || 6,
                                          6
                                      ),
                                  }).map((_, i) => (
                                      <motion.div
                                          key={`skeleton-found-${i}`}
                                          className="relative"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                      >
                                          <SpeciesCardSkeleton />
                                      </motion.div>
                                  ))
                                : taxaWithProgress
                                      .filter((t) => t.isFound)
                                      .map((taxon) => {
                                          // Determine avatar overlay for competitive/cooperative quests
                                          let avatarOverlay = null
                                          if (
                                              (questData.mode ===
                                                  'competitive' ||
                                                  questData.mode ===
                                                      'cooperative') &&
                                              taxon.recentEntries.length > 0
                                          ) {
                                              // Get the most recent finder
                                              const mostRecentEntry =
                                                  taxon.recentEntries.sort(
                                                      (a, b) =>
                                                          new Date(
                                                              b.observed_at
                                                          ).getTime() -
                                                          new Date(
                                                              a.observed_at
                                                          ).getTime()
                                                  )[0]
                                              avatarOverlay = {
                                                  displayName:
                                                      mostRecentEntry.display_name,
                                              }
                                          }

                                          return (
                                              <div
                                                  key={taxon.id}
                                                  className="relative"
                                              >
                                                  <SpeciesCardWithObservations
                                                      species={taxon}
                                                      questData={questData}
                                                      found={
                                                          taxon.progressCount >
                                                          0
                                                      }
                                                      avatarOverlay={
                                                          avatarOverlay
                                                      }
                                                      actionArea={
                                                          (isOwner || token) &&
                                                          taxon.mapping && (
                                                              <div className="p-2">
                                                                  <Button
                                                                      className="w-full shadow-0 border-1"
                                                                      size="sm"
                                                                      variant="neutral"
                                                                      disabled={
                                                                          questData.status !==
                                                                          'active'
                                                                      }
                                                                      onClick={async (
                                                                          e
                                                                      ) => {
                                                                          e.stopPropagation()
                                                                          if (
                                                                              !taxon.mapping
                                                                          )
                                                                              return
                                                                          try {
                                                                              let progress
                                                                              if (
                                                                                  isOwner
                                                                              ) {
                                                                                  progress =
                                                                                      detailedProgress?.find(
                                                                                          (
                                                                                              p
                                                                                          ) =>
                                                                                              p.display_name ===
                                                                                                  user?.username &&
                                                                                              p.mapping_id ===
                                                                                                  taxon.mapping!
                                                                                                      .id
                                                                                      )
                                                                              } else if (
                                                                                  token
                                                                              ) {
                                                                                  progress =
                                                                                      detailedProgress?.find(
                                                                                          (
                                                                                              p
                                                                                          ) =>
                                                                                              p.display_name ===
                                                                                                  share?.guest_name &&
                                                                                              p.mapping_id ===
                                                                                                  taxon.mapping!
                                                                                                      .id
                                                                                      )
                                                                              }
                                                                              const next =
                                                                                  !progress
                                                                              if (
                                                                                  isOwner
                                                                              ) {
                                                                                  await api.post(
                                                                                      `/quest-sharing/quests/${questData.id}/progress/${taxon.mapping!.id}`,
                                                                                      {
                                                                                          observed:
                                                                                              next,
                                                                                      }
                                                                                  )
                                                                              } else if (
                                                                                  token
                                                                              ) {
                                                                                  await api.post(
                                                                                      `/quest-sharing/shares/token/${token}/progress/${taxon.mapping!.id}`,
                                                                                      {
                                                                                          observed:
                                                                                              next,
                                                                                      }
                                                                                  )
                                                                              }
                                                                              console.log(
                                                                                  'Progress updated'
                                                                              )
                                                                          } catch (_e) {
                                                                              toast.error(
                                                                                  'Action failed'
                                                                              )
                                                                          }
                                                                      }}
                                                                  >
                                                                      Found
                                                                  </Button>
                                                              </div>
                                                          )
                                                      }
                                                  />
                                              </div>
                                          )
                                      })}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'list' && (
                <QuestListView
                    taxaWithProgress={taxaWithProgress}
                    questData={questData}
                    isOwner={isOwner}
                    token={token}
                    share={share}
                    user={user}
                    detailedProgress={detailedProgress}
                    aggregatedProgress={aggregatedProgress}
                    updateStatus={updateStatus}
                />
            )}

            {viewMode === 'map' && taxa && mappings && (
                <QuestMapView
                    className="h-96 w-full rounded-lg border"
                    questData={questData}
                    taxa={taxa}
                    mappings={mappings}
                />
            )}
        </div>
    )
}
