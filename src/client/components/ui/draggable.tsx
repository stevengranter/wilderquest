import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'

type DraggableProps = {
    children: React.ReactNode;
    className?: string;
}


export default function Draggable({ children, className }: DraggableProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: 'unique-id',
    })
    const style = {
        transform: CSS.Translate.toString(transform),
    }


    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={className}>
            {children}
        </div>
    )
}
