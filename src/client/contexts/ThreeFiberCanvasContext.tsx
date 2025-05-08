import { Canvas, useThree } from '@react-three/fiber'
import React, { createContext, useEffect } from 'react'
import { OrthographicCamera } from '@react-three/drei'

const ThreeFiberCanvasContext = createContext<unknown | undefined>(undefined)

export function ThreeFiberCanvasProvider({
    children,
}: {
    children?: React.ReactNode
}) {
    return (
        <ThreeFiberCanvasContext value={'true'}>
            <div id="canvas-container" className="h-full w-full absolute">
                <Canvas camera={{ position: [0, 1.5, 5], fov: 30 }}>
                    <CameraController />
                    <ambientLight intensity={2} />
                    <spotLight
                        position={[2, 2, 2]}
                        angle={0.3}
                        penumbra={1}
                        intensity={5}
                    />
                    <directionalLight position={[-5, 10, 5]} intensity={2} />
                    {/*<OrbitControls enablePan={false} />)*/}
                    {children}
                </Canvas>
            </div>
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
