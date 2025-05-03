import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import imageBlobReduce from 'image-blob-reduce'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function resizeImage(image: Blob, maxSize = 1000): Promise<Blob> {
    const reduce = imageBlobReduce()
    return await reduce.toBlob(image, { max: maxSize })
}

export async function blobToBase64(blob: Blob): Promise<string> {
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
