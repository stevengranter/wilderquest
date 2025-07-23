import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import {
    Controller,
    FormProvider,
    useForm,
    useFormContext,
} from 'react-hook-form'
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

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
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

                    <div className="flex flex-row">
                        <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Latitude</FormLabel>
                                    <FormControl>
                                        <Input placeholder="0.00" {...field} />
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
                                        <Input placeholder="0.00" {...field} />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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

    // Memoize the debounced function
    const fetchSuggestions = useRef(
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
        }, 300)
    ).current

    useEffect(() => {
        const subscription = watch((value, { name: changedName }) => {
            if (changedName === name) {
                // ✨ FIX: Check the ref to prevent fetching after selection
                if (suppressFetchRef.current) {
                    suppressFetchRef.current = false // Reset the flag
                    return
                }

                // ✨ FIX: Show suggestions when typing
                setShowSuggestions(true)
                fetchSuggestions(value[name])
            }
        })

        return () => {
            subscription.unsubscribe()
            fetchSuggestions.cancel()
        }
    }, [watch, name, fetchSuggestions])

    // ✨ FIX: Add a blur handler to hide suggestions
    const handleBlur = () => {
        // Use a small delay to allow click events on suggestions to register
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
                            // ✨ FIX: Add the onBlur handler
                            onBlur={handleBlur}
                            // Also hide suggestions if the input is cleared
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
                                    // Use onMouseDown to fire before onBlur
                                    onMouseDown={() => {
                                        // ✨ FIX: Update logic for selecting a suggestion
                                        suppressFetchRef.current = true
                                        setValue(name, s.display_name, {
                                            shouldValidate: true,
                                        })
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
