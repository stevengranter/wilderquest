'use client'

import { cn } from '@/lib/utils'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import * as React from 'react'

const ToggleGroup = React.forwardRef<
    React.ElementRef<typeof ToggleGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
    <ToggleGroupPrimitive.Root
        ref={ref}
        className={cn('flex flex-row', className)}
        {...props}
    />
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

interface ToggleGroupItemProps
    extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> {
    icon?: React.ReactNode
}

const ToggleGroupItem = React.forwardRef<
    React.ElementRef<typeof ToggleGroupPrimitive.Item>,
    ToggleGroupItemProps
>(({ className, children, icon, ...props }, ref) => (
    <ToggleGroupPrimitive.Item
        ref={ref}
        className={cn(
            'flex w-full items-center text-main-foreground bg-white border-2 border-border px-3 py-1 text-left font-bold transition-all hover:bg-main focus:outline-none data-[state=on]:bg-main',
            'first:rounded-l-base last:rounded-r-base data-[state=off]:text-teal-800',
            '-ml-[2px] first:ml-0',
            className
        )}
        {...props}
    >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children && <span className="text-xs font-bold">{children}</span>}
    </ToggleGroupPrimitive.Item>
))
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
