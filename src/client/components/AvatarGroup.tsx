import avatar from 'animal-avatar-generator'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface AvatarUser {
    username: string
    isRegistered?: boolean
}

interface AvatarGroupProps {
    users?: AvatarUser[]
    displayName?: string
    displayNames?: string[]
    firstFinder?: string
    maxAvatars?: number
    size?: number
    className?: string
    linkToProfile?: boolean
}

export function AvatarGroup({
    users,
    displayName,
    displayNames,
    firstFinder,
    maxAvatars = 3,
    size = 32,
    className = '',
    linkToProfile = false,
}: AvatarGroupProps) {
    // Support backward compatibility: users array, or displayName(s)
    const names: string[] = users
        ? users.map((u) => u.username)
        : displayNames || (displayName ? [displayName] : [])

    if (names.length === 0) return null

    const sortedNames =
        firstFinder && names.includes(firstFinder)
            ? [firstFinder, ...names.filter((n) => n !== firstFinder)]
            : names

    const displayNamesSlice = sortedNames.slice(0, maxAvatars)

    if (displayNamesSlice.length > 1) {
        const avatars = displayNamesSlice.map((name, index) => {
            const avatarSvg = avatar(name, { size })
            const offsetSvg = avatarSvg.replace(
                '<svg',
                '<svg transform="translate(15, 12) scale(1.7)"'
            )
            const isFirstFinder = firstFinder && name === firstFinder

            const userObj = users?.find((u) => u.username === name)
            const shouldLink =
                linkToProfile || (userObj?.isRegistered && name !== 'Guest')

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

            return shouldLink ? (
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
                {names.length > maxAvatars && (
                    <div className="ml-1 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                        +{names.length - maxAvatars}
                    </div>
                )}
            </div>
        )
    }

    const name = displayNamesSlice[0]
    const avatarSvg = avatar(name, { size })
    const isFirstFinder = firstFinder && name === firstFinder

    const userObj = users?.find((u) => u.username === name)
    const shouldLink =
        linkToProfile || (userObj?.isRegistered && name !== 'Guest')

    const avatarElement = (
        <Avatar
            className={cn(
                className,
                'border-2 outline-0',
                isFirstFinder ? 'border-yellow-400' : 'border-white'
            )}
        >
            <AvatarImage
                src={`data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`}
            />
        </Avatar>
    )

    return shouldLink ? (
        <Link to={`/users/${name}`}>{avatarElement}</Link>
    ) : (
        avatarElement
    )
}
