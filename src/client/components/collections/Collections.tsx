import { useAuth } from '@/hooks/useAuth'

export default function Collections() {
    const { user } = useAuth()

    return (<div>Collections</div>)
}