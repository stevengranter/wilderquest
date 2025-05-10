import { Link } from 'react-router'
import usePexelsBackground from '@/hooks/usePexelsBackground'

export default function LandingPage() {
    usePexelsBackground()
    return (
        <>
            <h1 className="font-allerta-stencil text-5xl">wildernest</h1>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            {/*<Link to='/camera'>Camera</Link>*/}
            <Link to="/search">Search</Link>
        </>
    )
}
