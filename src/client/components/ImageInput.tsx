import { ChangeEvent, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { blobToBase64, resizeImage } from '@/lib/utils'
import api from '@/api/api'

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
    handleSearch,
}: {
    resize?: boolean
    maxSize?: number
    handleSearch?: (query: string) => void
}) {
    const [file, setFile] = useState<{
        url: string
        base64: string
        originalWidth?: number
        originalHeight?: number
    } | null>(null)
    const [subject, setSubject] = useState<DetectedSubject[]>([])
    const imageRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        if (!file) return
        console.log('Sending file as JSON...')

        api
            .post('/ai/identify', {
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

    useEffect(() => {
        if (subject.length > 0 && handleSearch) {
            console.log({ subject })
            handleSearch(subject[0].scientific_name)
        }
    }, [subject])

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
                </div>
            </form>
        </div>
    )
}
