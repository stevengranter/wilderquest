import { useCallback, useState } from 'react'

// Helper function to validate JWT token structure
function isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') return false

    // JWT should have exactly 3 parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Each part should be non-empty and contain only valid base64 characters
    const base64Regex = /^[A-Za-z0-9_-]+$/
    return parts.every((part) => part.length > 0 && base64Regex.test(part))
}

// Helper function to safely validate and return stored value
function getValidatedStoredValue<T>(key: string, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key)
        if (item === null) return defaultValue

        // For objects, try to parse JSON
        if (typeof defaultValue === 'object' && defaultValue !== null) {
            try {
                return JSON.parse(item)
            } catch (jsonError) {
                console.warn(
                    `Invalid JSON in localStorage for key "${key}":`,
                    jsonError
                )
                localStorage.removeItem(key) // Clear corrupted data
                return defaultValue
            }
        }

        // For strings, validate if it looks like a JWT token
        if (typeof defaultValue === 'string') {
            // Check if it looks like a JWT (starts with eyJ and has proper structure)
            if (item.startsWith('eyJ') && !isValidJWT(item)) {
                console.warn(
                    `Malformed JWT token detected for key "${key}", clearing corrupted data`
                )
                localStorage.removeItem(key) // Clear corrupted JWT
                return defaultValue
            }
        }

        // For other strings or valid data, return as-is
        return item as T
    } catch (error) {
        console.warn(`Error reading localStorage for key "${key}":`, error)
        return defaultValue
    }
}

// Enhanced localStorage hook with validation
export function useSimpleLocalStorage<T>(key: string, defaultValue: T) {
    const [value, setValue] = useState<T>(() =>
        getValidatedStoredValue(key, defaultValue)
    )

    const setStoredValue = useCallback(
        (newValue: T) => {
            try {
                // Validate JWT tokens before storing
                if (
                    typeof newValue === 'string' &&
                    newValue.startsWith('eyJ') &&
                    !isValidJWT(newValue)
                ) {
                    console.error(
                        `Attempted to store invalid JWT token for key "${key}"`
                    )
                    return // Don't store invalid tokens
                }

                setValue(newValue)

                if (newValue === null || newValue === undefined) {
                    localStorage.removeItem(key)
                } else if (typeof newValue === 'object') {
                    const jsonString = JSON.stringify(newValue)
                    localStorage.setItem(key, jsonString)
                } else {
                    // Store strings directly (no JSON.stringify for JWT tokens)
                    localStorage.setItem(key, String(newValue))
                }
            } catch (error) {
                console.error(`Error storing value for key "${key}":`, error)
                // If storage fails, revert the state change
                setValue(value)
            }
        },
        [key, value]
    )

    return [value, setStoredValue] as const
}
