import { useGLTF } from '@react-three/drei'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { Group } from 'three'

interface AxolotlProps {
    modelPath?: string
}

export const Axolotl = forwardRef<Group, AxolotlProps>(
    ({ modelPath = '/cute_axolotl.glb', ...props }, ref) => {
        const { nodes, materials } = useGLTF(modelPath)
        const localRef = useRef<Group>(null)

        // Expose localRef to parent via forwarded ref
        useImperativeHandle(ref, () => localRef.current!)

        return (
            <group
                ref={localRef}
                {...props}
                dispose={null}
                rotation={[0, -Math.PI / 2, 0]}
            >
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_4 as THREE.Mesh).geometry}
                    material={materials.skin}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_6 as THREE.Mesh).geometry}
                    material={materials.skin}
                    position={[0, -1.614, 0]}
                    scale={0.72}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_8 as THREE.Mesh).geometry}
                    material={materials.skin}
                    position={[0.429, -0.969, 0.605]}
                    rotation={[-0.232, -0.011, -0.007]}
                    scale={0.173}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_10 as THREE.Mesh).geometry}
                    material={materials.skin}
                    position={[0.441, -1.647, 0.608]}
                    rotation={[0.211, 0.011, 0.004]}
                    scale={0.173}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_12 as THREE.Mesh).geometry}
                    material={materials.head_things}
                    position={[0.296, -0.201, 1.142]}
                    rotation={[-2.338, -0.131, 0.087]}
                    scale={[-0.273, 0.273, 0.273]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_14 as THREE.Mesh).geometry}
                    material={materials.face_elements}
                    position={[0.778, 0.14, 0.556]}
                    rotation={[0.075, -0.293, 0.111]}
                    scale={[0.091, 0.151, 0.151]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_16 as THREE.Mesh).geometry}
                    material={materials.head_things}
                    position={[0.323, 0.936, -0.571]}
                    rotation={[-0.158, 0.467, 1.022]}
                    scale={[0.07, 0.115, 0.115]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={(nodes.Object_18 as THREE.Mesh).geometry}
                    material={materials.face_elements}
                    position={[0.886, 0.05, 0]}
                    rotation={[Math.PI / 2, 0, 0.027]}
                    scale={[1, 0.879, 1]}
                />
            </group>
        )
    },
)

useGLTF.preload('/cute_axolotl.glb')
