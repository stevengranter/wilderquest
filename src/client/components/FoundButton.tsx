'use client'

import { Button } from '@/components/ui/button'
import { LoggedInUser } from '@/types/authTypes'
import { cn } from '@/lib/utils'
import { MouseEvent } from 'react'
import {
    DetailedProgress,
    QuestMapping,
    ClientQuest,
    Share,
} from '@/types/questTypes'

interface FoundButtonProps {
    // Core data
    mapping?: QuestMapping
    progressCount: number
    detailedProgress?: DetailedProgress[]

    // Consolidated context (replaces 8+ individual props)
    questContext: {
        questData: ClientQuest
        user?: LoggedInUser
        share?: Share
        token?: string
        isOwner: boolean
        canInteract: (questStatus?: string) => boolean
    }

    // Interaction
    onClick?: (e: MouseEvent) => void | Promise<void>

    // Styling
    variant?: 'default' | 'neutral'
    size?: 'sm' | 'default'
    className?: string
    fullWidth?: boolean
}

export function FoundButton({
    mapping,
    progressCount,
    detailedProgress,
    questContext,
    onClick,
    variant = 'neutral',
    size = 'sm',
    className,
    fullWidth = false,
}: FoundButtonProps) {
    // Extract values from consolidated context
    const { questData, user, share, token, isOwner, canInteract } = questContext
    const questStatus = questData.status
    const questMode = questData.mode
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

    // In competitive mode, if someone else has found it, disable the button
    const isDisabledInCompetitiveMode =
        questMode === 'competitive' && progressCount > 0 && !userHasFound

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
            disabled={questStatus !== 'active' || isDisabledInCompetitiveMode}
            onClick={handleClick}
        >
            {userHasFound ? 'Mark as unfound' : 'Found'}
        </Button>
    )
}
