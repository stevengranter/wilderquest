import { useImage } from '@/hooks/useImage'
import { cn } from '@/lib/utils'

interface ObservationPhoto {
    id: number
    url: string
    attribution: string
}

interface ProgressiveObservationImageProps {
    photo: ObservationPhoto
    className?: string
}

export function ProgressiveObservationImage({
    photo,
    className,
}: ProgressiveObservationImageProps) {
    const { src, isBlurred } = useImage({
        src: photo.url.replace('square', 'medium'),
        progressive: {
            lowQualitySrc: photo.url,
        },
    })

    return (
        <div className={cn('overflow-hidden', className)}>
            <img
                src={src}
                alt="Observation"
                className={cn(
                    'w-full h-full object-cover',
                    isBlurred &&
                        'filter blur-sm scale-110 transition-all duration-500'
                )}
            />
        </div>
    )
}
