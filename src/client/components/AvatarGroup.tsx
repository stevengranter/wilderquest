import { SingleAvatar } from './SingleAvatar'
import { cn } from '@/lib/utils'

interface AvatarUser {
    username: string
    isRegistered?: boolean
}

interface AvatarGroupProps {
    users: AvatarUser[]
    firstFinder?: string
    maxAvatars?: number
    size?: number
    className?: string
}

export function AvatarGroup({
    users,
    firstFinder,
    maxAvatars = 3,
    size = 32,
    className = '',
}: AvatarGroupProps) {
    // Sort so first finder appears first (on top)
    const sortedUsers = firstFinder
        ? [
              ...users.filter((u) => u.username === firstFinder),
              ...users.filter((u) => u.username !== firstFinder),
          ]
        : users

    const displayUsers = sortedUsers.slice(0, maxAvatars)

    return (
        <div className={cn('flex items-center', className)}>
            {displayUsers.map((user, index) => (
                <SingleAvatar
                    key={user.username}
                    username={user.username}
                    isRegistered={user.isRegistered}
                    size={size}
                    className={cn(
                        'border-3 outline-0',
                        index > 0 && '-ml-2', // Overlap each avatar slightly
                        `z-${10 - index}` // Higher z-index for avatars on the left
                    )}
                />
            ))}
            {users.length > maxAvatars && (
                <div className="ml-1 bg-gray-800 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                    +{users.length - maxAvatars}
                </div>
            )}
        </div>
    )
}
