import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from '@/components/ui/menubar'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/core/auth/useAuth'
import avatar from 'animal-avatar-generator'
import { ReactSVG } from 'react-svg'
import { Button } from '@/components/ui/button'
import { paths } from '@/app/routing/paths'

export function MainMenu() {
    const { isAuthenticated, user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const userAvatar = user ? avatar(user.username, { size: 40 }) : null
    const offsetSvg = userAvatar
        ? userAvatar.replace(
              '<svg',
              '<svg transform="translate(8, 8) scale(1.3)"'
          )
        : null

    const handleLogout = async () => {
        await logout()
        navigate('/') // Redirect to home after logout
    }

    // Right-side menu (login/avatar)
    const renderUserMenu = () => (
        <MenubarMenu>
            {isAuthenticated && user && userAvatar ? (
                <>
                    <MenubarTrigger className="cursor-pointer">
                        <div className="flex items-center gap-2">
                            <ReactSVG
                                src={`data:image/svg+xml;utf8,${encodeURIComponent(offsetSvg || userAvatar)}`}
                                className="w-6 h-6 rounded-full overflow-hidden border-2 border-border"
                            />
                            <span>{user.username}</span>
                        </div>
                    </MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem asChild>
                            <Link to={paths.userProfile(user.username)}>
                                Profile
                            </Link>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onSelect={handleLogout}>
                            Logout
                        </MenubarItem>
                    </MenubarContent>
                </>
            ) : (
                <MenubarTrigger className="cursor-pointer border-0 p-0 m-0">
                    <Button asChild>
                        <Link to="/login">Login</Link>
                    </Button>
                </MenubarTrigger>
            )}
        </MenubarMenu>
    )

    const isHome = location.pathname === '/'
    const isLogin = location.pathname === '/login'

    return (
        !isLogin && (
            <Menubar
                className={`flex w-full items-center border-0 mb-2 ${
                    isHome
                        ? 'justify-end bg-transparent'
                        : 'justify-between bg-transparent'
                }`}
            >
                {/* Left section (title) → show only if NOT home */}
                {!isHome && (
                    <div>
                        <Link to="/">
                            <h1 className="mx-4">wilderQuest</h1>
                        </Link>
                    </div>
                )}

                {/* Right section (login/avatar) → hide on /login */}
                {!isLogin && <div>{renderUserMenu()}</div>}
            </Menubar>
        )
    )
}
