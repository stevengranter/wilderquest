import useAuth from '@/hooks/useAuth'
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar'

export default function LoginStatus() {
    const {isLoggedIn} = useAuth()

    return isLoggedIn ? 'Logged in' : 'Logged out'
}
