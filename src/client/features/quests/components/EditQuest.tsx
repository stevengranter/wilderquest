import { zodResolver } from '@hookform/resolvers/zod'
import { INatTaxon } from '@shared/types/iNatTypes'
import { SpeciesCountItem } from '@/features/quests/components/ResponsiveSpeciesThumbnail'
import chunk from 'lodash/chunk'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AxiosError } from 'axios'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { LocationInput } from '@/features/quests/components/LocationInput'
import { QuestMapView } from '@/features/quests/components/QuestMapView'
import { SpeciesSwipeSelector } from '@/features/quests/components/SpeciesSwipeSelector'
import { SpeciesAnimationProvider } from '@/features/quests/components/SpeciesAnimationProvider'
import { formSchema } from '@/features/quests/schemas/formSchema'
import { useQueryClient } from '@tanstack/react-query'

type QuestFormValues = z.infer<typeof formSchema>

export default function EditQuest() {
    const { questId } = useParams<{ questId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    // const { user } = useAuth()
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const [_initialTaxonIds, setInitialTaxonIds] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [questSpeciesMap, setQuestSpeciesMap] = useState<
        Map<number, SpeciesCountItem>
    >(new Map())
    const prevQuestSpeciesMapRef = useRef<Map<number, SpeciesCountItem> | null>(
        null
    )

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

                // Auto-pause active quest when editing starts
                if (quest.status === 'active') {
                    try {
                        await api.patch(`/quests/${questId}/status`, {
                            status: 'paused',
                        })
                        toast.info('Quest has been paused for editing', {
                            description:
                                'Explorers will be notified that you are editing the quest.',
                        })
                        // Update the quest status in the response for form reset
                        quest.status = 'paused'
                    } catch (pauseError) {
                        console.error('Failed to pause quest:', pauseError)
                        toast.error('Failed to pause quest for editing')
                    }
                }

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
    const syncQuestSpeciesToTaxa = useCallback(() => {
        const newTaxa = Array.from(questSpeciesMap.values()).map((item) => ({
            id: item.taxon.id,
            name: item.taxon.name,
            preferred_common_name: item.taxon.preferred_common_name,
            rank: (item.taxon.rank as INatTaxon['rank']) || 'species',
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
        }))
        setTaxa(newTaxa as INatTaxon[])
    }, [questSpeciesMap])

    const _syncQuestSpeciesToTaxa = useCallback(
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
                    rank: (item.taxon.rank as INatTaxon['rank']) || 'species',
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

    // Sync questSpeciesMap back to taxa when questSpeciesMap changes
    useEffect(() => {
        // Only sync if the map has actually changed to prevent infinite loops
        const prevMap = prevQuestSpeciesMapRef.current
        const hasChanged =
            !prevMap ||
            prevMap.size !== questSpeciesMap.size ||
            Array.from(questSpeciesMap.entries()).some(([id, item]) => {
                const prevItem = prevMap.get(id)
                return !prevItem || prevItem.taxon.id !== item.taxon.id
            })

        if (hasChanged) {
            syncQuestSpeciesToTaxa()
            prevQuestSpeciesMapRef.current = new Map(questSpeciesMap)
        }
    }, [questSpeciesMap, syncQuestSpeciesToTaxa])

    const onSubmit = async (data: QuestFormValues) => {
        setIsLoading(true)
        const taxon_ids = taxa.map((t) => t.id)
        const payload = {
            name: data.questName,
            location_name: data.locationName || null,
            latitude: data.latitude,
            longitude: data.longitude,
            is_private: data.isPrivate,
            mode: data.mode,
            starts_at: data.starts_at || null,
            ends_at: data.ends_at || null,
            taxon_ids,
        }
        try {
            const response = await api.patch(`/quests/${questId}`, payload)

            console.log(response)

            const numericQuestId = questId ? parseInt(questId, 10) : undefined

            if (numericQuestId) {
                // Update the quest cache with the new data including taxon_ids
                const updatedQuest = { ...response.data, taxon_ids }
                queryClient.setQueryData(['quest', questId], updatedQuest)

                // Remove the dependent query caches to ensure fresh data
                queryClient.removeQueries({
                    queryKey: ['taxa', numericQuestId],
                })
                queryClient.removeQueries({
                    queryKey: ['progress', numericQuestId],
                })
                queryClient.removeQueries({
                    queryKey: ['leaderboard', numericQuestId],
                })
            }

            toast.success('Quest Updated', {
                description: 'Your quest has been successfully updated.',
            })
            navigate(`/quests/${questId}`)
        } catch (err: unknown) {
            console.error('Failed to update quest.', err)

            // Type guard for axios error
            const isAxiosError = (error: unknown): error is AxiosError => {
                return (
                    error !== null &&
                    typeof error === 'object' &&
                    'response' in error
                )
            }

            // Provide more specific error messages
            if (
                isAxiosError(err) &&
                err.response &&
                err.response.status === 401
            ) {
                toast.error('Session expired. Please log in again.', {
                    description:
                        'Your session has expired. You will be redirected to login.',
                })
                // Redirect will be handled by API interceptor
            } else if (
                isAxiosError(err) &&
                err.response &&
                err.response.status === 403
            ) {
                toast.error('Permission denied', {
                    description:
                        'You do not have permission to edit this quest.',
                })
            } else if (
                isAxiosError(err) &&
                err.response &&
                err.response.status >= 500
            ) {
                toast.error('Server error', {
                    description:
                        'Please try again later. If the problem persists, contact support.',
                })
            } else {
                const errorMessage = isAxiosError(err)
                    ? err.message
                    : 'An unexpected error occurred. Please try again.'
                toast.error('Failed to update quest', {
                    description: errorMessage,
                })
            }
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

                {/* Status banner for paused quests */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-blue-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Quest Paused for Editing
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                                <p>
                                    Your quest has been automatically paused
                                    while you make changes. Quest explorers have
                                    been notified.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
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
                                questSpecies={questSpeciesMap}
                                setQuestSpecies={setQuestSpeciesMap}
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

    const questLocation =
        lat && lon
            ? {
                  latitude: lat,
                  longitude: lon,
                  name: watch('questName') || 'Quest Location',
                  locationName: watch('locationName') || undefined,
              }
            : undefined

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
                <QuestMapView
                    options={mapOptions}
                    className="w-full h-full"
                    questLocation={questLocation}
                />
            </div>
        </div>
    )
}
