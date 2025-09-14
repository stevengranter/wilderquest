import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MouseEvent } from 'react'

interface FoundButtonProps {
    disabled?: boolean
    variant?: 'default' | 'neutral'
    size?: 'sm' | 'default'
    className?: string
    fullWidth?: boolean
    children: string
    onClick?: (e: MouseEvent) => void | Promise<void>
}

export function FoundButton({
    disabled = false,
    variant = 'default',
    size = 'sm',
    className,
    fullWidth = false,
    children,
    onClick,
}: FoundButtonProps) {
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
            variant={variant}
            disabled={disabled}
            onClick={handleClick}
        >
            {children}
        </Button>
    )
}
