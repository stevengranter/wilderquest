import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { Control, Controller, useForm, useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { getCitySuggestions } from '@/components/location/locationUtils'
import { Button } from '@/components/ui/button'
import {
    Form,
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
            <Form {...form}>
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

                    <LocationInput control={form.control} name="locationName" />

                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    )
}

type Suggestion = {
    place_id: string
    display_name: string
}

type LocationInputProps = {
    control: Control
    name: string
    label?: string
    description?: string
}

export function LocationInput({
    control,
    name,
    label = 'Location Name',
    description = 'This is the location for your quest.',
}: LocationInputProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const suppressFetchRef = useRef(false)
    const fetchSuggestions = useRef(
        debounce(async (query: string) => {
            if (query.length < 2) return
            const results = await getCitySuggestions(query)
            if (!results || results.length === 0) return
            setSuggestions(results)
        }, 300)
    ).current

    const formContext = useFormContext()

    useEffect(() => {
        const subscription = formContext.watch(
            (value, { name: changedName }) => {
                if (changedName === name) {
                    if (suppressFetchRef.current) {
                        suppressFetchRef.current = false
                        return
                    }
                    fetchSuggestions(value[name])
                }
            }
        )

        return () => {
            subscription.unsubscribe()
            fetchSuggestions.cancel()
        }
    }, [formContext, name])

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormItem className="relative">
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                        <Input placeholder="Search location..." {...field} />
                    </FormControl>

                    {suggestions.length > 0 && (
                        <ul className="absolute mt-1 z-10 w-full bg-white border border-gray-300 rounded shadow-md">
                            {suggestions.map((s) => (
                                <li
                                    key={s.place_id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                        suppressFetchRef.current = true
                                        formContext.setValue(
                                            name,
                                            s.display_name
                                        )
                                        setSuggestions([])
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
