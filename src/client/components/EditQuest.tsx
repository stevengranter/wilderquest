import { zodResolver } from '@hookform/resolvers/zod'
import { INatTaxon } from '@shared/types/iNaturalist'
import { SpeciesCountItem } from '@/components/ResponsiveSpeciesThumbnail'
import chunk from 'lodash/chunk'
import { useEffect, useMemo, useState } from 'react'
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
import axiosInstance from '@/lib/axios'
import { clientDebug } from '@/lib/debug'
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { LocationInput } from '@/components/LocationInput'
import { QuestMapView } from '@/components/QuestMapView'
import { SpeciesSwipeSelector } from '@/components/SpeciesSwipeSelector'
import { SpeciesAnimationProvider } from '@/components/SpeciesAnimationProvider'
import { questFormSchema } from '@/components/questFormSchema'
import { useQueryClient } from '@tanstack/react-query'
import { FaInfoCircle } from 'react-icons/fa'

type QuestFormValues = z.infer<typeof questFormSchema>

export default function EditQuest() {
    const { questId } = useParams<{ questId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isLoading, setIsLoading] = useState(false)
    const [questSpeciesMap, setQuestSpeciesMap] = useState<
        Map<number, SpeciesCountItem>
    >(new Map())

    const form = useForm<QuestFormValues>({
        resolver: zodResolver(questFormSchema),
        defaultValues: {
            questName: '',
            locationName: '',
            latitude: null,
            longitude: null,
            place_id: undefined,
            isPrivate: false,
            starts_at: '',
            ends_at: '',
        },
    })

    useEffect(() => {
        const fetchQuest = async () => {
            try {
                const response = await axiosInstance.get(`/quests/${questId}`)
                const quest = response.data

                // Auto-pause active quest when editing starts
                if (quest.status === 'active') {
                    try {
                        await axiosInstance.patch(`/quests/${questId}/status`, {
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
                    place_id: quest.place_id || undefined,
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
                    const taxaIdsChunks = chunk(quest.taxon_ids, 30)
                    const speciesMap = new Map<number, SpeciesCountItem>()

                    for (const chunk of taxaIdsChunks) {
                        const chunkIds = chunk.join(',')
                        const taxaResponse = await axiosInstance.get(
                            `/iNatApi/taxa/${chunkIds}`
                        )
                        if (taxaResponse.data.results) {
                            // Transform INatTaxon to TaxonData immediately
                            taxaResponse.data.results.forEach(
                                (taxon: INatTaxon) => {
                                    const taxonData = {
                                        id: taxon.id,
                                        name: taxon.name,
                                        preferred_common_name:
                                            taxon.preferred_common_name,
                                        rank: taxon.rank,
                                        default_photo: taxon.default_photo,
                                        observations_count:
                                            taxon.observations_count,
                                    }
                                    speciesMap.set(taxon.id, {
                                        taxon: taxonData,
                                        count: taxon.observations_count || 0,
                                    })
                                }
                            )
                        }
                    }
                    setQuestSpeciesMap(speciesMap)
                }
            } catch (err) {
                console.error('Failed to fetch quest data.', err)
            }
        }

        fetchQuest()
    }, [questId, form.reset])

    const onSubmit = async (data: QuestFormValues) => {
        setIsLoading(true)
        const taxon_ids = Array.from(questSpeciesMap.keys())
        const payload = {
            name: data.questName,
            location_name: data.locationName || null,
            latitude: data.latitude,
            longitude: data.longitude,
            place_id: data.place_id || null,
            is_private: data.isPrivate,
            mode: data.mode,
            starts_at: data.starts_at || null,
            ends_at: data.ends_at || null,
            taxon_ids,
        }
        try {
            const response = await axiosInstance.patch(
                `/quests/${questId}`,
                payload
            )

            clientDebug.quests('Quest update response: %o', response)

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

            const isAxiosError = (error: unknown): error is AxiosError => {
                return (
                    error !== null &&
                    typeof error === 'object' &&
                    'response' in error
                )
            }

            if (
                isAxiosError(err) &&
                err.response &&
                err.response.status === 401
            ) {
                toast.error('Session expired. Please log in again.', {
                    description:
                        'Your session has expired. You will be redirected to login.',
                })
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
        clientDebug.data(
            'Added species: %s',
            species.taxon.preferred_common_name
        )
        toast.success(`Added ${species.taxon.preferred_common_name}`)
    }

    const handleSpeciesRejected = (species: SpeciesCountItem) => {
        clientDebug.data(
            'Rejected species: %s',
            species.taxon.preferred_common_name
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">

            <h1>Edit quest</h1>

            {/* Status banner for paused quests */}

            <Alert className="mt-4 mb-6 py-2 bg-yellow-50 p-4 shadow-0">
                <FaInfoCircle />
                <AlertTitle>Quest Paused for Editing</AlertTitle>
                <AlertDescription>
                    Your quest has been automatically paused while you make
                    changes. Quest explorers have been notified.
                </AlertDescription>
            </Alert>
            <SpeciesAnimationProvider>
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
                                {questSpeciesMap.size} species selected
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </FormProvider>

            </SpeciesAnimationProvider>
        </div>
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
