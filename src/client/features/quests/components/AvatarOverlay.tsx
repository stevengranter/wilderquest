import avatar from 'animal-avatar-generator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'

interface AvatarOverlayProps {
    displayName: string
    size?: number
    className: string
}

export function AvatarOverlay({ displayName, size = 32, className }: AvatarOverlayProps) {
    const avatarSvg = avatar(displayName, { size })

    return (
        <Avatar className={className}>
            <AvatarImage src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`} />
        </Avatar>
    )
}
