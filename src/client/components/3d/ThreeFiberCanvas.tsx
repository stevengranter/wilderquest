import {Canvas} from "@react-three/fiber";
import HostCharacter from "@/components/3d/HostCharacter";
import {OrbitControls} from "@react-three/drei";

export function ThreeFiberCanvas() {

    return (
        <div id='canvas-container' className='h-full w-full absolute'>
            <Canvas camera={{position: [0, 1.5, 5], fov: 50}}>
                {/* Lights */}
                <ambientLight intensity={2}/>
                <spotLight
                    position={[2, 2, 2]}
                    angle={0.3}
                    penumbra={1}
                    intensity={5}
                    castShadow
                />
                <directionalLight position={[-5, 10, 5]} intensity={2}/>

                <HostCharacter character='axolotl'/>

                <OrbitControls enablePan={false}/>
            </Canvas>


        </div>
    )

}
