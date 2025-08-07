import { z } from 'zod'
import { CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { CollectionRepository } from '../repositories/CollectionRepository.js'
import {
    CollectionSchema,
    CreateCollectionSchema,
} from '../schemas/collection.schemas.js'

type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>
type UpdateCollectionInput = Partial<CreateCollectionInput>

export type CollectionModel = z.infer<typeof CollectionSchema>

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
        const collection = (await collectionRepo.findOne({
            id: collectionId,
        })) as CollectionModel | null
        if (!collection || !isAuthorized(collection)) {
            throw new Error('Forbidden')
        }
        return collection
    }

    async function getAllPublicCollections(): Promise<CollectionModel[]> {
        return (await collectionRepo.findAllPublic()) as CollectionModel[]
    }

    async function getPublicCollectionById(
        collectionId: number
    ): Promise<(CollectionModel & { taxon_ids: number[] }) | null> {
        const collection = (await collectionRepo.findOne({
            id: collectionId,
            is_private: false,
        })) as CollectionModel | null
        return collection ? await enrichCollectionWithTaxa(collection) : null
    }

    async function findCollectionsByUserId(
        userId: number
    ): Promise<(CollectionModel & { taxon_ids: number[] })[]> {
        const raw = (await collectionRepo.findByUserId(
            userId
        )) as CollectionModel[]
        return await enrichAllCollectionsWithTaxa(raw)
    }

    async function createCollection(
        data: CreateCollectionInput
    ): Promise<CollectionModel & { taxon_ids: number[] }> {
        ensureAuthorized()
        const { taxon_ids = [], ...collectionData } = data

        const newCollectionId = await collectionRepo.create({
            ...collectionData,
            user_id: userId!,
        })

        const newCollection = (await collectionRepo.findOne({
            id: newCollectionId,
        })) as CollectionModel | null
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
    ): Promise<CollectionModel | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        const success = await collectionRepo.update(collectionId, updateData)
        return success
            ? ((await collectionRepo.findOne({
                  id: collectionId,
              })) as CollectionModel | null)
            : null
    }

    async function updateCollectionTaxa(
        collectionId: number,
        taxon_ids: number[]
    ): Promise<(CollectionModel & { taxon_ids: number[] }) | null> {
        try {
            await requireOwnedCollection(collectionId)
        } catch {
            return null
        }
        await collectionRepo.updateCollectionItems(collectionId, taxon_ids)
        const collection = (await collectionRepo.findOne({
            id: collectionId,
        })) as CollectionModel | null
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
    ): Promise<CollectionToTaxa[]> {
        return await collectionRepo.findTaxaByCollectionId(collectionId)
    }

    async function enrichCollectionWithTaxa(
        collection: CollectionModel
    ): Promise<CollectionModel & { taxon_ids: number[] }> {
        const taxa = await getTaxaByCollectionId(collection.id)
        return { ...collection, taxon_ids: taxa.map((t) => t.taxon_id) }
    }

    async function enrichAllCollectionsWithTaxa(
        collections: CollectionModel[]
    ): Promise<(CollectionModel & { taxon_ids: number[] })[]> {
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
