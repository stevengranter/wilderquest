// src/server/utils/retryWithBackoff.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import logger from '../config/logger.js'

interface RetryOptions {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    retryOn429?: boolean
}

export async function retryWithBackoff<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    options: RetryOptions = {}
): Promise<AxiosResponse<T>> {
    const {
        maxRetries = 3,
        baseDelay = 1000, // 1 second
        maxDelay = 30000, // 30 seconds
        retryOn429 = true,
    } = options

    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await requestFn()

            // If we get here, the request succeeded
            if (attempt > 0) {
                logger.info(`Request succeeded on attempt ${attempt + 1}`)
            }

            return response
        } catch (error) {
            lastError = error as Error

            // Check if this is a 429 error and we should retry
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 429 &&
                retryOn429
            ) {
                if (attempt < maxRetries) {
                    // Calculate exponential backoff delay
                    const delay = Math.min(
                        baseDelay * Math.pow(2, attempt),
                        maxDelay
                    )

                    logger.warn(
                        `Received 429 error on attempt ${attempt + 1}/${maxRetries + 1}. ` +
                            `Retrying in ${delay}ms...`
                    )

                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, delay))
                    continue
                } else {
                    logger.error(
                        `Max retries (${maxRetries}) exceeded for 429 error. Giving up.`
                    )
                }
            }

            // If it's not a 429 error or we shouldn't retry on 429, throw immediately
            throw error
        }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError!
}

// Helper function for GET requests
export async function getWithRetry<T>(
    url: string,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
): Promise<AxiosResponse<T>> {
    return retryWithBackoff(() => axios.get<T>(url, config), retryOptions)
}

// Helper function for POST requests
export async function postWithRetry<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
): Promise<AxiosResponse<T>> {
    return retryWithBackoff(
        () => axios.post<T>(url, data, config),
        retryOptions
    )
}
