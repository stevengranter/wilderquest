import { Link } from 'react-router'
import { Card } from '@/components/ui/card'

export function Home() {
    return (
        <div className="main flex flex-col items-center h-screen">
        <Card className=" justify-center items-center w-100">
            <h1 className="text-xl tracking-wide">wilderQuest</h1>
            <p>[Logo]</p>
            <Link to="/quests">Explore</Link>
            <p>[Learn more]</p>
            <p>[FAQ]</p>
        </Card>
        </div>
    )
}
