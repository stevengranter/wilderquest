import React, {useState, useRef} from 'react'
import {Camera as ReactCamera, CameraType} from 'react-camera-pro'

export default function Camera() {
    const camera = useRef<CameraType | null>(null)
    const [image, setImage] = useState<string | null>(null)

    return (
        <div className='flex flex-col'>
            <h1 className='text-4xl'>Camera</h1>

            <ReactCamera
                ref={camera}
                facingMode='environment'
                aspectRatio={16 / 9}
                errorMessages={{
                    noCameraAccessible:
                        'No camera device accessible. Please connect your camera or try a different browser.',
                    permissionDenied:
                        'Permission denied. Please refresh and give camera permission.',
                    switchCamera:
                        'It is not possible to switch camera to different one because there is only one video device accessible.',
                    canvas: 'Canvas is not supported.',
                }}
            />
            <button
                onClick={() => {
                    if (camera.current) {
                        const imageData = camera.current.takePhoto() as string
                        setImage(imageData)
                    }
                }}
                className='text-2xl'
            >
                Take photo
            </button>
            {image && <img src={image} alt='Taken photo'/>}
        </div>
    )
}
