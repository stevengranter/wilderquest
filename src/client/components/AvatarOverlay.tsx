import avatar from 'animal-avatar-generator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface AvatarOverlayProps {
    displayName?: string
    displayNames?: string[]
    firstFinder?: string
    size?: number
    className: string
    linkToProfile?: boolean
}

export function AvatarOverlay({
    displayName,
    displayNames,
    firstFinder,
    size = 32,
    className,
    linkToProfile = false,
}: AvatarOverlayProps) {
    // Support both single displayName (backward compatibility) and multiple displayNames
    const names = displayNames || (displayName ? [displayName] : [])

    if (names.length === 0) return null

    // For multiple names, show up to 3 avatars in a horizontal line
    if (names.length > 1) {
        // Reorder names so first finder appears first (on top)
        let orderedNames = [...names]
        if (firstFinder && names.includes(firstFinder)) {
            orderedNames = [
                firstFinder,
                ...names.filter((name) => name !== firstFinder),
            ]
        }

        const displayCount = Math.min(orderedNames.length, 3)
        const avatars = orderedNames
            .slice(0, displayCount)
            .map((name, index) => {
                const avatarSvg = avatar(name, { size })
                const offsetSvg = avatarSvg.replace(
                    '<svg',
                    '<svg transform="translate(15, 12) scale(1.7)"'
                )
                const isFirstFinder = firstFinder && name === firstFinder

                const avatarElement = (
                    <Avatar
                        key={name}
                        className={cn(
                            className,
                            'border-3 outline-0',
                            isFirstFinder
                                ? 'border-yellow-400 !border-solid'
                                : 'border-white !border-solid',
                            index > 0 && '-ml-2', // Overlap each avatar slightly
                            `z-${10 - index}` // Higher z-index for avatars on the left
                        )}
                    >
                        <AvatarImage
                            src={`data:image/svg+xml;utf8,${encodeURIComponent(offsetSvg)}`}
                            style={{
                                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
                            }}
                        />
                    </Avatar>
                )

                return linkToProfile && name !== 'Guest' ? (
                    <Link key={name} to={`/users/${name}`}>
                        {avatarElement}
                    </Link>
                ) : (
                    avatarElement
                )
            })

        return (
            <div className="flex items-center">
                {avatars}
                {names.length > 3 && (
                    <div className="ml-1 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                        +{names.length - 3}
                    </div>
                )}
            </div>
        )
    }

    // Single avatar (original behavior)
    const avatarSvg = avatar(names[0], { size })
    const offsetSvg = avatarSvg.replace(
        '<svg',
        '<svg transform="translate(15, 12) scale(1.7)"'
    )
    const isFirstFinder = firstFinder && names[0] === firstFinder

    const avatarElement = (
        <Avatar
            className={cn(
                className,
                'border-2 outline-0',
                isFirstFinder ? 'border-yellow-400' : 'border-white'
            )}
        >
            <AvatarImage
                src={`data:image/svg+xml;utf8,${encodeURIComponent(offsetSvg)}`}
            />
        </Avatar>
    )

    return linkToProfile && names[0] !== 'Guest' ? (
        <Link to={`/users/${names[0]}`}>
            {avatarElement}
        </Link>
    ) : (
        avatarElement
    )
}
