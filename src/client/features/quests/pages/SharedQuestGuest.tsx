import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import api from '@/api/api'
import { Card } from '@/components/ui/card'
import { chunk } from 'lodash'
import { INatTaxon } from '@shared/types/iNatTypes'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type TaxonMapping = {
    id: number // mapping id (quests_to_taxa.id)
    quest_id: number
    taxon_id: number // iNat taxon id
}

type Progress = {
    id: number
    quest_share_id: number
    taxon_id: number // mapping id
    observed_at: string
}

type Quest = {
    id: string
    name: string
    description?: string
    taxon_ids?: number[]
    is_private: boolean
    user_id: string
    created_at: string
    updated_at: string
    location_name?: string
    latitude?: number
    longitude?: number
}

export default function SharedQuestGuest() {
    const { token } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [taxaMappings, setTaxaMappings] = useState<TaxonMapping[]>([])
    const [progress, setProgress] = useState<Progress[]>([])
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const [questName, setQuestName] = useState<string>('')
    const [questData, setQuestData] = useState<Quest | null>(null)
    const [guestName, setGuestName] = useState<string | null>(null)
    const [aggregate, setAggregate] = useState<
        { mapping_id: number; count: number; last_observed_at?: string; last_guest_name?: string | null }[]
    >([])

    const observedSet = useMemo(() => new Set(progress.map((p) => p.taxon_id)), [progress])

    useEffect(() => {
        const load = async () => {
            if (!token) return
            setLoading(true)
            setError(null)
            try {
                const res = await api.get(`/quest-sharing/shares/token/${token}`)
                const mappings: TaxonMapping[] = res.data.taxa_mappings || []
                setTaxaMappings(mappings)
                setQuestName(res.data.quest?.name || '')
                setQuestData(res.data.quest)
                setGuestName(res.data.share?.guest_name ?? null)
                const res2 = await api.get(
                    `/quest-sharing/shares/token/${token}/progress`
                )
                setProgress(res2.data || [])

                // Aggregated progress (who/when)
                const aggRes = await api.get(
                    `/quest-sharing/shares/token/${token}/progress/aggregate`
                )
                setAggregate(aggRes.data || [])

                // Fetch INat taxa for display like QuestDetail
                const taxonIds = mappings.map((m) => m.taxon_id)
                const idsChunks = chunk(taxonIds, 30)
                const allTaxa: INatTaxon[] = []
                for (const ids of idsChunks) {
                    const resp = await api.get(`/iNatAPI/taxa/${ids.join(',')}`)
                    if (resp.data?.results) allTaxa.push(...resp.data.results)
                }
                setTaxa(allTaxa)
            } catch (e: any) {
                setError(e?.response?.data?.message || 'Link invalid or expired')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [token])

    const toggleObserved = async (mappingId: number, next: boolean) => {
        if (!token) return
        try {
            const res = await api.post(
                `/quest-sharing/shares/token/${token}/progress/${mappingId}`,
                { observed: next }
            )
            setProgress(res.data || [])
            // Refresh aggregate after change
            const aggRes = await api.get(
                `/quest-sharing/shares/token/${token}/progress/aggregate`
            )
            setAggregate(aggRes.data || [])
            const meta = (aggRes.data as Array<{ mapping_id: number; count: number; last_display_name?: string; last_observed_at?: string }>)
                .find((a) => a.mapping_id === mappingId)
            const name = meta?.last_display_name || guestName || 'Someone'
            if (next) {
                const first = (meta?.count || 0) === 1
                toast(first ? `First found by ${name}` : `Found by ${name}`, {
                    description: first ? 'This is the first time this species was found on this quest.' : `Total found count is now ${meta?.count}.`,
                })
            } else {
                toast(`Unmarked by ${name}`, {
                    description: 'This species has been cleared for this link.',
                })
            }
        } catch (e) {
            console.error('Failed to toggle', e)
            toast('Action failed', { description: 'Please try again.' })
        }
    }

    if (loading) return <div className="p-6">Loading…</div>
    if (error)
        return (
            <div className="p-6">
                <Card className="p-6 text-center text-destructive">{error}</Card>
            </div>
        )

    // totals for header
    const total = taxaMappings.length
    const totalFound = aggregate.filter(a => a.count && a.count > 0).length

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="bg-card p-6 rounded-lg shadow-lg">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">{questName}</h1>
                    {guestName ? (
                        <div className="text-sm text-muted-foreground">
                            For: {guestName}
                        </div>
                    ) : null}
                    <div className="mt-1 text-sm">
                        <span className="inline-block bg-emerald-600 text-white px-2 py-0.5 rounded">
                            {totalFound}/{total} Found
                        </span>
                    </div>
                </div>

                {taxa.length === 0 ? (
                    <div>No species on this quest.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {taxa.map((taxon) => {
                            const mapping = taxaMappings.find((m) => m.taxon_id === taxon.id)
                            if (!mapping) return null
                            const isObserved = observedSet.has(mapping.id)
                            const meta = aggregate.find((a) => a.mapping_id === mapping.id)
                            const metaLine = (() => {
                                if (!meta) return null
                                const name = meta.last_guest_name || 'Someone'
                                try {
                                    const d = meta.last_observed_at ? new Date(meta.last_observed_at) : null
                                    const formatted = d ? d.toLocaleString() : ''
                                    return `${name} • ${formatted}`
                                } catch {
                                    return name
                                }
                            })()
                            return (
                                <div key={taxon.id} className="relative">
                                    <SpeciesCardWithObservations
                                        species={taxon}
                                        questData={questData}
                                    />
                                    <div className="absolute top-2 right-2">
                                        <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-md shadow text-right">
                                            <div>
                                                Found
                                                {(() => {
                                                    const count = aggregate.find(a => a.mapping_id === mapping.id)?.count || 0
                                                    return count > 1 ? ` x${count}` : ''
                                                })()}
                                            </div>
                                            {metaLine && (
                                                <div className="text-[10px] opacity-90 mt-0.5">
                                                    {metaLine}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-2 right-2">
                                        <Button
                                            size="sm"
                                            variant={isObserved ? 'secondary' : 'default'}
                                            onClick={() => toggleObserved(mapping.id, !isObserved)}
                                        >
                                            Found
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>
        </div>
    )
}


