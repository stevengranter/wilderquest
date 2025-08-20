import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from '@/components/ui/menubar'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import avatar from 'animal-avatar-generator'
import { ReactSVG } from 'react-svg'
import { Button } from '@/components/ui/button'

export function MainMenu() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const userAvatar = user ? avatar(user.username, { size: 40 }) : null;

    const handleLogout = async () => {
        await logout();
        navigate('/'); // Redirect to home after logout
    };

    // HOME ("/") → Login button right, no title
    if (location.pathname === '/') {
        return (
            <div className="flex w-full justify-end border-0 mb-2">
                <Button asChild>
                    <Link to="/login">Login</Link>
                </Button>
            </div>
        );
    }

    // LOGIN PAGE ("/login") → Title left, no login button
    if (location.pathname === '/login') {
        return (
            <Menubar className="flex w-full items-center justify-between border-0 mb-2">
                <div>
                    <Link to="/">
                        <h1 className="mx-4">wilderQuest</h1>
                    </Link>
                </div>
            </Menubar>
        );
    }

    // ALL OTHER PAGES → Title left, login/avatar menu right
    return (
        <Menubar className="flex w-full items-center justify-between border-0 mb-2">
            {/* Left section */}
            <div>
                <Link to="/">
                    <h1 className="mx-4">wilderQuest</h1>
                </Link>
            </div>

            {/* Right section */}
            <div>
                <MenubarMenu>
                    {isAuthenticated && user && userAvatar ? (
                        <>
                            <MenubarTrigger className="cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <ReactSVG
                                        src={`data:image/svg+xml;utf8,${encodeURIComponent(userAvatar)}`}
                                        className="w-6 h-6 rounded-full overflow-hidden border-2 border-border"
                                    />
                                    <span>{user.username}</span>
                                </div>
                            </MenubarTrigger>
                            <MenubarContent>
                                <MenubarItem asChild>
                                    <Link to={`/users/${user.username}`}>Profile</Link>
                                </MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem onSelect={handleLogout}>Logout</MenubarItem>
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
            </div>
        </Menubar>
    );
}
