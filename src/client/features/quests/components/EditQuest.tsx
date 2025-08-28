import { zodResolver } from '@hookform/resolvers/zod'
import { INatTaxon } from '@shared/types/iNatTypes'
import { chunk } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocationInput } from '@/features/quests/components/LocationInput'
import { QuestMapView } from '@/features/quests/components/QuestMapView'
import { useAuth } from '@/hooks/useAuth'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { SpeciesSwipeSelector } from '@/features/quests/components/SpeciesSwipeSelector'
import { SpeciesAnimationProvider } from '@/features/quests/components/SpeciesAnimationProvider'
import { formSchema } from '@/features/quests/schemas/formSchema'
import { useQueryClient } from '@tanstack/react-query'

type QuestFormValues = z.infer<typeof formSchema>

interface SpeciesCountItem {
    taxon: {
        id: number
        name: string
        preferred_common_name: string
        rank?: string
        default_photo?: {
            id: number
            license_code: string
            attribution: string
            url: string
            original_dimensions: { height: number; width: number }
            flags: any[]
            attribution_name: string | null
            square_url: string
            medium_url: string
        }
    }
    count: number
}

export default function EditQuest() {
    const { questId } = useParams<{ questId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    // const { user } = useAuth()
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const [initialTaxonIds, setInitialTaxonIds] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [questSpeciesMap, setQuestSpeciesMap] = useState<
        Map<number, SpeciesCountItem>
    >(new Map())

    const form = useForm<QuestFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            locationName: '',
            latitude: null,
            longitude: null,
            isPrivate: false,
            starts_at: '',
            ends_at: '',
        },
    })

    useEffect(() => {
        const fetchQuest = async () => {
            try {
                const response = await api.get(`/quests/${questId}`)
                const quest = response.data
                form.reset({
                    questName: quest.name,
                    locationName: quest.location_name,
                    latitude: quest.latitude
                        ? parseFloat(quest.latitude)
                        : null,
                    longitude: quest.longitude
                        ? parseFloat(quest.longitude)
                        : null,
                    isPrivate: !!quest.is_private,
                    mode: quest.mode || 'cooperative',
                    starts_at: quest.starts_at
                        ? new Date(quest.starts_at)
                              .toISOString()
                              .substring(0, 16)
                        : '',
                    ends_at: quest.ends_at
                        ? new Date(quest.ends_at).toISOString().substring(0, 16)
                        : '',
                })
                if (quest.taxon_ids?.length) {
                    setInitialTaxonIds(quest.taxon_ids)
                    const taxaIdsChunks = chunk(quest.taxon_ids, 30)
                    const allTaxaResults: INatTaxon[] = []

                    for (const chunk of taxaIdsChunks) {
                        const chunkIds = chunk.join(',')
                        const taxaResponse = await api.get(
                            `/iNatApi/taxa/${chunkIds}`
                        )
                        if (taxaResponse.data.results) {
                            allTaxaResults.push(...taxaResponse.data.results)
                        }
                    }
                    setTaxa(allTaxaResults)
                }
            } catch (err) {
                console.error('Failed to fetch quest data.', err)
            }
        }

        fetchQuest()
    }, [questId, form.reset])

    // Sync taxa state with questSpeciesMap for swipe interface
    useEffect(() => {
        const newMap = new Map<number, SpeciesCountItem>()
        taxa.forEach((taxon) => {
            newMap.set(taxon.id, {
                taxon: {
                    id: taxon.id,
                    name: taxon.name,
                    preferred_common_name: taxon.preferred_common_name,
                    rank: taxon.rank || 'species',
                    default_photo: taxon.default_photo
                        ? {
                              ...taxon.default_photo,
                              attribution_name:
                                  taxon.default_photo.attribution || null,
                              license_code:
                                  taxon.default_photo.license_code || '',
                          }
                        : undefined,
                },
                count: taxon.observations_count || 0,
            })
        })
        setQuestSpeciesMap(newMap)
    }, [taxa])

    // Convert questSpeciesMap back to taxa when it changes
    const syncQuestSpeciesToTaxa = useCallback(
        (
            updateFn: (
                prev: Map<number, SpeciesCountItem>
            ) => Map<number, SpeciesCountItem>
        ) => {
            const newQuestSpeciesMap = updateFn(questSpeciesMap)
            setQuestSpeciesMap(newQuestSpeciesMap)

            const newTaxa = Array.from(newQuestSpeciesMap.values()).map(
                (item) => ({
                    id: item.taxon.id,
                    name: item.taxon.name,
                    preferred_common_name: item.taxon.preferred_common_name,
                    rank: (item.taxon.rank as any) || 'species',
                    rank_level: 10,
                    iconic_taxon_id: 0,
                    ancestor_ids: [],
                    is_active: true,
                    parent_id: 0,
                    ancestry: '',
                    extinct: false,
                    default_photo: item.taxon.default_photo,
                    taxon_changes_count: 0,
                    taxon_schemes_count: 0,
                    observations_count: item.count,
                    flag_counts: { resolved: 0, unresolved: 0 },
                    current_synonymous_taxon_ids: null,
                    atlas_id: 0,
                    complete_species_count: null,
                    wikipedia_url: '',
                    matched_term: '',
                    iconic_taxon_name: '',
                })
            )
            setTaxa(newTaxa as INatTaxon[])
        },
        [questSpeciesMap]
    )

    const onSubmit = async (data: QuestFormValues) => {
        setIsLoading(true)
        const taxon_ids = taxa.map((t) => t.id)
        const payload = {
            name: data.questName,
            location_name: data.locationName,
            latitude: data.latitude,
            longitude: data.longitude,
            is_private: data.isPrivate,
            mode: data.mode,
            starts_at: data.starts_at || null,
            ends_at: data.ends_at || null,
            taxon_ids,
        }
        try {
            await api.patch(`/quests/${questId}`, payload)

            const numericQuestId = questId ? parseInt(questId, 10) : undefined

            if (numericQuestId) {
                // First, invalidate the main quest data.
                // This ensures the cache has the updated taxon_ids.
                await queryClient.invalidateQueries({
                    queryKey: ['quest', questId],
                })

                // Now, invalidate the dependent queries.
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: ['taxa', numericQuestId],
                    }),
                    queryClient.invalidateQueries({
                        queryKey: ['progress', numericQuestId],
                    }),
                    queryClient.invalidateQueries({
                        queryKey: ['leaderboard', numericQuestId],
                    }),
                ])
            }

            toast.success('Quest Updated', {
                description: 'Your quest has been successfully updated.',
            })
            navigate(`/quests/${questId}`)
        } catch (err) {
            console.error('Failed to update quest.', err)
            toast.error('Failed to update quest.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSpeciesAdded = (species: SpeciesCountItem) => {
        console.log('Added species:', species.taxon.preferred_common_name)
        toast.success(`Added ${species.taxon.preferred_common_name}`)
    }

    const handleSpeciesRejected = (species: SpeciesCountItem) => {
        console.log('Rejected species:', species.taxon.preferred_common_name)
    }

    return (
        <SpeciesAnimationProvider>
            <div className="container mx-auto px-4 py-8">
                {/*<Card>*/}
                {/*    <CardHeader>*/}
                {/*        <CardTitle>Edit Quest</CardTitle>*/}
                {/*    </CardHeader>*/}
                {/*    <CardContent>*/}
                <h1>Edit quest</h1>
                <FormProvider {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <QuestDetails />

                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">
                                    Edit Quest Species
                                </h3>
                                {/*<p className="text-gray-600 text-sm">*/}
                                {/*    Swipe through available species*/}
                                {/*    to add new ones. Click existing*/}
                                {/*    thumbnails above to remove them.*/}
                                {/*</p>*/}
                                {/*{questSpeciesMap.size > 0 && (*/}
                                {/*    <p className="text-xs text-blue-600 mt-1">*/}
                                {/*        💡 Your current{' '}*/}
                                {/*        {questSpeciesMap.size}{' '}*/}
                                {/*        species are shown as*/}
                                {/*        thumbnails above*/}
                                {/*    </p>*/}
                                {/*)}*/}
                            </div>

                            <SpeciesSwipeSelector
                                questSpecies={questSpeciesMap as any}
                                setQuestSpecies={syncQuestSpeciesToTaxa as any}
                                onSpeciesAdded={handleSpeciesAdded}
                                onSpeciesRejected={handleSpeciesRejected}
                                editMode={true}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t">
                            <div className="text-sm text-gray-600">
                                {taxa.length} species selected
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </FormProvider>
                {/*    </CardContent>*/}
                {/*</Card>*/}
            </div>
        </SpeciesAnimationProvider>
    )
}

function QuestDetails() {
    const { control, watch, setValue } = useFormContext<QuestFormValues>()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })

    const center = lat && lon ? ([lat, lon] as [number, number]) : undefined
    const mapOptions = useMemo(() => ({ center, zoom: 13 }), [center])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <FormField
                    control={control}
                    name="questName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quest Name</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <LocationInput
                    name="locationName"
                    control={control}
                    watch={watch}
                    setValue={setValue}
                />
                <div className="flex flex-row gap-4">
                    <FormField
                        control={control}
                        name="starts_at"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="ends_at"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="isPrivate"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Private</FormLabel>
                                <FormDescription>
                                    If checked, this quest will not be visible
                                    to other users.
                                </FormDescription>
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="mode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quest Mode</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select quest mode" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="cooperative">
                                        Cooperative - Multiple participants can
                                        find the same species
                                    </SelectItem>
                                    <SelectItem value="competitive">
                                        Competitive - First to find a species
                                        claims it
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div className="h-96 w-full md:h-full">
                <QuestMapView options={mapOptions} className="w-full h-full" />
            </div>
        </div>
    )
}
