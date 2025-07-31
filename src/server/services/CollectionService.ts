import { z } from 'zod'
import { Collection } from '../../types/types.js'
import { CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { CollectionRepository } from '../repositories/CollectionRepository.js'
import { CollectionSchema, CreateCollectionSchema } from '../schemas/collection.schemas.js'

type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>
type UpdateCollectionInput = Partial<CreateCollectionInput>
type CollectionModel = z.infer<typeof CollectionSchema> & {
    id: number
    user_id: number
}

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
    ): Promise<CollectionModel> {
        const collection = await collectionRepo.findOne({ id: collectionId })
        if (!collection || !isAuthorized(collection)) {
            throw new Error('Forbidden')
        }
        return collection
    }

    async function getAllPublicCollections(): Promise<CollectionModel[]> {
        return collectionRepo.findAllPublic()
    }

    async function getPublicCollectionById(
        collectionId: number
    ): Promise<CollectionModel | null> {
        const collection = await collectionRepo.findOne({
            id: collectionId,
            is_private: false,
        })
        return collection ? enrichCollectionWithTaxa(collection) : null
    }

    async function findCollectionsByUserId(userId: number) {
        const raw = await collectionRepo.findByUserId(userId)
        return enrichAllCollectionsWithTaxa(raw)
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

        const newCollection = await collectionRepo.findOne({
            id: newCollectionId,
        })
        if (!newCollection) {
            throw new Error('Failed to retrieve newly created collection.')
        }

        if (taxon_ids.length > 0) {
            await updateCollectionTaxa(newCollectionId, taxon_ids)
        }

        return enrichCollectionWithTaxa(newCollection)
    }

    async function updateCollection(
        collectionId: number,
        updateData: UpdateCollectionInput
    ): Promise<CollectionModel | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        const success = await collectionRepo.update(collectionId, updateData)
        return success ? collectionRepo.findOne({ id: collectionId }) : null
    }

    async function updateCollectionTaxa(
        collectionId: number,
        taxon_ids: number[]
    ): Promise<CollectionModel | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        await collectionRepo.updateCollectionItems(collectionId, taxon_ids)
        const collection = await collectionRepo.findOne({ id: collectionId })
        if (!collection) return null
        return enrichCollectionWithTaxa(collection)
    }

    async function deleteCollection(collectionId: number): Promise<boolean> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return false
        }
        return collectionRepo.delete(collectionId)
    }

    async function getTaxaByCollectionId(
        collectionId: number
    ): Promise<CollectionToTaxa[]> {
        return collectionRepo.findTaxaByCollectionId(collectionId)
    }

    async function enrichCollectionWithTaxa(
        collection: Collection
    ): Promise<Collection & { taxon_ids: number[] }> {
        const taxa = await getTaxaByCollectionId(collection.id)
        return { ...collection, taxon_ids: taxa.map((t) => t.taxon_id) }
    }

    async function enrichAllCollectionsWithTaxa(
        collections: Collection[]
    ): Promise<(Collection & { taxon_ids: number[] })[]> {
        return Promise.all(collections.map((c) => enrichCollectionWithTaxa(c)))
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

export type CollectionServiceInstance = ReturnType<
    typeof createCollectionService
>
