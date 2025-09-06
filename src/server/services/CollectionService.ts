import { z } from 'zod'
import { type CollectionRepository } from '../repositories/CollectionRepository.js'
import {
    Collection,
    CollectionsToTaxa,
    CreateCollectionSchema,
} from '../models/index.js'

type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>
type UpdateCollectionInput = Partial<CreateCollectionInput>

export function createCollectionService(
    collectionRepo: CollectionRepository,
    userId: number | null
) {
    function ensureAuthorized(): void {
        if (!userId) throw new Error('Unauthorized')
    }

    function isAuthorized(collection: { user_id: number }): boolean {
        return userId === collection.user_id
    }

    async function requireOwnedCollection(
        collectionId: number
    ): Promise<Collection> {
        const collection = (await collectionRepo.findOne({
            id: collectionId,
        })) as Collection | null
        if (!collection || !isAuthorized(collection)) {
            throw new Error('Forbidden')
        }
        return collection
    }

    async function getAllPublicCollections(): Promise<Collection[]> {
        return (await collectionRepo.findAllPublic()) as Collection[]
    }

    async function getPublicCollectionById(
        collectionId: number
    ): Promise<(Collection & { taxon_ids: number[] }) | null> {
        const collection = (await collectionRepo.findOne({
            id: collectionId,
            is_private: false,
        })) as Collection | null
        return collection ? await enrichCollectionWithTaxa(collection) : null
    }

    async function findCollectionsByUserId(
        userId: number
    ): Promise<(Collection & { taxon_ids: number[] })[]> {
        const raw = (await collectionRepo.findByUserId(userId)) as Collection[]
        return await enrichAllCollectionsWithTaxa(raw)
    }

    async function createCollection(
        data: CreateCollectionInput
    ): Promise<Collection & { taxon_ids: number[] }> {
        ensureAuthorized()
        const { taxon_ids = [], ...collectionData } = data

        const newCollectionId = await collectionRepo.create({
            ...collectionData,
            user_id: userId!,
        })

        const newCollection = (await collectionRepo.findOne({
            id: newCollectionId,
        })) as Collection | null
        if (!newCollection) {
            throw new Error('Failed to retrieve newly created collection.')
        }

        if (taxon_ids.length > 0) {
            await updateCollectionTaxa(newCollectionId, taxon_ids)
        }

        return await enrichCollectionWithTaxa(newCollection)
    }

    async function updateCollection(
        collectionId: number,
        updateData: UpdateCollectionInput
    ): Promise<Collection | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        const success = await collectionRepo.update(collectionId, updateData)
        return success
            ? ((await collectionRepo.findOne({
                  id: collectionId,
              })) as Collection | null)
            : null
    }

    async function updateCollectionTaxa(
        collectionId: number,
        taxon_ids: number[]
    ): Promise<(Collection & { taxon_ids: number[] }) | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        await collectionRepo.updateCollectionItems(collectionId, taxon_ids)
        const collection = (await collectionRepo.findOne({
            id: collectionId,
        })) as Collection | null
        if (!collection) return null
        return await enrichCollectionWithTaxa(collection)
    }

    async function deleteCollection(
        collectionId: number
    ): Promise<{ success: boolean; affectedRows: number }> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return { success: false, affectedRows: 0 }
        }
        return await collectionRepo.delete(collectionId)
    }

    async function getTaxaByCollectionId(
        collectionId: number
    ): Promise<CollectionsToTaxa[]> {
        return await collectionRepo.findTaxaByCollectionId(collectionId)
    }

    async function enrichCollectionWithTaxa(
        collection: Collection
    ): Promise<Collection & { taxon_ids: number[] }> {
        const taxa = await getTaxaByCollectionId(collection.id)
        return {
            ...collection,
            taxon_ids: taxa
                .map((t) => t.taxon_id)
                .filter((id) => id && typeof id === 'number' && id > 0),
        }
    }

    async function enrichAllCollectionsWithTaxa(
        collections: Collection[]
    ): Promise<(Collection & { taxon_ids: number[] })[]> {
        return await Promise.all(
            collections.map((c) => enrichCollectionWithTaxa(c))
        )
    }

    return {
        getAllPublicCollections,
        getPublicCollectionById,
        findCollectionsByUserId,
        createCollection,
        updateCollection,
        updateCollectionTaxa,
        deleteCollection,
        getTaxaByCollectionId,
        enrichCollectionWithTaxa,
    }
}
