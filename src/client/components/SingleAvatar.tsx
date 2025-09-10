import avatar from 'animal-avatar-generator'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface SingleAvatarProps {
    username: string
    isRegistered?: boolean
    size?: number
    className?: string
    showLink?: boolean
}

export function SingleAvatar({
    username,
    isRegistered = false,
    size = 32,
    className = '',
    showLink,
}: SingleAvatarProps) {
    const shouldLink =
        showLink !== undefined ? showLink : isRegistered && username !== 'Guest'

    const avatarSvg = avatar(username, { size })

    const avatarElement = (
        <div
            className={cn(
                'rounded-full border-1 border-white overflow-hidden',
                className
            )}

        >
            <img
                src={`data:image/svg+xml;base64,${btoa(avatarSvg)}`}
                alt={`${username} avatar`}
                className="w-full h-full object-cover"
            />
        </div>
    )

    return shouldLink ? (
        <Link to={`/users/${username}`}>{avatarElement}</Link>
    ) : (
        avatarElement
    )
}
