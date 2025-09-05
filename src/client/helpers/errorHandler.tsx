import axios from 'axios'
import { toast } from 'sonner'

export const handleError = (error: unknown) => {
    const isProduction = process.env.NODE_ENV === 'production'

    // First, check if it's an AxiosError
    if (axios.isAxiosError(error)) {
        const err = error.response
        if (Array.isArray(err?.data.errors)) {
            for (const val of err.data.errors) {
                if (!isProduction) {
                    console.log('Axios validation error:', val.message)
                }
                toast.error(
                    val.description ||
                        val.message ||
                        'A validation error occurred.'
                )
            }
        } else if (typeof err?.data.errors === 'object') {
            for (const e in err?.data.errors) {
                const errorMessage = err.data.errors[e][0]
                toast.error(errorMessage)
                if (!isProduction) {
                    console.log('Axios object error:', errorMessage)
                }
            }
        } else if (err?.data) {
            if (!isProduction) {
                console.log('Axios data error:', err)
                // Log rate limit source for debugging
                if (err.status === 429) {
                    console.log(
                        '🚨 429 Error Source:',
                        err.data.source || 'unknown'
                    )
                    console.log('🚨 Rate limit headers:', err.headers)
                }
            }
            // Special handling for 429 errors
            if (err.status === 429) {
                const source = err.data.source || 'unknown'
                const message = err.data.message || 'Rate limit exceeded'
                toast.error(`${message} (Source: ${source})`)
            } else {
                toast.error(err.data.message || 'An unexpected error occurred.')
            }
        } else if (err?.status === 401) {
            if (!isProduction) {
                console.log('Axios 401 error: Please login')
            }
            toast.error('Please login to continue.')
            window.history.pushState({}, 'LoginPage', '/login')
        } else {
            // Fallback for other Axios errors without specific data/status handling
            if (!isProduction) {
                console.log('Generic Axios error:', error.message || error)
            }
            toast.error(error.message || 'An Axios error occurred.')
        }
    }
    // Next, check if it's a standard JavaScript Error
    else if (error instanceof Error) {
        if (!isProduction) {
            console.log('Standard Error:', error.message)
        }
        toast.error(error.message)
    }
    // Finally, handle anything else (could be a string, number, null, undefined, etc.)
    else {
        const errorMessage =
            typeof error === 'string' ? error : 'An unknown error occurred.'
        if (!isProduction) {
            console.log('Unknown Error:', error)
        }
        toast.error(errorMessage)
    }
}
