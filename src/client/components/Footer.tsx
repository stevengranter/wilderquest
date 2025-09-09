import { Link, useLocation } from 'react-router-dom'

export function Footer() {
    const currentYear = new Date().getFullYear()
    const location = useLocation()
    const isOnHomepage = location.pathname === '/'

    return (
        <footer className="relative mt-12 py-4 text-center text-sm text-muted-foreground bg-main">
            {/* Badge positioned to overlap the content above */}
            {!isOnHomepage ? (
                <Link to="/">
                    <div className="absolute -top-14 left-8 -rotate-12 drop-shadow-md hover:rotate-0 hover:scale-110 transition-all duration-300 cursor-pointer">
                        <img
                            src="/wilderquest_badge.png"
                            alt="WilderQuest Badge"
                            className="w-40 h-40 object-contain"
                        />
                    </div>
                </Link>
            ) : (
                <div className="absolute -top-14 left-8 -rotate-12 drop-shadow-md">
                    <img
                        src="/wilderquest_badge.png"
                        alt="WilderQuest Badge"
                        className="w-40 h-40 object-contain"
                    />
                </div>
            )}
            <div className="pt-20">
                <p>&copy; {currentYear} Wildernest. All rights reserved.</p>
            </div>
        </footer>
    )
}
