// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, verifyToken } = useAuth()

    if (!isAuthenticated || !verifyToken(localStorage.getItem('accessToken'))) {
        return <Navigate to="/login" />
    }

    return <>{children}</>
}
