import { cacheService } from './cacheService.js'
import { INatTaxon } from '../../shared/types/iNatTypes.js'
import { BATCH_SIZE, iNatAPI } from '../utils/iNatAPI.js'

async function fetchTaxaByIds(taxonIds: number[]): Promise<INatTaxon[]> {
    const uniqueTaxonIds = [...new Set(taxonIds)]
    if (uniqueTaxonIds.length === 0) return []

    const batches: number[][] = []
    for (let i = 0; i < uniqueTaxonIds.length; i += BATCH_SIZE) {
        batches.push(uniqueTaxonIds.slice(i, i + BATCH_SIZE))
    }

    const batchPromises = batches.map(async (batch) => {
        const response = await iNatAPI.get(`/taxa/${batch.join(',')}`)
        return response.data.results as INatTaxon[]
    })

    const results = await Promise.all(batchPromises)
    return results.flat()
}

async function getTaxonPhoto(taxonId: number): Promise<string | null> {
    const cacheKey = `taxon-photo-${taxonId}`
    const cachedPhoto = await cacheService.get<string>(cacheKey)
    if (cachedPhoto) {
        return cachedPhoto
    }

    const taxa = await fetchTaxaByIds([taxonId])
    const photoUrl = taxa[0]?.default_photo?.medium_url || null

    if (photoUrl) {
        await cacheService.set(cacheKey, photoUrl)
    }

    return photoUrl
}

export const iNatService = {
    fetchTaxaByIds,
    getTaxonPhoto,
}
