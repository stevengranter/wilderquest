import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, {
    createContext,
    useEffect,
    useRef,
    useState,
    RefObject,
} from 'react'
import { Environment, OrthographicCamera } from '@react-three/drei'
import { frame, motion, useSpring, SpringValue } from 'motion/react'
import { Bee } from '@/components/3d/characters/Bee'
import AnimatedCharacter from '@/components/3d/AnimatedCharacter' // Assuming AnimatedCharacter accepts a rotation prop

const ThreeFiberCanvasContext = createContext<unknown | undefined>(undefined)

const spring = { damping: 30, stiffness: 50, restDelta: 0.001 }
const rotationSpring = { damping: 20, stiffness: 80 } // Slightly different spring for rotation
const xOffset = -40 // Pixels to offset to the right
const yOffset = -20 // Pixels to offset downwards

// This hook calculates the raw mouse target position and velocity
export function useMouseTargetAndVelocity(
    ref: RefObject<HTMLDivElement | null>,
) {
    const [mouseTarget, setMouseTarget] = useState({ x: 0, y: 0 })
    const [velocity, setVelocity] = useState({ x: 0, y: 0 })
    const lastPosition = useRef({ x: 0, y: 0 })
    const lastTimestamp = useRef(performance.now())

    useEffect(() => {
        if (!ref.current) return

        const handlePointerMove = ({ clientX, clientY }: MouseEvent) => {
            const currentTime = performance.now()
            const deltaTime = currentTime - lastTimestamp.current

            const element = ref.current!
            frame.read(() => {
                // Calculate mouse position relative to the container's top-left corner
                const currentTarget = {
                    x: clientX - element.offsetLeft, // Corrected calculation
                    y: clientY - element.offsetTop, // Corrected calculation
                }

                // Calculate velocity (pixels per millisecond)
                const currentVelocity = {
                    x: (currentTarget.x - lastPosition.current.x) / deltaTime,
                    y: (currentTarget.y - lastPosition.current.y) / deltaTime,
                }

                setMouseTarget(currentTarget)
                setVelocity(currentVelocity)

                lastPosition.current = currentTarget
                lastTimestamp.current = currentTime
            })
        }

        const handlePointerUp = () => {
            // When the pointer stops, set velocity to zero
            setVelocity({ x: 0, y: 0 })
        }

        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp) // Listen for mouse release

        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [ref]) // Depend on ref

    return { mouseTarget, velocity }
}

export function ThreeFiberCanvasProvider({
    children,
}: {
    children?: React.ReactNode
}) {
    const motionContainerRef = useRef<HTMLDivElement>(null)
    const [isActive, setIsActive] = useState(false)
    const [isHover, setIsHover] = useState(false)
    const [horizontalDirection, setHorizontalDirection] = useState('none') // 'left', 'right', 'none'

    // Get the raw mouse target position and velocity using the new hook
    const { mouseTarget, velocity } =
        useMouseTargetAndVelocity(motionContainerRef)

    // Use springs directly in this component for position
    const positionX = useSpring(0, spring)
    const positionY = useSpring(0, spring)

    // New spring for Y-axis rotation
    const rotationY = useSpring(0, rotationSpring) // Rotation in radians

    // State to store the position where the character was last active (stopped)
    const [lastStoppedPosition, setLastStoppedPosition] = useState<{
        x: number
        y: number
    }>({ x: 0, y: 0 })

    // Effect to update the position spring targets with offset
    useEffect(() => {
        if (isActive) {
            // If active, animate position springs towards the mouse target PLUS the desired offset
            positionX.set(mouseTarget.x + xOffset)
            positionY.set(mouseTarget.y + yOffset) // Apply yOffset here

            if (velocity.x > 0.1) {
                // Use a small threshold to avoid flickering on minor movements
                setHorizontalDirection('right')
            } else if (velocity.x < -0.1) {
                // Use a small threshold
                setHorizontalDirection('left')
            } else {
                setHorizontalDirection('none')
            }
        } else {
            // If inactive, animate position springs towards the last recorded stopped position
            positionX.set(lastStoppedPosition.x)
            positionY.set(lastStoppedPosition.y)
        }
    }, [
        isActive,
        mouseTarget,
        lastStoppedPosition,
        positionX,
        positionY,
        velocity.x,
    ]) // Added velocity.x as dependency

    // Effect to update the rotation spring target based on horizontal velocity
    useEffect(() => {
        if (isActive) {
            // Map velocity to rotation. Adjust the multiplier (e.g., 0.5)
            // and clamping range (e.g., -Math.PI / 4 to Math.PI / 4) as needed
            const targetRotation = Math.max(
                -Math.PI / 4,
                Math.min(Math.PI / 4, velocity.x * 0.05),
            ) // Example mapping
            rotationY.set(targetRotation)
        } else {
            // If inactive, spring the rotation back to zero
            rotationY.set(0)
        }
        // Depend on isActive and velocity.x
    }, [isActive, velocity.x, rotationY])

    const toggleActive = () => {
        // When becoming inactive, capture the *current* values of the position springs
        // Adjust the captured position to *not* include the offset so it returns to the location *relative* to where the mouse was when it stopped.
        if (isActive) {
            setLastStoppedPosition({
                x: positionX.get() - xOffset,
                y: positionY.get() - yOffset,
            })
        }
        // Toggle the active state
        setIsActive(!isActive)
    }

    const toggleHover = () => {
        // Toggle the active state
        setIsHover(!isHover)
    }

    return (
        <ThreeFiberCanvasContext value={'true'}>
            <motion.div
                ref={motionContainerRef}
                id='canvas-container'
                className='h-70 w-50 absolute bottom-0 right-0'              // Apply position and rotation springs to the style
                style={{ x: positionX, y: positionY }} // Use rotateY for CSS transform
            >
                <Canvas camera={{ position: [0, 2, 5.5], fov: 40 }}>
                    {/*<Environment preset="forest" />*/}

                    {/* Pass the rotationY spring down to the character component */}
                    <AnimatedCharacter
                        onClick={toggleActive}
                        isActive={isActive}
                        onMouseEnter={toggleHover}
                        isHover={isHover}
                        rotationY={rotationY}
                        horizontalDirection={horizontalDirection}
                    />
                    {children}
                </Canvas>
            </motion.div>
        </ThreeFiberCanvasContext>
    )
}

function CameraController() {
    const { camera } = useThree()
    useEffect(() => {
        camera.lookAt(0, 0, 0)
    }, [camera])
    return null
}

export function useThreeFiberContext() {
    return React.useContext(ThreeFiberCanvasContext)
}
