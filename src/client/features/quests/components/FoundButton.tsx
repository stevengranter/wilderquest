'use client'

import { Button } from '@/components/ui/button'
import { DetailedProgress, QuestMapping, QuestStatus, Share } from '../types'
import { LoggedInUser } from '@shared/types/authTypes'
import { cn } from '@/lib/utils'

interface FoundButtonProps {
    // Core data
    mapping?: QuestMapping
    progressCount: number
    detailedProgress?: DetailedProgress[]

    // User context
    isOwner: boolean
    user?: LoggedInUser | null
    share?: Share
    token?: string

    // Quest context
    questStatus: QuestStatus

    // Interaction
    onClick?: (e: React.MouseEvent) => void | Promise<void>

    // Styling
    variant?: 'default' | 'neutral'
    size?: 'sm' | 'default'
    className?: string
    fullWidth?: boolean

    // Permissions
    canInteract?: (questStatus?: string) => boolean | string | undefined
}

export function FoundButton({
    mapping,
    progressCount,
    detailedProgress,
    isOwner,
    user,
    share,
    token,
    questStatus,
    onClick,
    variant = 'neutral',
    size = 'sm',
    className,
    fullWidth = false,
    canInteract,
}: FoundButtonProps) {
    // Check if user can interact with this quest
    const canUserInteract = canInteract
        ? Boolean(canInteract(questStatus))
        : questStatus === 'active'

    // Check if current user has already marked this species as found
    const currentUserDisplayName = isOwner ? user?.username : share?.guest_name

    const userHasFound = detailedProgress?.some(
        (progress) =>
            progress.mapping_id === mapping?.id &&
            progress.display_name === currentUserDisplayName
    )

    // Don't render if no mapping or can't interact
    if (!mapping || !canUserInteract) {
        return null
    }

    // Don't render if not owner and no token
    if (!isOwner && !token) {
        return null
    }

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()

        if (onClick) {
            await onClick(e)
        }
    }

    return (
        <Button
            className={cn(
                'shadow-0 border-1',
                fullWidth && 'w-full',
                className
            )}
            size={size}
            variant={progressCount > 0 ? 'neutral' : variant}
            disabled={questStatus !== 'active'}
            onClick={handleClick}
        >
            {userHasFound ? 'Mark as unfound' : 'Found'}
        </Button>
    )
}
