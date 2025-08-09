import { zodResolver } from '@hookform/resolvers/zod'
import { INatTaxon } from '@shared/types/iNatTypes'
import { chunk } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import api from '@/api/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LocationInput } from '@/features/quests/components/LocationInput'
import { QuestMapView } from '@/features/quests/components/QuestMapView'
import { formSchema } from '@/features/quests/pages/CreateQuest'
import { useAuth } from '@/hooks/useAuth'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { SpeciesSelector } from '@/features/quests/components/SpeciesSelector'


type QuestFormValues = z.infer<typeof formSchema>

export default function EditQuest() {
    const { questId } = useParams<{ questId: string }>()
    const navigate = useNavigate()
    // const { user } = useAuth()
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const [initialTaxonIds, setInitialTaxonIds] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<QuestFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            locationName: '',
            latitude: null,
            longitude: null,
            isPrivate: false,
        },
    })

    useEffect(() => {
        const fetchQuest = async () => {
            try {
                const response = await api.get(`/quests/${questId}`)
                const quest = response.data
                form.reset({
                    questName: quest.name,
                    locationName: quest.location_name,
                    latitude: quest.latitude
                        ? parseFloat(quest.latitude)
                        : null,
                    longitude: quest.longitude
                        ? parseFloat(quest.longitude)
                        : null,
                    isPrivate: !!quest.is_private,
                })
                if (quest.taxon_ids?.length) {
                    setInitialTaxonIds(quest.taxon_ids)
                    const taxaIdsChunks = chunk(quest.taxon_ids, 30)
                    const allTaxaResults: INatTaxon[] = []

                    for (const chunk of taxaIdsChunks) {
                        const chunkIds = chunk.join(',')
                        const taxaResponse = await api.get(
                            `/iNatApi/taxa/${chunkIds}`
                        )
                        if (taxaResponse.data.results) {
                            allTaxaResults.push(...taxaResponse.data.results)
                        }
                    }
                    setTaxa(allTaxaResults)
                }
            } catch (err) {
                console.error('Failed to fetch quest data.', err)
            }
        }

        fetchQuest()
    }, [questId, form.reset])

    const onSubmit = async (data: QuestFormValues) => {
        setIsLoading(true)
        const taxon_ids = taxa.map((t) => t.id)
        const payload = {
            name: data.questName,
            location_name: data.locationName,
            latitude: data.latitude,
            longitude: data.longitude,
            is_private: data.isPrivate,
            taxon_ids,
        }
        try {
            await api.patch(`/quests/${questId}`, payload)
            toast.success('Quest Updated', {
                description: 'Your quest has been successfully updated.',
            })
            navigate(`/quests/${questId}`)
        } catch (err) {
            console.error('Failed to update quest.', err)
            toast.error('Failed to update quest.')
        } finally {
            setIsLoading(false)
        }
    }

    const onToggleTaxon = (taxon: INatTaxon) => {
        setTaxa((prev) => {
            if (prev.find((t) => t.id === taxon.id)) {
                return prev.filter((t) => t.id !== taxon.id)
            } else {
                return [...prev, taxon]
            }
        })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Quest</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormProvider {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <QuestDetails />
                            <SpeciesSelector
                                selectedTaxa={taxa}
                                onToggleTaxon={onToggleTaxon}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    )
}

function QuestDetails() {
    const { control, watch, setValue } = useFormContext()
    const lat = useWatch({ control, name: 'latitude' })
    const lon = useWatch({ control, name: 'longitude' })

    const center = lat && lon ? ([lat, lon] as [number, number]) : undefined
    const mapOptions = useMemo(() => ({ center, zoom: 13 }), [center])

    return (
        <>
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
            <QuestMapView options={mapOptions} />
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
                                If checked, this quest will not be visible to
                                other users.
                            </FormDescription>
                        </div>
                    </FormItem>
                )}
            />
        </>
    )
}

