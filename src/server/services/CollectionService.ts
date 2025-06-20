// src/services/CollectionService.ts

import { CollectionRepositoryInstance } from '../repositories/CollectionRepository.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'
import { z } from 'zod'
import { CollectionToTaxa } from '../models/CollectionToTaxa.js'
import { Collection } from '../../types/types.js'

// Types
type CreateCollectionInput = z.infer<typeof CollectionSchema>
type UpdateCollectionInput = Partial<CreateCollectionInput>
type CollectionModel = z.infer<typeof CollectionSchema> & { id: number; user_id: number }

export class CollectionService {
    constructor(
        private collectionRepo: CollectionRepositoryInstance,
        private userId: number | null,
    ) {
    }

    /**
     * Returns all public collections.
     */
    async getAllPublicCollections(): Promise<CollectionModel[]> {
        return this.collectionRepo.findAllPublic()
    }

    /**
     * Returns a public collection by ID, enriched with taxa.
     */
    async getPublicCollectionById(collectionId: number): Promise<CollectionModel | null> {
        const collection = await this.collectionRepo.findOne({ id: collectionId, is_private: false })
        return collection ? await this.addTaxaToCollection(collection) : null
    }

    /**
     * Returns public or private collections based on access rights.
     */
    async findCollectionsByUserId(targetUserId: number): Promise<CollectionModel[]> {
        if (this.userId === targetUserId) {
            return this.collectionRepo.findByUserId(targetUserId)
        } else {
            return this.collectionRepo.findPublicCollectionsByUserId(targetUserId)
        }
    }

    /**
     * Creates a new collection owned by the current user.
     */
    async createCollection(data: CreateCollectionInput): Promise<CollectionModel> {
        if (!this.userId) throw new Error('Unauthorized')

        const newId = await this.collectionRepo.create({ ...data, user_id: this.userId })
        const collection = await this.collectionRepo.findOne({ id: newId })
        if (!collection) throw new Error('Failed to retrieve newly created collection.')

        return collection
    }

    /**
     * Updates a collection if the current user owns it.
     */
    async updateCollection(
        collectionId: number,
        updateData: UpdateCollectionInput,
    ): Promise<CollectionModel | null> {
        const collection = await this.collectionRepo.findOne({ id: collectionId })
        if (!collection || !this.isAuthorized(collection)) return null

        const success = await this.collectionRepo.update(collectionId, updateData)
        return success ? await this.collectionRepo.findOne({ id: collectionId }) : null
    }

    /**
     * Deletes a collection if the current user owns it.
     */
    async deleteCollection(collectionId: number): Promise<boolean> {
        const collection = await this.collectionRepo.findOne({ id: collectionId })
        if (!collection || !this.isAuthorized(collection)) return false

        return this.collectionRepo.delete(collectionId)
    }

    /**
     * Returns the taxa associated with a collection.
     */
    async getTaxaByCollectionId(collectionId: number): Promise<CollectionToTaxa[]> {
        return (await this.collectionRepo.findTaxaByCollectionId(collectionId)) ?? []
    }

    /**
     * Enriches a collection with taxon_ids.
     */
    private async addTaxaToCollection(collection: Collection): Promise<Collection & { taxon_ids: number[] }> {
        const taxa = await this.getTaxaByCollectionId(collection.id)
        const taxon_ids = taxa.map(t => t.taxon_id)
        return { ...collection, taxon_ids }
    }

    /**
     * Checks whether the current user is authorized to modify a collection.
     */
    private isAuthorized(collection: { user_id: number }): boolean {
        return this.userId === collection.user_id
    }
}

export type CollectionServiceInstance = InstanceType<typeof CollectionService>
