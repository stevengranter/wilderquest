import { useEffect, useRef, useState } from 'react'

interface UseLazyImageOptions {
    lowQualitySrc: string
    highQualitySrc: string
    rootMargin?: string
    threshold?: number
}

export function useLazyImage({
    lowQualitySrc,
    highQualitySrc,
    rootMargin = '50px',
    threshold = 0.1,
}: UseLazyImageOptions) {
    const [src, setSrc] = useState(lowQualitySrc)
    const [isBlurred, setIsBlurred] = useState(true)
    const [isInView, setIsInView] = useState(false)
    const imgRef = useRef<HTMLImageElement>(null)

    useEffect(() => {
        setSrc(lowQualitySrc)
        setIsBlurred(true)
        setIsInView(false)
    }, [lowQualitySrc])

    useEffect(() => {
        const img = imgRef.current
        if (!img) return

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry.isIntersecting && !isInView) {
                    setIsInView(true)
                }
            },
            {
                rootMargin,
                threshold,
            }
        )

        observer.observe(img)

        return () => {
            observer.unobserve(img)
        }
    }, [rootMargin, threshold, isInView])

    useEffect(() => {
        if (!isInView) return

        const img = new Image()
        img.src = highQualitySrc

        img.onload = () => {
            setSrc(highQualitySrc)
            setIsBlurred(false)
        }

        // Handle load errors by keeping the low quality image
        img.onerror = () => {
            setIsBlurred(false)
        }
    }, [highQualitySrc, isInView])

    return { src, isBlurred, imgRef }
}
