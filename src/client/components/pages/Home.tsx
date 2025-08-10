import { Link } from 'react-router'

export function Home() {
    return (
        <>
            <h1>WilderQuest</h1>
            <p>[Logo]</p>
            <Link to="/quests">Explore</Link>
            <p>[Learn more]</p>
            <p>[FAQ]</p>
        </>
    )
}
