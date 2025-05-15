import { Link } from 'react-router'
import { Card } from '@/components/ui/card'
import SearchForm from '@/components/SearchForm'

export default function LandingPage() {
    // usePexelsBackground()
    return (
        <div className='flex flex-col p-10 w-3/4'>
            {/*<nav className="text-main-foreground transition-colors">*/}
            {/*    <ThemeSwitcher />*/}
            {/*</nav>*/}
            <h1 className='font-display text-6xl'>wildernest</h1>
            <Card className="w-lg">
                <p>A web app for exploring the world of wildlife.</p>
            </Card>
            <SearchForm />

            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            {/*<Link to='/camera'>Camera</Link>*/}
            <Link to="/search">Search</Link>
        </div>
    )
}
