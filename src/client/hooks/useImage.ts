import { useEffect, useRef, useState } from 'react'

interface UseImageOptions {
    src: string
    lazy?: boolean
    progressive?: {
        lowQualitySrc: string
    }
    intersectionOptions?: IntersectionObserverInit
}

interface UseImageResult {
    src: string
    isLoading: boolean
    isBlurred: boolean
    imgRef: React.RefObject<HTMLImageElement | null>
}

const DEFAULT_INTERSECTION_OPTIONS: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.1,
}

export function useImage({
    src,
    lazy = false,
    progressive,
    intersectionOptions = DEFAULT_INTERSECTION_OPTIONS,
}: UseImageOptions): UseImageResult {
    const [currentSrc, setCurrentSrc] = useState(
        progressive?.lowQualitySrc || src
    )
    const [isLoading, setIsLoading] = useState(true)
    const [isBlurred, setIsBlurred] = useState(!!progressive)
    const [isInView, setIsInView] = useState(!lazy)
    const imgRef = useRef<HTMLImageElement>(null)

    // Handle lazy loading with intersection observer
    useEffect(() => {
        if (!lazy || isInView) return

        const img = imgRef.current
        if (!img) return

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries
            if (entry.isIntersecting && !isInView) {
                setIsInView(true)
            }
        }, intersectionOptions)

        observer.observe(img)

        return () => {
            observer.unobserve(img)
        }
    }, [lazy, isInView, intersectionOptions])

    // Handle image loading
    useEffect(() => {
        if (!isInView) return

        setIsLoading(true)

        // If progressive loading is enabled
        if (progressive) {
            setCurrentSrc(progressive.lowQualitySrc)
            setIsBlurred(true)

            const highQualityImg = new Image()
            highQualityImg.src = src

            highQualityImg.onload = () => {
                setCurrentSrc(src)
                setIsBlurred(false)
                setIsLoading(false)
            }

            highQualityImg.onerror = () => {
                setIsBlurred(false)
                setIsLoading(false)
            }
        } else {
            // Simple loading without progressive enhancement
            const img = new Image()
            img.src = src

            img.onload = () => {
                setCurrentSrc(src)
                setIsLoading(false)
            }

            img.onerror = () => {
                setIsLoading(false)
            }
        }
    }, [src, isInView, progressive])

    return {
        src: currentSrc,
        isLoading,
        isBlurred,
        imgRef,
    }
}
