import { MockINatService } from '../mockINatService.js'

describe('MockINatService', () => {
    describe('getTaxa', () => {
        it('should return taxa for valid IDs', () => {
            const result = MockINatService.getTaxa(['1', '2'])

            expect(result.results).toHaveLength(2)
            expect(result.results[0].id).toBe(1)
            expect(result.results[1].id).toBe(2)
            expect(result.total_results).toBe(2)
        })

        it('should return empty results for invalid IDs', () => {
            const result = MockINatService.getTaxa(['999'])

            expect(result.results).toHaveLength(0)
            expect(result.total_results).toBe(0)
        })
    })

    describe('searchTaxa', () => {
        it('should return results for valid search query', () => {
            const result = MockINatService.searchTaxa('raven')

            expect(result.results.length).toBeGreaterThan(0)
            expect(result.results[0].name).toBe('Corvus corax')
        })

        it('should return empty results for short queries', () => {
            const result = MockINatService.searchTaxa('a')

            expect(result.results).toHaveLength(0)
            expect(result.total_results).toBe(0)
        })

        it('should handle pagination', () => {
            const result = MockINatService.searchTaxa('raven', {
                per_page: 1,
                page: 1,
            })

            expect(result.results).toHaveLength(1)
            expect(result.per_page).toBe(1)
            expect(result.page).toBe(1)
        })

        it('should filter by rank', () => {
            const result = MockINatService.searchTaxa('crow', { rank: 'genus' })

            expect(result.results[0].rank).toBe('genus')
            expect(result.results[0].name).toBe('Corvus')
        })
    })

    describe('getObservations', () => {
        it('should return mock observations', () => {
            const result = MockINatService.getObservations()

            expect(result.results).toHaveLength(3)
            expect(result.total_results).toBe(3)
            expect(result.results[0].species_guess).toBe('Mock Species 1')
        })
    })

    describe('getPlaces', () => {
        it('should return mock places', () => {
            const result = MockINatService.getPlaces()

            expect(result.results).toHaveLength(5)
            expect(result.results[0].name).toBe('Banff National Park')
        })
    })

    describe('getSpeciesCounts', () => {
        it('should return species counts', () => {
            const result = MockINatService.getSpeciesCounts({})

            expect(result.results.length).toBeGreaterThan(0)
            expect(result.results[0]).toHaveProperty('count')
            expect(result.results[0]).toHaveProperty('taxon')
        })
    })

    describe('getTaxaByIds', () => {
        it('should return taxa for valid IDs', () => {
            const result = MockINatService.getTaxaByIds(['1', '3'])

            expect(result.results).toHaveLength(2)
            expect(result.results.map((t) => t.id)).toEqual([1, 3])
        })

        it('should return empty results for invalid IDs', () => {
            const result = MockINatService.getTaxaByIds(['999'])

            expect(result.results).toHaveLength(0)
        })
    })
})
