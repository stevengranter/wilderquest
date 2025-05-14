import React, { useRef, useEffect, useState } from 'react'
import { Group, Box3, Vector3, MathUtils } from 'three'
import { Sheep } from '@/components/3d/characters/Sheep'
import { Axolotl } from '@/components/3d/characters/Axolotl'
import { Axolotl2 } from '@/components/3d/characters/Cute_axolotl'
import { Bee } from '@/components/3d/characters/Bee'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'

const characterComponents = {
    sheep: Sheep,
    axolotl: Axolotl,
    axolotl2: Axolotl2,
    bee: Bee,
} as const

type CharacterName = keyof typeof characterComponents

type HostCharacterProps = {
    character: CharacterName
}

const HostCharacterContext = React.createContext<HostCharacterProps>({
    character: 'sheep',
})

type HostCharacterProviderProps = {
    children?: React.ReactNode
    character: CharacterName
}

export function HostCharacterProvider({
    children,
    character,
}: HostCharacterProviderProps) {
    return (
        <HostCharacterContext.Provider value={{ character }}>
            <HostCharacter character={character} />
            {children}
        </HostCharacterContext.Provider>
    )
}

export default function HostCharacter({ character }: HostCharacterProps) {
    const modelRef = useRef<Group>(null)
    const charHomeRef = useRef<Group>(null)
    const [scale, setScale] = useState(1)
    const [initialRotation, setInitialRotation] = useState<{
        x: number
        y: number
        z: number
    }>({ x: 0, y: 0, z: 0 })
    const [lastPosition, setLastPosition] = useState<Vector3>(new Vector3())
    const [isActive, setIsActive] = useState(false)
    const [isReturningHome, setIsReturningHome] = useState(false)

    const { camera, size } = useThree()

    const state = useThree()

    useEffect(() => {
        if (!state) return
        console.log(state)
    }, [state])

    useFrame(({ pointer, clock }) => {
        if (!modelRef.current || !charHomeRef.current) return

        const homePos = charHomeRef.current.position
        const modelPos = modelRef.current.position
        const modelRot = modelRef.current.rotation

        const targetX = state.viewport.width / 2
        const targetY = -state.viewport.height / 2
        const targetZ = 0 // Adjust Z if you need it further/closer
        const lowerRight = new Vector3(targetX, targetY, targetZ)

        // Idle animation or return home logic
        if (!isActive) {
            if (isReturningHome) {
                // Return home logic
                const distanceToHome = lowerRight.distanceTo(homePos)
                const returnSpeed = 0.01

                if (distanceToHome < 0.1) {
                    // Close enough to home, snap to position and reset
                    setIsReturningHome(false)
                    modelPos.copy(lowerRight)

                    // Reset rotation to initial values
                    modelRot.x = MathUtils.lerp(
                        modelRot.x,
                        initialRotation.x,
                        0.1
                    )
                    modelRot.y = MathUtils.lerp(
                        modelRot.y,
                        initialRotation.y,
                        0.1
                    )
                    modelRot.z = MathUtils.lerp(
                        modelRot.z,
                        initialRotation.z,
                        0.1
                    )
                } else {
                    // Keep moving toward home
                    modelPos.lerp(lowerRight, returnSpeed)

                    // Apply gentle rotation wobble

                    const speed = 2

                    const wobbleAmount = 0.05
                    const wobble =
                        Math.sin(clock.getElapsedTime() * speed * 1.5) *
                        wobbleAmount

                    // Smoothly restore rotation
                    modelRot.x = MathUtils.lerp(
                        modelRot.x,
                        initialRotation.x,
                        0.1
                    )
                    modelRot.y = MathUtils.lerp(
                        modelRot.y,
                        initialRotation.y + wobble,
                        0.1
                    )
                    modelRot.z = MathUtils.lerp(
                        modelRot.z,
                        initialRotation.z,
                        0.1
                    )
                }
            } else {
                // Idle animation - gentle bobbing
                const amplitude = 0.05
                const speed = 2

                // Calculate bobbing motion
                const targetY =
                    homePos.y +
                    Math.sin(clock.getElapsedTime() * speed) * amplitude

                // Apply smooth easing
                modelPos.y = MathUtils.lerp(modelPos.y, targetY, 0.05)

                // Keep X and Z positions aligned with home
                modelPos.x = MathUtils.lerp(modelPos.x, homePos.x, 0.05)
                modelPos.z = MathUtils.lerp(modelPos.z, homePos.z, 0.05)

                // Apply gentle rotation wobble
                const wobbleAmount = 0.05
                const wobble =
                    Math.sin(clock.getElapsedTime() * speed * 1.5) *
                    wobbleAmount

                modelRot.y = MathUtils.lerp(
                    modelRot.y,
                    initialRotation.y + wobble,
                    0.05
                )
            }

            return
        }

        // Active - follow pointer logic
        // Convert NDC to world position
        const ndc = new Vector3(pointer.x, pointer.y, 0.5)
        ndc.unproject(camera)

        const dir = ndc.sub(camera.position).normalize()
        const distance = -camera.position.z / dir.z
        const worldPos = camera.position
            .clone()
            .add(dir.multiplyScalar(distance))

        // Smooth movement toward pointer
        modelPos.lerp(worldPos, 0.03)

        // Helper function to clamp an angle within a given range
        function clampAngle(angle, min, max) {
            // Normalize angle to be within -PI to PI (or 0 to 2PI if preferred)
            // This helps prevent issues when clamping across the -PI/PI boundary.
            // A common way to normalize to -PI to PI:
            angle = angle % (Math.PI * 2)
            if (angle <= -Math.PI) angle += Math.PI * 2
            if (angle > Math.PI) angle -= Math.PI * 2

            // Now clamp the normalized angle
            return Math.max(min, Math.min(max, angle))
        }

        // Calculate angle toward pointer
        const targetDir = worldPos.clone().sub(modelPos)
        const rawAngle = Math.atan2(targetDir.x, targetDir.z)

        // Add wobble for liveliness
        const wobbleSpeed = 5
        const wobbleAmount = 0.1
        const wobble =
            Math.sin(clock.getElapsedTime() * wobbleSpeed) * wobbleAmount

        // Calculate the target angle including wobble
        let targetAngle = rawAngle + wobble

        // --- Clamping Logic ---
        // Define the limits for the Y rotation (in radians)
        // These values determine how far left and right the character can look
        const maxYRotation = Math.PI * 0.1 // Example: Limit to +/- 90 degrees (PI/2)
        const minYRotation = -Math.PI * 0.1 // Example: Limit to +/- 90 degrees (PI/2)

        // Clamp the target angle
        targetAngle = clampAngle(targetAngle, minYRotation, maxYRotation)
        // Apply smooth rotation with wobble (using the clamped targetAngle)
        modelRot.y = MathUtils.lerp(modelRot.y, targetAngle, 0.1)

        // modelRot.z is usually roll and less critical for "facing the user".
        // If you need to clamp Z rotation as well, you would apply a similar clamp
        // before or after the lerp for modelRot.z.
        modelRot.z = MathUtils.lerp(modelRot.z, wobble * 0.5, 0.1)
        // --- End Clamping Logic ---
        // Store the current position for use when deactivating
        setLastPosition(modelPos.clone())
    })

    // Save initial rotation when component mounts
    useEffect(() => {
        if (!modelRef.current) return
        const euler = modelRef.current.rotation
        setInitialRotation({ x: euler.x, y: euler.y, z: euler.z })
    }, [])

    // Auto-scale character based on its size
    useEffect(() => {
        if (!modelRef.current) return

        const box = new Box3().setFromObject(modelRef.current)
        const size = new Vector3()
        box.getSize(size)

        const maxDimension = Math.max(size.x, size.y, size.z)
        const desiredSize = 2 // Target size

        const newScale = desiredSize / maxDimension

        // Auto-center model based on bounding box
        const center = new Vector3()
        const lowerRight = new Vector3(-1, -1, -3)
        box.getCenter(center)
        modelRef.current.position.sub(center)

        setScale(newScale)
    }, [character])

    // Toggle active state
    const handlePointerDown = () => {
        setIsActive(!isActive)
        if (isActive) {
            // If turning off active mode, start returning home
            setIsReturningHome(true)
        }
    }

    // Force return home
    const handleHomeClick = () => {
        setIsActive(false)
        setIsReturningHome(true)
    }

    const CharacterComponent = characterComponents[character]

    return (
        <>
            <CharacterComponent
                ref={modelRef}
                scale={[scale, scale, scale]}
                onPointerDown={handlePointerDown}
            />
            <LowerRightCharacter>
                <group ref={charHomeRef}>
                    <mesh>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial
                            color="orange"
                            transparent
                            opacity={0.7}
                        />
                    </mesh>
                </group>
            </LowerRightCharacter>
        </>
    )
}

function LowerRightCharacter({
    children,
    distance = 5,
}: {
    children: React.ReactNode
    distance?: number
}) {
    const { camera, size } = useThree()
    const [position, setPosition] = useState(() => new Vector3())

    useEffect(() => {
        // Calculate lower-right corner position in world space
        const ndcNear = new Vector3(0.8, -0.8, 0) // Slightly inset from corner
        ndcNear.unproject(camera)

        const ndcFar = new Vector3(0.8, -0.8, 1)
        ndcFar.unproject(camera)

        // Get direction from camera to corner
        const direction = ndcFar.clone().sub(ndcNear).normalize()

        // Calculate position at desired distance
        const targetPosition = camera.position
            .clone()
            .add(direction.multiplyScalar(distance))

        setPosition(targetPosition)
    }, [camera, size.width, size.height, distance])

    return <group position={position}>{children}</group>
}
