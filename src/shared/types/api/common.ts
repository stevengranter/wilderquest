// --- Common API Types ---

import type { INatTaxon } from './iNaturalist.js'

export interface ApiError {
    error: string
    message?: string
    status?: number
    code?: string
}

export interface PaginatedRequest {
    page?: number
    per_page?: number
}

export interface PaginatedResponse<T> {
    results: T[]
    total_results: number
    page: number
    per_page: number
    total_pages?: number
}

export interface ApiResponse<T> {
    data: T
    success: boolean
    message?: string
    errors?: ApiError[]
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestConfig {
    method?: HttpMethod
    headers?: Record<string, string>
    params?: Record<string, unknown>
    data?: unknown
    timeout?: number
}

// Rate limiting types
export interface RateLimitInfo {
    remaining: number
    limit: number
    resetTime: Date
    isBlocked: boolean
}

// Cache types
export interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl?: number
}

// WebSocket types
export interface WebSocketMessage<T = unknown> {
    type: string
    payload: T
    timestamp: number
}

// File upload types
export interface FileUploadResult {
    url: string
    filename: string
    size: number
    mimeType: string
}

// Geolocation types
export interface GeolocationPosition {
    latitude: number
    longitude: number
    accuracy?: number
    timestamp: number
}

export interface GeolocationError {
    code: number
    message: string
    timestamp: number
}

// --- Taxon Types ---

export interface TaxonData {
    id: number
    name: string
    preferred_common_name: string
    rank?: INatTaxon['rank']
    default_photo?: INatTaxon['default_photo']
    iconic_taxon_name?: string
    observations_count?: number
    wikipedia_url?: string
}
