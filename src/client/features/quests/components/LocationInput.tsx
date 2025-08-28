import { debounce } from 'lodash'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Control, Controller, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { z } from 'zod'
import { getCitySuggestions } from '@/components/location/locationUtils'
import { FormControl, FormDescription, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { formSchema } from '@/features/quests/schemas/formSchema'

type Suggestion = {
    place_id: string
    display_name: string
    lat: string
    lon: string
}
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
                            value={(field.value as string) || ''}
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
                        <ul className="absolute mt-15 z-10 w-full bg-white border border-gray-300 rounded shadow-md">
                            {suggestions.map((s) => (
                                <li
                                    key={s.place_id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onMouseDown={() => {
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
