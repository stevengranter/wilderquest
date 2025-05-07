import React, { useRef, useEffect, useState } from 'react'
import { Group, Box3, Vector3 } from 'three'
import { Sheep } from '@/components/3d/Sheep'
import { Axolotl } from '@/components/3d/Axolotl'
import { Axolotl2 } from '@/components/3d/Cute_axolotl'

const characterComponents = {
    sheep: Sheep,
    axolotl: Axolotl,
    axolotl2: Axolotl2,
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
    const hostCharacter = useRef<Group>(null)
    const modelRef = useRef<Group>(null)
    const [scale, setScale] = useState(1)

    // useFrame(({clock}) => {
    //     if (!hostCharacter.current) return
    //     hostCharacter.current.rotation.y = clock.elapsedTime
    // })

    const CharacterComponent = characterComponents[character]

    useEffect(() => {
        if (!modelRef.current) return

        const box = new Box3().setFromObject(modelRef.current)
        const size = new Vector3()
        box.getSize(size)

        const maxDimension = Math.max(size.x, size.y, size.z)
        const desiredSize = 2 // Target size you want the character to fit inside

        const newScale = desiredSize / maxDimension

        // Auto-center it too
        const center = new Vector3()
        box.getCenter(center)
        modelRef.current.position.sub(center)

        // Save the scale
        setScale(newScale)
    }, [character])

    return (
        <group ref={hostCharacter}>
            <group ref={modelRef} scale={[scale, scale, scale]}>
                <CharacterComponent />
            </group>
        </group>
    )
}
