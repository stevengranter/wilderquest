import { retryWithBackoff } from '../retryWithBackoff.js'
import axios from 'axios'

// Mock axios to avoid network calls
jest.mock('axios', () => ({
    default: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    isAxiosError: jest.fn(),
}))

// Cast axios to mocked type
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('retryWithBackoff', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return successful response on first attempt', async () => {
        const mockResponse = { data: 'success', status: 200 }
        mockedAxios.get.mockResolvedValue(mockResponse)

        const result = await retryWithBackoff(() => mockedAxios.get('/api/test'))

        expect(result).toEqual(mockResponse)
        expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })

    it('should retry on 429 error up to maxRetries', async () => {
        const successResponse = { data: 'success', status: 200 }

        // Mock axios.isAxiosError to return true for our mock error
        const mockAxiosError = {
            response: { status: 429 },
        }

        mockedAxios.isAxiosError.mockReturnValue(true)

        mockedAxios.get
            .mockRejectedValueOnce(mockAxiosError) // First attempt fails with 429
            .mockRejectedValueOnce(mockAxiosError) // Second attempt fails with 429
            .mockResolvedValueOnce(successResponse) // Third attempt succeeds

        const result = await retryWithBackoff(
            () => mockedAxios.get('/api/test'),
            { maxRetries: 3, baseDelay: 10 } // Short delay for tests
        )

        expect(result).toEqual(successResponse)
        expect(mockedAxios.get).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-429 errors', async () => {
        mockedAxios.isAxiosError.mockReturnValue(false)
        mockedAxios.get.mockRejectedValue(new Error('Network error'))

        await expect(
            retryWithBackoff(() => mockedAxios.get('/api/test'))
        ).rejects.toThrow('Network error')
        expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    })

    it('should respect maxRetries limit', async () => {
        // Create a proper mock error that mimics an Axios error
        const mockAxiosError = {
            response: { status: 429 },
            isAxiosError: true,
            config: {},
            toJSON: () => ({}),
        }

        mockedAxios.isAxiosError.mockReturnValue(true)
        mockedAxios.get.mockRejectedValue(mockAxiosError)

        let errorThrown = false

        try {
            await retryWithBackoff(() => mockedAxios.get('/api/test'), {
                maxRetries: 2,
                baseDelay: 10,
            })
        } catch (_error) {
            errorThrown = true
        }

        expect(errorThrown).toBe(true)
        expect(mockedAxios.get).toHaveBeenCalledTimes(3) // initial + 2 retries
    })

    it('should handle successful responses without retries', async () => {
        const mockResponse = { data: { users: [] }, status: 200 }
        mockedAxios.post.mockResolvedValue(mockResponse)

        const result = await retryWithBackoff(() =>
            mockedAxios.post('/api/users', { name: 'test' })
        )

        expect(result).toEqual(mockResponse)
        expect(mockedAxios.post).toHaveBeenCalledTimes(1)
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/users', { name: 'test' })
    })
})
