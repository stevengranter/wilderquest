// src/services/CollectionService.ts
import { CollectionRepositoryInstance } from '../repositories/CollectionRepository.js'
import { CollectionSchema } from '../schemas/collection.schemas.js'
import { z } from 'zod'

// Define types for inputs and outputs
type CreateCollectionInput = z.infer<typeof CollectionSchema>
// For updates, allow partial schema as some fields might not be present
type UpdateCollectionInput = Partial<z.infer<typeof CollectionSchema>>
// Define a type for your Collection model, assuming it has an id and user_id
type CollectionModel = z.infer<typeof CollectionSchema> & { id: number; user_id: number }

export class CollectionService {
    private collectionRepo: CollectionRepositoryInstance

    constructor(collectionRepo: CollectionRepositoryInstance) {
        this.collectionRepo = collectionRepo
    }

    /**
     * Fetches all public collections.
     * @returns A list of public collections.
     */
    async findAllPublicCollections(): Promise<CollectionModel[]> {
        // The repository should handle filtering by `is_private: false`
        return this.collectionRepo.findAllPublic()
    }

    /**
     * Finds a public collection by its ID.
     * @param collectionId The ID of the collection to find.
     * @returns The collection if found and public, otherwise null.
     */
    async findPublicCollectionById(collectionId: number): Promise<CollectionModel | null> {
        // Ensure the repository method also checks for `is_private: false`
        return this.collectionRepo.findOne({ id: collectionId, is_private: false })
    }

    /**
     * Finds collections belonging to a specific user.
     * Implements authorization: a user can only view their own private collections
     * or any public collection.
     * @param targetUserId The ID of the user whose collections are being requested.
     * @param authenticatedUserId The ID of the currently authenticated user.
     * @returns A list of collections visible to the authenticated user.
     * @throws Error if the authenticated user is not authorized to view the requested private collections.
     */
    async findCollectionsByUserId(targetUserId: number, authenticatedUserId: number): Promise<CollectionModel[]> {
        if (targetUserId === authenticatedUserId) {
            // If the user is requesting their own collections, return all of them (public and private)
            return this.collectionRepo.findByUserId(targetUserId)
        } else {
            // If another user is requesting, only return public collections belonging to the target user
            return this.collectionRepo.findPublicByUserId(targetUserId)
        }
    }

    /**
     * Creates a new collection.
     * @param collectionData The data for the new collection.
     * @param userId The ID of the user creating the collection.
     * @returns The newly created collection, including its ID.
     */
    async createCollection(collectionData: CreateCollectionInput, userId: number): Promise<CollectionModel> {
        const dataToCreate = { ...collectionData, user_id: userId }
        const newCollectionId = await this.collectionRepo.create(dataToCreate)
        // Optionally, fetch the newly created collection to return it with its ID
        const newCollection = await this.collectionRepo.findOne({ id: newCollectionId })
        if (!newCollection) {
            throw new Error('Failed to retrieve newly created collection.')
        }
        return newCollection
    }

    /**
     * Updates an existing collection.
     * @param collectionId The ID of the collection to update.
     * @param updateData The data to update the collection with.
     * @param userId The ID of the user attempting to update the collection.
     * @returns The updated collection, or null if not found or unauthorized.
     */
    async updateCollection(
        collectionId: number,
        updateData: UpdateCollectionInput,
        userId: number,
    ): Promise<CollectionModel | null> {
        // First, check if the collection exists and belongs to the user
        const existingCollection = await this.collectionRepo.findOne({ id: collectionId })

        if (!existingCollection || existingCollection.user_id !== userId) {
            return null // Collection not found or user is not the owner
        }

        // Perform the update
        const success = await this.collectionRepo.update(collectionId, updateData)
        if (success) {
            // Fetch and return the updated collection
            return this.collectionRepo.findOne({ id: collectionId })
        }
        return null
    }

    /**
     * Deletes a collection.
     * @param collectionId The ID of the collection to delete.
     * @param userId The ID of the user attempting to delete the collection.
     * @returns True if the collection was successfully deleted, false otherwise.
     */
    async deleteCollection(collectionId: number, userId: number): Promise<boolean> {
        // First, check if the collection exists and belongs to the user
        const existingCollection = await this.collectionRepo.findOne({ id: collectionId })

        if (!existingCollection || existingCollection.user_id !== userId) {
            return false // Collection not found or user is not the owner
        }

        // Perform the deletion
        return this.collectionRepo.delete(collectionId)
    }
}

export type CollectionServiceInstance = InstanceType<typeof CollectionService>