import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Controller,
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from 'react-hook-form'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { z } from 'zod'

import { getCitySuggestions } from '@/components/location/locationUtils'
import { Button } from '@/components/ui/button'
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    locationName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
})

export function CreateQuest() {
    const { isAuthenticated } = useAuth()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            locationName: '',
        },
    })

    const lat = useWatch({ control: form.control, name: 'latitude' })
    const lon = useWatch({ control: form.control, name: 'longitude' })

    const center = useMemo(() => {
        return [lat, lon] as [number, number]
    }, [lat, lon])

    function onSubmit(values: z.infer<typeof formSchema>) {
        // This function is called when the form is submitted
        console.log('Form Submitted:', values)
    }

    if (!isAuthenticated) {
        return <p>Not authenticated.</p>
    }

    return (
        <div className="p-4">
            <h1>Create Quest</h1>
            <p>Create a new quest.</p>
            <FormProvider {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
                    <FormField
                        control={form.control}
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
                                <FormDescription>
                                    This is the display name for your quest.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <LocationInput name="locationName" />

                    <div className="flex flex-row gap-4">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Latitude</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="0.00"
                                            {...field}
                                            readOnly
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Longitude</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="0.00"
                                            {...field}
                                            readOnly
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <QuestMapView center={center} zoom={13} />

                    <Button type="submit">Submit</Button>
                </form>
            </FormProvider>
        </div>
    )
}

type Suggestion = {
    place_id: string
    display_name: string
    lat: string
    lon: string
}

type LocationInputProps = {
    name: string
    label?: string
    description?: string
}

export function LocationInput({
    name,
    label = 'Location Name',
    description = 'This is the location for your quest.',
}: LocationInputProps) {
    const { control, watch, setValue } = useFormContext()
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const suppressFetchRef = useRef(false)

    const fetchSuggestions = useMemo(
        () =>
            debounce(async (query: string) => {
                if (query.length < 2) {
                    setSuggestions([])
                    return
                }
                try {
                    const results = await getCitySuggestions(query)
                    setSuggestions(results || [])
                } catch (error) {
                    console.error('Failed to fetch suggestions:', error)
                    setSuggestions([])
                }
            }, 300),
        []
    )

    useEffect(() => {
        const subscription = watch((value, { name: changedName }) => {
            if (changedName === name) {
                if (suppressFetchRef.current) {
                    suppressFetchRef.current = false
                    return
                }
                setShowSuggestions(true)
                fetchSuggestions(value[name])
            }
        })

        return () => {
            subscription.unsubscribe()
            fetchSuggestions.cancel()
        }
    }, [watch, name, fetchSuggestions])

    const handleBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false)
        }, 150)
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormItem className="relative">
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input
                            placeholder="Search location..."
                            {...field}
                            onBlur={handleBlur}
                            onChange={(e) => {
                                field.onChange(e)
                                if (e.target.value.length < 2) {
                                    setShowSuggestions(false)
                                }
                            }}
                            autoComplete="off"
                        />
                    </FormControl>

                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute mt-1 z-10 w-full bg-white border border-gray-300 rounded shadow-md">
                            {suggestions.map((s) => (
                                <li
                                    key={s.place_id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onMouseDown={() => {
                                        suppressFetchRef.current = true
                                        setValue(name, s.display_name, {
                                            shouldValidate: true,
                                        })
                                        // Ensure lat/lon are set as numbers
                                        setValue('latitude', Number(s.lat), {
                                            shouldValidate: true,
                                        })
                                        setValue('longitude', Number(s.lon), {
                                            shouldValidate: true,
                                        })
                                        setSuggestions([])
                                        setShowSuggestions(false)
                                    }}
                                >
                                    {s.display_name}
                                </li>
                            ))}
                        </ul>
                    )}

                    <FormDescription>{description}</FormDescription>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}

type QuestMapProps = {
    center?: [number, number]
    zoom?: number
}

function MapUpdater({ center }: { center?: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom())
        }
    }, [center, map])
    return null
}

function QuestMapView({ center, zoom = 10 }: QuestMapProps) {
    const initialCenter: [number, number] = [49.18, -57.43] // Deer Lake, NL

    return (
        <MapContainer
            center={center || initialCenter}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{ height: '500px', borderRadius: '8px' }}
        >
            <TileLayer
                attribution='Maps &copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="/api/tiles/{z}/{x}/{y}.png"
            />

            <MapUpdater center={center} />

            {center && (
                <Marker position={center}>
                    <Popup>Selected Quest Location</Popup>
                </Marker>
            )}
        </MapContainer>
    )
}
