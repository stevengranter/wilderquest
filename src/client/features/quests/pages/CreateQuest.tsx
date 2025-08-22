import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LocationInput } from '@/features/quests/components/LocationInput'
import { QuestMapView } from '@/features/quests/components/QuestMapView'
import { useAuth } from '@/hooks/useAuth'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { SpeciesCountItem, SpeciesSwipeSelector } from '@/features/quests/components/SpeciesSwipeSelector'
import { SpeciesAnimationProvider } from '@/features/quests/components/SpeciesAnimationProvider'
import { formSchema } from '@/features/quests/schemas/formSchema'

interface TaxonData {
    default_photo: DefaultPhoto
    id: number
    name: string
    preferred_common_name: string
}

interface DefaultPhoto {
    id: number
    license_code: string
    attribution: string
    url: string
    original_dimensions: {
        height: number
        width: number
    }
    flags: {
        id: number
        flag: string
        comment: string
        user_id: number
        resolver_id: number
        resolved: boolean
        created_at: string
        updated_at: string
    }[]
    attribution_name: string | null
    square_url: string
    medium_url: string
}

export function CreateQuest() {
    const { isAuthenticated } = useAuth()
    const [step, setStep] = useState(1)
    const [questSpecies, setQuestSpecies] = useState<
        Map<number, SpeciesCountItem>
    >(new Map())
    const [selectionMode, setSelectionMode] = useState<'traditional' | 'swipe'>(
        'traditional'
    )
    const navigate = useNavigate()

    const form = useForm<z.infer<typeof formSchema>>({
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

    const onSubmit = useCallback(
        async (values: z.infer<typeof formSchema>) => {
            const taxonIds = Array.from(questSpecies.keys())
            const { questName, locationName, latitude, longitude, starts_at, ends_at } = values
            const payload = {
                name: questName,
                location_name: locationName,
                latitude: latitude,
                longitude: longitude,
                taxon_ids: taxonIds,
                starts_at: starts_at ? new Date(starts_at).toISOString() : null,
                ends_at: ends_at ? new Date(ends_at).toISOString() : null,
            }

            console.log('Submitting quest with:', payload)

            const newQuest = await api.post('/quests', payload)

            console.log(await newQuest)
            if (!newQuest.data.id) {
                console.error('Failed to create quest')
            }

            console.log('Created quest:', newQuest.data)

            navigate(`/quests/${newQuest.data.id}`)
        },
        [questSpecies, navigate]
    )

    if (!isAuthenticated) {
        return <p>Not authenticated.</p>
    }

    return (
        <SpeciesAnimationProvider>
            <div className="p-4">
                <h1 className="text-2xl">Create Quest</h1>
                <h2 className="text-xl">Step {step}</h2>
                <FormProvider {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        {step === 1 && <Step1_QuestDetails setStep={setStep} />}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-gray-100 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                selectionMode === 'traditional'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                            onClick={() =>
                                                setSelectionMode('traditional')
                                            }
                                        >
                                            📋 List View
                                        </button>
                                        <button
                                            type="button"
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                selectionMode === 'swipe'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                            onClick={() =>
                                                setSelectionMode('swipe')
                                            }
                                        >
                                            📱 Swipe Mode
                                        </button>
                                    </div>
                                </div>

                                {selectionMode === 'traditional' ? (
                                    <div>
                                        <Step2_SpeciesSelector
                                            questSpecies={questSpecies}
                                            setQuestSpecies={setQuestSpecies}
                                            setStep={setStep}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <SpeciesSwipeSelector
                                            questSpecies={questSpecies}
                                            setQuestSpecies={setQuestSpecies}
                                            onSpeciesAdded={(species) => {
                                                console.log(
                                                    'Added species:',
                                                    species.taxon
                                                        .preferred_common_name
                                                )
                                            }}
                                            onSpeciesRejected={(species) => {
                                                console.log(
                                                    'Rejected species:',
                                                    species.taxon
                                                        .preferred_common_name
                                                )
                                            }}
                                        />

                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(1)}
                                            >
                                                Back
                                            </Button>
                                            <Button type="submit">
                                                Save Quest
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </FormProvider>
            </div>
        </SpeciesAnimationProvider>
    )
}

function Step1_QuestDetails({ setStep }: { setStep: (step: number) => void }) {
    const { control, watch, setValue, trigger } =
        useFormContext<z.infer<typeof formSchema>>()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })

    const center = lat && lon ? ([lat, lon] as [number, number]) : undefined
    const mapOptions = useMemo(() => ({ center, zoom: 13 }), [center])

    const handleNext = async () => {
        const isValid = await trigger([
            'questName',
            'locationName',
            'latitude',
            'longitude',
            'starts_at',
            'ends_at',
        ])
        if (isValid) {
            setStep(2)
        }
    }

    return (
        <> <div>When and where?</div>
            <div className="flex flex-row  gap-4 h-96">

                {/* Form fields - Left column */}
                <div className="w-1/2 flex flex-col gap-4 p-4">
                    <FormField
                        control={control}
                        name="questName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quest Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My Awesome Quest" {...field} />
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

                    {/* Hidden form fields for latitude and longitude */}
                    <FormField
                        control={control}
                        name="latitude"
                        render={({ field }) => (
                            <FormItem className="hidden">
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                                ? Number(e.target.value)
                                                : undefined
                                            field.onChange(value)
                                        }}
                                        type="hidden"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="longitude"
                        render={({ field }) => (
                            <FormItem className="hidden">
                                <FormControl>
                                    <Input
                                        {...field}
                                        value={field.value ?? ''}
                                        type="hidden"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
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
                </div>

                {/* Map view - Right column */}
                <div className="w-1/2">
                    <QuestMapView options={mapOptions} className="w-full" style={{ height: '100%' }}/>
                </div>
            </div>

            <Button type="button" onClick={handleNext} className="w-full mt-4">
                Next
            </Button>
        </>
    )
}
function Step2_SpeciesSelector({
    questSpecies,
    setQuestSpecies,
    setStep,
}: {
    questSpecies: Map<number, SpeciesCountItem>
    setQuestSpecies: (
        fn: (
            prev: Map<number, SpeciesCountItem>
        ) => Map<number, SpeciesCountItem>
    ) => void
    setStep: (step: number) => void
}) {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(6)
    const speciesListRef = useRef<HTMLDivElement>(null)
    const { control } = useFormContext<z.infer<typeof formSchema>>()

    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })
    const locationName = useWatch({ control, name: 'locationName' })

    const {
        data: speciesCounts,
        isLoading,
        isError,
    } = useQuery<SpeciesCountItem[], Error>({
        queryKey: ['speciesCounts', lat, lon, page, perPage],
        queryFn: () =>
            getSpeciesCountsByGeoLocation(lat!, lon!, 10, page, perPage),
        enabled: lat !== null && lon !== null,
        placeholderData: (previousData) => previousData,
    })

    useLayoutEffect(() => {
        if (speciesCounts && speciesListRef.current) {
            speciesListRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [speciesCounts])

    const toggleSpeciesInQuest = useCallback(
        (species: SpeciesCountItem) => {
            setQuestSpecies((prev: Map<number, SpeciesCountItem>) => {
                const newMap = new Map(prev)
                if (newMap.has(species.taxon.id)) {
                    newMap.delete(species.taxon.id)
                } else {
                    newMap.set(species.taxon.id, species)
                }
                return newMap
            })
        },
        [setQuestSpecies]
    )

    return (
        <>
            <div ref={speciesListRef}>
                <h2>Top Species</h2>

                <div className="flex items-center space-x-2">
                    <label htmlFor="per-page">Results per page:</label>
                    <Select
                        onValueChange={(value) => setPerPage(Number(value))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="6" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading && <p>Loading species...</p>}
                {isError && <p>Error fetching species.</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                    {speciesCounts &&
                        speciesCounts.map((s: SpeciesCountItem) => (
                            <div
                                key={s.taxon.id}
                                className="flex flex-col gap-2"
                            >
                                <SpeciesCardWithObservations
                                    species={s.taxon as any}
                                    locationData={{
                                        latitude: lat!,
                                        longitude: lon!,
                                        location_name: locationName,
                                    }}
                                />
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation() // Prevent card click from firing
                                        e.preventDefault()
                                        toggleSpeciesInQuest(s)
                                    }}
                                    variant={
                                        questSpecies.has(s.taxon.id)
                                            ? 'neutral'
                                            : 'default'
                                    }
                                    className="self-center"
                                >
                                    {questSpecies.has(s.taxon.id)
                                        ? 'Remove'
                                        : 'Add'}
                                </Button>
                            </div>
                        ))}
                </div>

                <div className="flex justify-between mt-4">
                    <Button
                        type="button"
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span>Page {page}</span>
                    <Button type="button" onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            </div>
            <div className="flex justify-between">
                <Button type="button" onClick={() => setStep(1)}>
                    Back
                </Button>
                <Button type="submit">Save Quest</Button>
            </div>
        </>
    )
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10,
    page = 1,
    perPage = 6
) {
    const response = await api.get(
        `/iNatAPI/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false&page=${page}&per_page=${perPage}`
    )
    if (!response.data) {
        return []
    }
    console.log(response.data)
    return response.data.results
}
