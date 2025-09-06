import debounce from 'lodash/debounce'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    Control,
    Controller,
    UseFormSetValue,
    UseFormWatch,
} from 'react-hook-form'
import { z } from 'zod'
import {
    getCitySuggestions,
    getNearbyLocations,
    CombinedLocationResult,
} from '@/shared/lib/locationUtils'
import {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Button,
} from '@/components/ui'
import { MapPin } from 'lucide-react'

import { formSchema } from '@/features/quests/schemas/formSchema'

type Suggestion = CombinedLocationResult
type LocationInputProps = {
    name: keyof z.infer<typeof formSchema>
    control: Control<z.infer<typeof formSchema>>
    watch: UseFormWatch<z.infer<typeof formSchema>>
    setValue: UseFormSetValue<z.infer<typeof formSchema>>
    label?: string
    description?: string
}

export function LocationInput({
    name,
    control,
    watch,
    setValue,
    label = 'Location Name',
    description = 'This is the location for your quest.',
}: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [nearbyError, setNearbyError] = useState<string | null>(null)
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
                // Add type check to ensure we're passing a string
                const searchValue = value[name]
                if (typeof searchValue === 'string') {
                    fetchSuggestions(searchValue)
                }
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

    const handleNearbyClick = async () => {
        setShowSuggestions(false)
        setNearbyError(null)

        try {
            const position = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(
                            new Error(
                                'Geolocation is not supported by this browser'
                            )
                        )
                        return
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                    })
                }
            )

            const { latitude, longitude } = position.coords
            const nearbyResults = await getNearbyLocations(latitude, longitude)

            if (nearbyResults && nearbyResults.length > 0) {
                setSuggestions(nearbyResults)
                setShowSuggestions(true)
            } else {
                setSuggestions([])
                setShowSuggestions(false)
                setNearbyError('No nearby locations found')
            }
        } catch (error) {
            console.error('Failed to get nearby locations:', error)
            setSuggestions([])
            setShowSuggestions(false)

            let errorMessage = 'Failed to get your location'
            if (error instanceof GeolocationPositionError) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage =
                            'Location access denied. Please enable location permissions.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.'
                        break
                }
            } else if (error instanceof Error) {
                errorMessage = error.message
            }
            setNearbyError(errorMessage)
        }
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormItem className="relative">
                    <FormLabel>{label}</FormLabel>
                    <div className="relative">
                        <FormControl>
                            <Input
                                placeholder="Search location..."
                                {...field}
                                value={(field.value as string) || ''}
                                onBlur={handleBlur}
                                onChange={(e) => {
                                    field.onChange(e)
                                    if (e.target.value.length < 2) {
                                        setShowSuggestions(false)
                                    }
                                }}
                                autoComplete="off"
                                className="pr-10"
                            />
                        </FormControl>

                        <Button
                            type="button"
                            variant="noShadow"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                            onClick={handleNearbyClick}
                            title="Find nearby locations"
                        >
                            <MapPin className="h-4 w-4 text-gray-500" />
                        </Button>
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                        <ul className="absolute mt-16 z-10 w-full bg-white border-1 border-black rounded shadow-md max-h-60 overflow-y-auto">
                            {suggestions.map((s) => (
                                <li
                                    key={`${s.source}-${s.place_id}`}
                                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                    onMouseDown={() => {
                                        suppressFetchRef.current = true
                                        setValue(name, s.display_name, {
                                            shouldValidate: true,
                                        })
                                        const lat = s.lat ? Number(s.lat) : null
                                        const lon = s.lon ? Number(s.lon) : null
                                        setValue('latitude', lat, {
                                            shouldValidate: true,
                                        })
                                        setValue('longitude', lon, {
                                            shouldValidate: true,
                                        })
                                        setValue('place_id', s.place_id, {
                                            shouldValidate: true,
                                        })
                                        setSuggestions([])
                                        setShowSuggestions(false)
                                    }}
                                >
                                    <span className="flex-1">
                                        {s.display_name}
                                    </span>
                                    {/*<span
                                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                            s.source === 'inaturalist'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                        {s.source === 'inaturalist'
                                            ? '🌿 iNat'
                                            : ' City'}
                                    </span>*/}
                                </li>
                            ))}
                        </ul>
                    )}

                    <FormDescription>{description}</FormDescription>
                    <FormMessage />
                    {nearbyError && (
                        <p className="text-sm text-red-600 mt-1">
                            {nearbyError}
                        </p>
                    )}
                    {watch &&
                        !watch('latitude') &&
                        !watch('longitude') &&
                        field.value &&
                        typeof field.value === 'string' &&
                        field.value.trim().length > 0 && (
                            <p className="text-sm text-amber-600 mt-1">
                                Please select a location from the suggestions
                                above to set coordinates.
                            </p>
                        )}
                </FormItem>
            )}
        />
    )
}
