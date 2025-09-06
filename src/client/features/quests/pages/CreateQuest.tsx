import { zodResolver } from '@hookform/resolvers/zod'
import React, { useCallback, useMemo, useState } from 'react'
import {
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import {
    FormControl,
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
import { SpeciesSwipeSelector } from '@/features/quests/components/SpeciesSwipeSelector'
import { SpeciesCountItem } from '@/features/quests/components/ResponsiveSpeciesThumbnail'
import { SpeciesAnimationProvider } from '@/features/quests/components/SpeciesAnimationProvider'
import { formSchema } from '@/features/quests/schemas/formSchema'

interface _TaxonData {
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
    const navigate = useNavigate()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            locationName: '',
            latitude: null,
            longitude: null,
            isPrivate: false,
            mode: 'competitive' as const,
            starts_at: '',
            ends_at: '',
        },
    })

    const onSubmit = useCallback(
        async (values: z.infer<typeof formSchema>) => {
            console.log('Form submitted with values:', values)
            console.log('Form errors:', form.formState.errors)
            try {
                const taxonIds = Array.from(questSpecies.keys())
                const {
                    questName,
                    locationName,
                    latitude,
                    longitude,
                    mode,
                    starts_at,
                    ends_at,
                } = values
                const payload = {
                    name: questName,
                    location_name: locationName || null,
                    latitude: latitude,
                    longitude: longitude,
                    mode: mode,
                    taxon_ids: taxonIds,
                    starts_at: starts_at
                        ? new Date(starts_at).toISOString()
                        : null,
                    ends_at: ends_at ? new Date(ends_at).toISOString() : null,
                }

                console.log('Submitting quest with:', payload)

                const newQuest = await api.post('/quests', payload)

                console.log('API Response:', newQuest)
                if (!newQuest.data.id) {
                    console.error('Failed to create quest - no ID in response')
                    alert('Failed to create quest. Please try again.')
                    return
                }

                console.log('Created quest:', newQuest.data)

                navigate(`/quests/${newQuest.data.id}`)
            } catch (error) {
                console.error('Error creating quest:', error)
                alert(
                    `Failed to create quest: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
            }
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
                        onSubmit={form.handleSubmit(onSubmit, (errors) => {
                            console.log('Form validation failed:', errors)
                        })}
                        className="space-y-8"
                    >
                        {step === 1 && <Step1_QuestDetails setStep={setStep} />}
                        {step === 2 && (
                            <div className="space-y-6">
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

    const questLocation =
        lat && lon
            ? {
                  latitude: lat,
                  longitude: lon,
                  name: 'New Quest',
                  locationName: watch('locationName') || undefined,
              }
            : undefined

    const handleNext = async () => {
        const isValid = await trigger([
            'questName',
            'locationName',
            'latitude',
            'longitude',
            'mode',
            'starts_at',
            'ends_at',
        ])
        if (isValid) {
            setStep(2)
        }
    }

    return (
        <>
            {' '}
            <div>When and where?</div>
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
                                    <Input
                                        placeholder="My Awesome Quest"
                                        {...field}
                                    />
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
                                            Cooperative - Multiple participants
                                            can find the same species
                                        </SelectItem>
                                        <SelectItem value="competitive">
                                            Competitive - First to find a
                                            species claims it
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
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
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                        />
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
                                        <Input
                                            type="datetime-local"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Map view - Right column */}
                <div className="w-1/2 h-96">
                    <QuestMapView
                        options={mapOptions}
                        className="w-full h-full"
                        questLocation={questLocation}
                    />
                </div>
            </div>
            <Button type="button" onClick={handleNext} className="w-full mt-4">
                Next
            </Button>
        </>
    )
}
