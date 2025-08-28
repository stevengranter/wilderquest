// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, authLoading, verifyToken, accessToken } = useAuth()

    // Show loading state while authentication is being determined
    if (authLoading) {
        return <div>Loading...</div>
    }

    // Use the accessToken from the auth context instead of localStorage directly
    if (!isAuthenticated || !verifyToken(accessToken)) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}
