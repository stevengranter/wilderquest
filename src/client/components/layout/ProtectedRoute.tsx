// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '@/features/auth/useAuth'
import { clientDebug } from '../../lib/debug'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, authLoading, getValidToken } = useAuth()
    const [tokenCheckLoading, setTokenCheckLoading] = useState(true)
    const [hasValidToken, setHasValidToken] = useState(false)

    useEffect(() => {
        const checkToken = async () => {
            if (authLoading) {
                return // Wait for auth to finish loading
            }

            if (!isAuthenticated) {
                setTokenCheckLoading(false)
                setHasValidToken(false)
                return
            }

            try {
                clientDebug.auth(
                    '🔍 ProtectedRoute: Checking for valid token...'
                )
                const validToken = await getValidToken()

                if (validToken) {
                    clientDebug.auth('✅ ProtectedRoute: Valid token obtained')
                    setHasValidToken(true)
                } else {
                    clientDebug.auth(
                        '❌ ProtectedRoute: No valid token available'
                    )
                    setHasValidToken(false)
                }
            } catch (error) {
                clientDebug.auth(
                    '❌ ProtectedRoute: Token check failed:',
                    error
                )
                setHasValidToken(false)
            } finally {
                setTokenCheckLoading(false)
            }
        }

        checkToken()
    }, [isAuthenticated, authLoading, getValidToken])

    // Show loading state while authentication or token check is in progress
    if (authLoading || tokenCheckLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p>Loading...</p>
                </div>
            </div>
        )
    }

    // Redirect to login if not authenticated or no valid token
    if (!isAuthenticated || !hasValidToken) {
        clientDebug.auth('🔒 ProtectedRoute: Redirecting to login', {
            isAuthenticated,
            hasValidToken,
        })
        return <Navigate to="/login" replace />
    }

    clientDebug.auth('✅ ProtectedRoute: Rendering protected content')
    return <>{children}</>
}
