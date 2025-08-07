import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import React, {
    useCallback,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import api from '@/api/api'
import titleCase from '@/components/search/titleCase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { useAuth } from '@/hooks/useAuth'

export const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    locationName: z.string().min(2, {
        message: 'Location name must be at least 2 characters.',
    }),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
})

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

interface SpeciesCountItem {
    taxon: TaxonData
    count: number
}

export function CreateQuest() {
    const { isAuthenticated } = useAuth()
    const [step, setStep] = useState(1)
    const [questSpecies, setQuestSpecies] = useState<
        Map<number, SpeciesCountItem>
    >(new Map())
    const navigate = useNavigate()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            locationName: '',
            latitude: null,
            longitude: null,
        },
    })

    const onSubmit = useCallback(
        async (values: z.infer<typeof formSchema>) => {
            const taxonIds = Array.from(questSpecies.keys())
            const { questName, locationName, latitude, longitude } = values
            const payload = {
                name: questName,
                location_name: locationName,
                latitude: latitude,
                longitude: longitude,
                taxon_ids: taxonIds,
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
        <div className="p-4">
            <h1>Create Quest</h1>
            <p>Step {step} of 2</p>
            <FormProvider {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
                    {step === 1 && <QuestDetails setStep={setStep} />}
                    {step === 2 && (
                        <SpeciesSelector
                            questSpecies={questSpecies}
                            setQuestSpecies={setQuestSpecies}
                            setStep={setStep}
                        />
                    )}
                </form>
            </FormProvider>
        </div>
    )
}

function QuestDetails({ setStep }) {
    const { control, watch, setValue, trigger } = useFormContext()
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
        ])
        if (isValid) {
            setStep(2)
        }
    }

    return (
        <>
            <FormField
                control={control}
                name="questName"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Quest Name</FormLabel>
                        <FormControl>
                            <Input placeholder="My Awesome Quest" {...field} />
                        </FormControl>
                        <FormDescription>
                            This is the display name for your quest.
                        </FormDescription>
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
                    name="latitude"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="0.00"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value
                                            ? Number(e.target.value)
                                            : undefined
                                        field.onChange(value)
                                    }}
                                    readOnly
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={control}
                    name="longitude"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                                <Input placeholder="0.00" {...field} readOnly />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <QuestMapView options={mapOptions} />
            <Button type="button" onClick={handleNext}>
                Next
            </Button>
        </>
    )
}

function SpeciesSelector({ questSpecies, setQuestSpecies, setStep }) {
    const [page, setPage] = useState(1)
    const [perPage, setPerPage] = useState(10)
    const speciesListRef = useRef<HTMLDivElement>(null)
    const { control } = useFormContext()

    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })

    const {
        data: speciesCounts,
        isLoading,
        isError,
    } = useQuery<SpeciesCountItem[], Error>({
        queryKey: ['speciesCounts', lat, lon, page, perPage],
        queryFn: () =>
            getSpeciesCountsByGeoLocation(lat, lon, 10, page, perPage),
        enabled: !!lat && !!lon,
        keepPreviousData: true,
    })

    useLayoutEffect(() => {
        if (speciesCounts && speciesListRef.current) {
            speciesListRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [speciesCounts])

    const toggleSpeciesInQuest = useCallback(
        (species: SpeciesCountItem) => {
            setQuestSpecies((prev) => {
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
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading && <p>Loading species...</p>}
                {isError && <p>Error fetching species.</p>}
                {speciesCounts &&
                    speciesCounts.map((s) => (
                        <SpeciesItem
                            key={s.taxon.id}
                            species={s}
                            onToggle={toggleSpeciesInQuest}
                            isAdded={questSpecies.has(s.taxon.id)}
                        />
                    ))}

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
            <Button type="button" onClick={() => setStep(1)}>
                Back
            </Button>
            <Button type="submit">Save Quest</Button>
        </>
    )
}

type SpeciesItemProps = {
    species: SpeciesCountItem
    onToggle: (species: SpeciesCountItem) => void
    isAdded: boolean
}

function SpeciesItem({ species, onToggle, isAdded }: SpeciesItemProps) {
    const [showObservations, setShowObservations] = useState(false)
    const { control } = useFormContext()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })

    return (
        <Card
            className="p-4 cursor-pointer"
            onClick={() => setShowObservations((prev) => !prev)}
        >
            <div className="flex items-center space-x-4">
                {species.taxon.default_photo && (
                    <img
                        src={species.taxon.default_photo.square_url}
                        alt={`Photo of ${species.taxon.preferred_common_name} - ${species.taxon.name}`}
                        className="w-20 h-20 rounded-md object-cover"
                    />
                )}
                <div className="flex-grow">
                    <p className="font-bold text-lg">
                        {titleCase(species.taxon.preferred_common_name)}
                    </p>
                    <p className="text-sm italic">{species.taxon.name}</p>
                    <Badge>{species.count} observations</Badge>
                </div>
                <Button
                    onClick={(e) => {
                        e.stopPropagation() // Prevent card click from firing
                        e.preventDefault()
                        onToggle(species)
                    }}
                    variant={isAdded ? 'neutral' : 'default'}
                    className="self-center"
                >
                    {isAdded ? 'Remove' : 'Add'}
                </Button>
            </div>
            {showObservations && (
                <ObservationList taxonId={species.taxon.id} lat={lat} lon={lon} />
            )}
        </Card>
    )
}

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

interface Observation {
    id: number
    photos: ObservationPhoto[]
    observed_on_string: string
    place_guess: string
    user: {
        login: string
    }
}

function ObservationList({
    taxonId,
    lat,
    lon,
}: {
    taxonId: number
    lat: number
    lon: number
}) {
    const {
        data: observations,
        isLoading,
        isError,
    } = useQuery<Observation[], Error>({
        queryKey: ['observations', taxonId, lat, lon],
        queryFn: () => getObservationsByTaxonId(taxonId, lat, lon),
        enabled: !!taxonId && !!lat && !!lon,
    })

    if (isLoading) return <p>Loading observations...</p>
    if (isError) return <p>Error fetching observations.</p>

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold">Recent Observations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {observations?.map((obs) => (
                    <Card key={obs.id} className="p-2">
                        {obs.photos.length > 0 && (
                            <img
                                src={obs.photos[0].url.replace(
                                    'square',
                                    'medium'
                                )}
                                alt="Observation"
                                className="rounded-md w-full h-48 object-cover"
                            />
                        )}
                        <div className="mt-2 text-sm">
                            <p>
                                <strong>Observed by:</strong> {obs.user.login}
                            </p>
                            <p>
                                <strong>On:</strong> {obs.observed_on_string}
                            </p>
                            {obs.place_guess && (
                                <p>
                                    <strong>Location:</strong> {obs.place_guess}
                                </p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}

async function getObservationsByTaxonId(
    taxonId: number,
    lat: number,
    lon: number
) {
    const response = await api.get(
        `/iNatAPI/observations?taxon_id=${taxonId}&lat=${lat}&lng=${lon}&radius=10&per_page=6&order_by=observed_on`
    )
    if (!response.data) {
        return []
    }
    return response.data.results
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10,
    page = 1,
    perPage = 10
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
