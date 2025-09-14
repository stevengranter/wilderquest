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
        maxRetries = 5, // Increased from 3 to 5 for better rate limit handling
        baseDelay = 2000, // Increased from 1s to 2s for rate limits
        maxDelay = 60000, // Increased from 30s to 60s
        retryOn429 = true,
    } = options

    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await requestFn()

            // If we get here, the request succeeded
            if (attempt > 0) {
                logger.info(
                    `Request succeeded on attempt ${attempt + 1} after ${attempt} retries`
                )
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
                    // Calculate exponential backoff delay with jitter
                    const exponentialDelay = baseDelay * Math.pow(2, attempt)
                    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
                    const delay = Math.min(exponentialDelay + jitter, maxDelay)

                    logger.warn(
                        `Rate limit hit on attempt ${attempt + 1}/${maxRetries + 1}. ` +
                            `Retrying in ${(delay / 1000).toFixed(1)}s...`,
                        {
                            attempt: attempt + 1,
                            maxRetries: maxRetries + 1,
                            delay: (delay / 1000).toFixed(1) + 's',
                            retryAfter:
                                error.response?.headers?.['retry-after'],
                            status: error.response?.status,
                        }
                    )

                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, delay))
                    continue
                } else {
                    logger.error(
                        `Max retries (${maxRetries}) exceeded for 429 error. Giving up.`,
                        {
                            maxRetries,
                            totalAttempts: maxRetries + 1,
                            finalStatus: error.response?.status,
                            finalRetryAfter:
                                error.response?.headers?.['retry-after'],
                        }
                    )
                    throw error
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
