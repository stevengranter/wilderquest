import { useDroppable } from '@dnd-kit/core'
import clsx from 'clsx' // Optional: for cleaner class merging

type DroppableProps = {
    children: React.ReactNode
    className?: string
    onOverClassName?: string
    uniqueId: string
}

export default function Droppable({
    children,
    className,
    onOverClassName,
    uniqueId,
}: DroppableProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: uniqueId,
    })

    return (
        <div
            ref={setNodeRef}
            className={clsx(className, {
                [onOverClassName || '']: isOver,
            })}
        >
            {children}
        </div>
    )
}
