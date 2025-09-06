import { useProgressiveImage } from '@/hooks/useProgressiveImage'
import { cn } from '@/shared/lib/utils'

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
    const { src, isBlurred } = useProgressiveImage(
        photo.url,
        photo.url.replace('square', 'medium')
    )

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
