import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import api from '@/api/api'
import { Card } from '@/components/ui/card'
import { chunk } from 'lodash'
import { INatTaxon } from '@shared/types/iNatTypes'
import { SpeciesCardWithObservations } from '@/features/quests/components/SpeciesCardWithObservations'
import { Button } from '@/components/ui/button'

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

export default function SharedQuestGuest() {
    const { token } = useParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [taxaMappings, setTaxaMappings] = useState<TaxonMapping[]>([])
    const [progress, setProgress] = useState<Progress[]>([])
    const [taxa, setTaxa] = useState<INatTaxon[]>([])
    const [questName, setQuestName] = useState<string>('')
    const [guestName, setGuestName] = useState<string | null>(null)

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
                setGuestName(res.data.share?.guest_name ?? null)
                const res2 = await api.get(
                    `/quest-sharing/shares/token/${token}/progress`
                )
                setProgress(res2.data || [])

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
        } catch (e) {
            console.error('Failed to toggle', e)
        }
    }

    if (loading) return <div className="p-6">Loading…</div>
    if (error)
        return (
            <div className="p-6">
                <Card className="p-6 text-center text-destructive">{error}</Card>
            </div>
        )

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
                </div>

                {taxa.length === 0 ? (
                    <div>No species on this quest.</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
                        {taxa.map((taxon) => {
                            const mapping = taxaMappings.find((m) => m.taxon_id === taxon.id)
                            if (!mapping) return null
                            const isObserved = observedSet.has(mapping.id)
                            return (
                                <div key={taxon.id} className="relative">
                                    <SpeciesCardWithObservations species={taxon} />
                                    <div className="absolute top-2 right-2">
                                        <Button
                                            size="sm"
                                            variant={isObserved ? 'secondary' : 'default'}
                                            onClick={() => toggleObserved(mapping.id, !isObserved)}
                                        >
                                            {isObserved ? 'Unmark' : 'Mark'}
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


