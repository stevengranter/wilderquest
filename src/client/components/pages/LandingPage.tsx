import { Link } from 'react-router'
// import usePexelsBackground from '@/hooks/usePexelsBackground'
import { Card } from '@/components/ui/card'

export default function LandingPage() {
    // usePexelsBackground()
    return (
        <>
            <h1 className="font-allerta-stencil text-5xl">wildernest</h1>
            <Card>
                <p>A web app for exploring the world of wildlife.</p>
            </Card>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            {/*<Link to='/camera'>Camera</Link>*/}
            <Link to="/search">Search</Link>
        </>
    )
}
