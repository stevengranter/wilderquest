export interface Collection {
    id: number
    name: string
    description?: string
    is_private: boolean
    user_id: number
    emoji?: string
    created_at: string
    updated_at: string
    taxon_ids?: number[]
}
