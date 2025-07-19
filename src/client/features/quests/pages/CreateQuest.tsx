import { useAuth } from '@/hooks/useAuth'

export function CreateQuest() {
    const {isAuthenticated} = useAuth();

    if (!isAuthenticated) {
        return <p>Not authenticated.</p>;
    }

    return (
        <>
            <h1>Create Quest</h1>
            </>
        )
}