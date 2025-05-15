import { Link } from 'react-router'
import { Card } from '@/components/ui/card'

export default function LandingPage() {
    // usePexelsBackground()
    return (
        <>
            {/*<nav className="text-main-foreground transition-colors">*/}
            {/*    <ThemeSwitcher />*/}
            {/*</nav>*/}
            <h1 className='font-display text-6xl'>wildernest</h1>
            <Card className="w-lg">
                <p>A web app for exploring the world of wildlife.</p>
            </Card>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            {/*<Link to='/camera'>Camera</Link>*/}
            <Link to="/search">Search</Link>
        </>
    )
}
