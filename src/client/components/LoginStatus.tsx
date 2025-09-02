import { useAuth } from '@/hooks/useAuth'

export default function LoginStatus() {
    const { isAuthenticated } = useAuth()

    return isAuthenticated ? 'Logged in' : 'Logged out'
}
