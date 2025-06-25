import { z } from 'zod'
import { Collection } from '../../types/types.js'
import { CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { CollectionRepositoryInstance } from '../repositories/CollectionRepository.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'

// Types
type CreateCollectionInput = z.infer<typeof CollectionSchema>
type UpdateCollectionInput = Partial<CreateCollectionInput>
type CollectionModel = z.infer<typeof CollectionSchema> & {
    id: number
    user_id: number
}

export class CollectionService {
    constructor(
        private collectionRepo: CollectionRepositoryInstance,
        private userId: number | null
    ) {}

    async getAllPublicCollections(): Promise<CollectionModel[]> {
        return this.collectionRepo.findAllPublic()
    }

    async getPublicCollectionById(
        collectionId: number
    ): Promise<(CollectionModel & { taxon_ids: number[] }) | null> {
        const collection = await this.collectionRepo.findOne({
            id: collectionId,
            is_private: false,
        })
        return collection ? this.enrichCollectionWithTaxa(collection) : null
    }

    async findCollectionsByUserId(userId: number) {
        const raw = await this.collectionRepo.findByUserId(userId)
        return this.enrichAllCollectionsWithTaxa(raw)
    }

    async createCollection(
        data: CreateCollectionInput
    ): Promise<CollectionModel> {
        this.ensureAuthorized()

        const newId = await this.collectionRepo.create({
            ...data,
            user_id: this.userId!,
        })

        const collection = await this.collectionRepo.findOne({ id: newId })
        if (!collection)
            throw new Error('Failed to retrieve newly created collection.')

        return collection
    }

    async updateCollection(
        collectionId: number,
        updateData: UpdateCollectionInput
    ): Promise<CollectionModel | null> {
        const authorized = await this.requireOwnedCollection(collectionId)
        if (!authorized) return null
        console.log('update data: ', updateData)
        const success = await this.collectionRepo.update(
            collectionId,
            updateData
        )
        return success
            ? this.collectionRepo.findOne({ id: collectionId })
            : null
    }

    async updateCollectionTaxa(
        collectionId: number,
        taxon_ids: number[]
    ): Promise<CollectionModel | null> {
        const authorized = await this.requireOwnedCollection(collectionId)
        if (!authorized) return null

        console.log('Updating collection taxa:', { collectionId, taxon_ids })
        await this.collectionRepo.updateCollectionItems(collectionId, taxon_ids)

        const collection = await this.collectionRepo.findOne({
            id: collectionId,
        })
        if (!collection) return null

        return this.enrichCollectionWithTaxa(collection)
    }

    async deleteCollection(collectionId: number): Promise<boolean> {
        const authorized = await this.requireOwnedCollection(collectionId)
        if (!authorized) return false
        return this.collectionRepo.delete(collectionId)
    }

    async getTaxaByCollectionId(
        collectionId: number
    ): Promise<CollectionToTaxa[]> {
        return this.collectionRepo.findTaxaByCollectionId(collectionId)
    }

    // Add this to the public methods
    async enrichCollectionWithTaxa(
        collection: Collection
    ): Promise<Collection & { taxon_ids: number[] }> {
        const taxa = await this.getTaxaByCollectionId(collection.id)
        return { ...collection, taxon_ids: taxa.map((t) => t.taxon_id) }
    }

    private async enrichAllCollectionsWithTaxa(
        collections: Collection[]
    ): Promise<(Collection & { taxon_ids: number[] })[]> {
        return Promise.all(
            collections.map((c) => this.enrichCollectionWithTaxa(c))
        )
    }

    private ensureAuthorized(): void {
        if (!this.userId) throw new Error('Unauthorized')
    }

    private isAuthorized(collection: { user_id: number }): boolean {
        return this.userId === collection.user_id
    }

    private async requireOwnedCollection(
        collectionId: number
    ): Promise<CollectionModel> {
        const collection = await this.collectionRepo.findOne({
            id: collectionId,
        })
        if (!collection || !this.isAuthorized(collection)) {
            throw new Error('Forbidden')
        }
        return collection
    }
}

export type CollectionServiceInstance = InstanceType<typeof CollectionService>
