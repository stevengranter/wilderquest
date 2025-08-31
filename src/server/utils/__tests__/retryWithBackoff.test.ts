import { retryWithBackoff } from '../retryWithBackoff.js'

// Mock axios to avoid network calls
jest.mock('axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    isAxiosError: jest.fn(),
}))

const axios = require('axios')

describe('retryWithBackoff', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return successful response on first attempt', async () => {
        const mockResponse = { data: 'success', status: 200 }
        axios.get.mockResolvedValue(mockResponse)

        const result = await retryWithBackoff(() => axios.get('/api/test'))

        expect(result).toEqual(mockResponse)
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('should retry on 429 error up to maxRetries', async () => {
        const successResponse = { data: 'success', status: 200 }

        // Mock axios.isAxiosError to return true for our mock error
        const mockAxiosError = {
            response: { status: 429 },
        }

        axios.isAxiosError.mockReturnValue(true)

        axios.get
            .mockRejectedValueOnce(mockAxiosError) // First attempt fails with 429
            .mockRejectedValueOnce(mockAxiosError) // Second attempt fails with 429
            .mockResolvedValueOnce(successResponse) // Third attempt succeeds

        const result = await retryWithBackoff(
            () => axios.get('/api/test'),
            { maxRetries: 3, baseDelay: 10 } // Short delay for tests
        )

        expect(result).toEqual(successResponse)
        expect(axios.get).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-429 errors', async () => {
        axios.isAxiosError.mockReturnValue(false)
        axios.get.mockRejectedValue(new Error('Network error'))

        await expect(
            retryWithBackoff(() => axios.get('/api/test'))
        ).rejects.toThrow('Network error')
        expect(axios.get).toHaveBeenCalledTimes(1)
    })

    it('should respect maxRetries limit', async () => {
        // Create a proper mock error that mimics an Axios error
        const mockAxiosError = {
            response: { status: 429 },
            isAxiosError: true,
            config: {},
            toJSON: () => ({}),
        }

        axios.isAxiosError.mockReturnValue(true)
        axios.get.mockRejectedValue(mockAxiosError)

        let errorThrown = false

        try {
            await retryWithBackoff(() => axios.get('/api/test'), {
                maxRetries: 2,
                baseDelay: 10,
            })
        } catch (error) {
            errorThrown = true
        }

        expect(errorThrown).toBe(true)
        expect(axios.get).toHaveBeenCalledTimes(3) // initial + 2 retries
    })

    it('should handle successful responses without retries', async () => {
        const mockResponse = { data: { users: [] }, status: 200 }
        axios.post.mockResolvedValue(mockResponse)

        const result = await retryWithBackoff(() =>
            axios.post('/api/users', { name: 'test' })
        )

        expect(result).toEqual(mockResponse)
        expect(axios.post).toHaveBeenCalledTimes(1)
        expect(axios.post).toHaveBeenCalledWith('/api/users', { name: 'test' })
    })
})
