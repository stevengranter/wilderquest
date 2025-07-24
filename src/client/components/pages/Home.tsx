import { Link } from 'react-router'
import { TokenTestComponent } from '@/components/TokenTestComponent'

export function Home() {
    return (
        <>
            <h1>Home</h1>
            <Link to="/quests">Quests</Link>
            <TokenTestComponent />
        </>
    )
}
