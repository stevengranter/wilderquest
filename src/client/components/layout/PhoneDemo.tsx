import { cn } from '@/lib/utils'
import iphone_16_plus_teal_portrait from '/iphone_16_plus_teal_portrait.png'
import React from 'react'

export default function PhoneDemo({
    children,
    className,
}: {
    children?: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                'relative flex items-center justify-center w-64',
                className
            )}
        >
            {/* Phone bezel */}
            <img
                src={iphone_16_plus_teal_portrait}
                alt="iPhone 16"
                className="w-full h-auto"
            />

            {/* Screen overlay */}
            <div
                className="
          absolute
          top-[3%]
          left-[6%]
          w-[88%]
          h-[94%]

          rounded-[2rem]
          overflow-hidden
          flex items-center justify-center
        "
            >
                {children ? (
                    children
                ) : (
                    <div className="flex  bg-teal-200/50 items-center justify-center w-full h-full text-black font-medium">
                        {'{children}'}
                    </div>
                )}
            </div>
        </div>
    )
}
