import { useEffect, useState } from 'react'

export function useProgressiveImage(lowQualitySrc: string, highQualitySrc: string) {
    const [src, setSrc] = useState(lowQualitySrc)
    const [isBlurred, setIsBlurred] = useState(true)

    useEffect(() => {
        setSrc(lowQualitySrc)
        setIsBlurred(true)

        const img = new Image()
        img.src = highQualitySrc

        img.onload = () => {
            setSrc(highQualitySrc)
            setIsBlurred(false)
        }
    }, [lowQualitySrc, highQualitySrc])

    return { src, isBlurred }
}
