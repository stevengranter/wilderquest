type Rarity = 'common' | 'uncommon' | 'rare'

interface SpeciesCount {
    taxon: { id: number; name: string; preferred_common_name?: string }
    count: number
}

// Simple in-memory cache
const placeSpeciesCache: Record<
    number,
    { timestamp: number; ranking: Record<number, number> }
> = {}

const CACHE_TTL = 1000 * 60 * 60 * 24 // 24h

async function fetchAllSpeciesCounts(placeId: number): Promise<SpeciesCount[]> {
    let results: SpeciesCount[] = []
    let page = 1
    const perPage = 200

    while (true) {
        const res = await fetch(
            `https://api.inaturalist.org/v1/observations/species_counts?place_id=${placeId}&per_page=${perPage}&page=${page}&order=desc&order_by=count`
        )
        if (!res.ok) throw new Error(`iNat API error: ${res.status}`)

        const data = await res.json()
        const species: SpeciesCount[] = data.results

        if (!species || species.length === 0) break

        results = results.concat(species)
        if (species.length < perPage) break // no more pages
        page++
    }

    return results
}

async function _getSpeciesRarity(
    placeId: number,
    taxonId: number
): Promise<Rarity> {
    // Check cache
    const cached = placeSpeciesCache[placeId]
    const now = Date.now()
    let rankingMap: Record<number, number>

    if (cached && now - cached.timestamp < CACHE_TTL) {
        rankingMap = cached.ranking
    } else {
        const speciesCounts = await fetchAllSpeciesCounts(placeId)
        speciesCounts.sort((a, b) => b.count - a.count) // descending

        rankingMap = {}
        speciesCounts.forEach((s, i) => {
            rankingMap[s.taxon.id] = i / speciesCounts.length // store percentile
        })

        placeSpeciesCache[placeId] = { timestamp: now, ranking: rankingMap }
    }

    const percentile = rankingMap[taxonId] ?? 1 // 1 = not observed => rare

    if (percentile <= 0.2) return 'common'
    if (percentile <= 0.8) return 'uncommon'
    return 'rare'
}
