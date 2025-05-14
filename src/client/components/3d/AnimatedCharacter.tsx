import { Bee } from '@/components/3d/characters/Bee'
import { MotionValue } from 'motion'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Group } from 'three'
import {
    playHoverAnimation,
    playIdleAnimation,
    playWalkAnimation,
} from '@/components/3d/Animations'

interface AnimatedCharacterProps {
    onClick?: () => void
    isActive?: boolean
    rotationY: MotionValue<number>
    horizontalDirection: 'left' | 'right' | 'none'
}

export default function AnimatedCharacter({
                                              onClick,
                                              rotationY,
                                              isActive,
                                          }: AnimatedCharacterProps) {
    const modelRef = useRef<Group>(null)
    const [isHovered, setIsHovered] = useState(false)

    useFrame(({ clock }) => {
        const ref = modelRef.current
        if (!ref) return

        if (isHovered && !isActive) {
            playHoverAnimation(clock, ref)
        } else if (isActive) {
            playWalkAnimation(clock, ref)
        } else {
            playIdleAnimation(clock, ref)
        }
    })

    return (
        <group
            ref={modelRef}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            onClick={onClick}
        >
            <Bee rotationY={rotationY} />
        </group>
    )
}
