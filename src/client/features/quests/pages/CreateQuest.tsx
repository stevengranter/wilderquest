import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
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
import { LocationInput } from '@/features/quests/components/LocationInput'
import { QuestMapView } from '@/features/quests/components/QuestMapView'
import { useAuth } from '@/hooks/useAuth'

export const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    locationName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
})

interface TaxonData {
    id: number
    name: string
    preferred_common_name: string
}

interface SpeciesCount {
    taxon: TaxonData
    count: number
}

export function CreateQuest() {
    const { isAuthenticated } = useAuth()
    const [speciesCounts, setSpeciesCounts] = useState<SpeciesCount[]>([])

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
        if (!lat || !lon) {
            return undefined
        } else {
            return [lat, lon] as [number, number]
        }
    }, [lat, lon])

    useEffect(() => {
        if (!lat || !lon) {
            return
        }
        getSpeciesCountsByGeoLocation(lat, lon, 10).then((data) => {
            if (!data) return
            console.log(data)
            setSpeciesCounts(data.results)
        })
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

                    <LocationInput
                        name="locationName"
                        control={form.control}
                        watch={form.watch}
                        setValue={form.setValue}
                    />

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

                    <QuestMapView options={{ center, zoom: 13 }} />

                    {speciesCounts.length > 0 && (
                        <div className="flex flex-col gap-4">
                            {speciesCounts.map((s) => (
                                <div key={s.taxon.id}>
                                    <div className="flex flex-row gap-4">
                                        <div className="flex flex-col">
                                            <div className="font-bold">
                                                {s.count}
                                                {s.taxon.preferred_common_name}{' '}
                                                - <i>{s.taxon.name}</i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <Button type="submit">Submit</Button>
                </form>
            </FormProvider>
        </div>
    )
}

async function getSpeciesCountsByGeoLocation(
    latitude: number,
    longitude: number,
    radius = 10
) {
    const response = await axios.get(
        `https://api.inaturalist.org/v1/observations/species_counts?lat=${latitude}&lng=${longitude}&radius=${radius}&include_ancestors=false`
    )
    if (!response.data) {
        return []
    }
    return response.data
}
