import { ChangeEvent, useEffect, useState, useRef } from 'react'
import imageBlobReduce from 'image-blob-reduce'
import axios from 'axios'

async function resizeImage(image: Blob, maxSize = 1000): Promise<Blob> {
    const reduce = imageBlobReduce()
    return await reduce.toBlob(image, { max: maxSize })
}

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
                resolve(reader.result)
            } else {
                reject('Failed to read file')
            }
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

interface DetectedObject {
    box2d: [number, number, number, number]
    colors: string[]
    description: string
    name: string
    text: string
}

interface DetectedSubject {
    scientific_name: string
    common_name: string
    description: string
    box2d: [number, number, number, number]
    colors: string[]
    confidence: number
}

export default function ImageInput({
    resize = true,
    maxSize = 1000,
}: {
    resize?: boolean
    maxSize?: number
}) {
    const [file, setFile] = useState<{
        url: string
        base64: string
        originalWidth?: number
        originalHeight?: number
    } | null>(null)
    const [objects, setObjects] = useState<DetectedObject[]>([])
    const [subject, setSubject] = useState<DetectedSubject[]>([])
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (!file) return
        console.log('Sending file as JSON...')

        axios
            .post('/api/ai/identify', {
                image: file.base64,
            })
            .then((result) => {
                console.log('Response:', result)
                // setObjects(result.data.objects) // <<< this expects { objects: [...] }
                setSubject(result.data.subject)
            })
            .catch((err) => console.error(err))

        return () => {
            URL.revokeObjectURL(file.url)
        }
    }, [file])

    async function handleChange(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return
        const originalFile = e.target.files[0]

        const originalImage = new Image()
        originalImage.onload = async () => {
            let processedBlob = originalFile as Blob

            if (resize) {
                processedBlob = await resizeImage(originalFile, maxSize)
            }

            const previewUrl = URL.createObjectURL(processedBlob)
            const base64 = await blobToBase64(processedBlob)

            setFile({
                url: previewUrl,
                base64,
                originalWidth: originalImage.width,
                originalHeight: originalImage.height,
            })
            console.log('File state:', {
                url: previewUrl,
                base64,
                originalWidth: originalImage.width,
                originalHeight: originalImage.height,
            })
        }
        originalImage.src = URL.createObjectURL(originalFile)
    }

    return (
        <div className="App">
            <form>
                <h2>Add Image:</h2>
                <input type="file" accept="image/*" onChange={handleChange} />

                <div style={{ position: 'relative', display: 'inline-block' }}>
                    {file && (
                        <img
                            ref={imageRef}
                            src={file.url}
                            alt="uploaded preview"
                            style={{ display: 'block', maxWidth: '100%' }}
                        />
                    )}
                    {subject.length > 0 &&
                        subject.map((subject) => (
                            <li>
                                <div>{subject.common_name}</div>
                                <div>{subject.scientific_name}</div>
                                <div>Confidence: {subject.confidence}</div>
                            </li>
                        ))}

                    {/*/!* Draw boxes *!/*/}
                    {/*{file &&*/}
                    {/*    objects.map((obj, index) => {*/}
                    {/*        const [x1, y1, x2, y2] = obj.box2d*/}
                    {/*        const originalWidth = file.originalWidth || 1*/}
                    {/*        const originalHeight = file.originalHeight || 1*/}
                    {/*        const displayedWidth = imageRef.current?.offsetWidth*/}
                    {/*        const displayedHeight =*/}
                    {/*            imageRef.current?.offsetHeight*/}

                    {/*        console.log(*/}
                    {/*            'Displayed dimensions:',*/}
                    {/*            displayedWidth,*/}
                    {/*            displayedHeight*/}
                    {/*        )*/}

                    {/*        if (!displayedWidth || !displayedHeight) {*/}
                    {/*            return null // Or some other fallback*/}
                    {/*        }*/}

                    {/*        const scaleX = displayedWidth / originalWidth*/}
                    {/*        const scaleY = displayedHeight / originalHeight*/}

                    {/*        const scaledX = x1 * scaleX*/}
                    {/*        const scaledY = y1 * scaleY*/}
                    {/*        const scaledWidth = (x2 - x1) * scaleX*/}
                    {/*        const scaledHeight = (y2 - y1) * scaleY*/}

                    {/*        return (*/}
                    {/*            <div*/}
                    {/*                key={index}*/}
                    {/*                style={{*/}
                    {/*                    position: 'absolute',*/}
                    {/*                    left: scaledX,*/}
                    {/*                    top: scaledY,*/}
                    {/*                    width: scaledWidth,*/}
                    {/*                    height: scaledHeight,*/}
                    {/*                    border: '2px solid red',*/}
                    {/*                    color: 'red',*/}
                    {/*                    fontSize: `${12 * Math.min(scaleX, scaleY)}px`, // Adjust font size too*/}
                    {/*                    backgroundColor: 'rgba(255, 0, 0, 0.2)',*/}
                    {/*                    pointerEvents: 'none',*/}
                    {/*                }}*/}
                    {/*            >*/}
                    {/*                {obj.name}*/}
                    {/*            </div>*/}
                    {/*        )*/}
                    {/*    })}*/}
                </div>
            </form>
        </div>
    )
}
