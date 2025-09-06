import React from 'react'

type QuestEventToastProps = {
    guestName: string
    speciesName: string
    action: 'found' | 'unmarked'
    speciesImage?: string
}

const QuestEventToast: React.FC<QuestEventToastProps> = ({
    guestName,
    speciesName,
    action,
    speciesImage,
}) => {
    const actionText = action === 'found' ? 'found' : 'unmarked'

    return (
        <div className="flex justify-center items-center w-screen p-4 -translate-x-6 -translate-y-6 bg-secondary-background border-0 rounded-md">
            {speciesImage && (
                <img
                    src={speciesImage}
                    alt={speciesName}
                    className="w-12 h-12 rounded-md object-cover mr-4"
                />
            )}
            <div className="text-2xl text-center">
                <p className="font-semibold text-foreground">{guestName}</p>
                <p className="text-muted-foreground">
                    {actionText}{' '}
                    <span className="font-medium text-foreground">{speciesName}</span>
                </p>
            </div>
        </div>


    )
}

export default QuestEventToast
