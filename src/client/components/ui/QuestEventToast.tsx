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
        <div className="flex items-center p-4 bg-background border rounded-md shadow-md">
            {speciesImage && (
                <img
                    src={speciesImage}
                    alt={speciesName}
                    className="w-12 h-12 rounded-md object-cover mr-4"
                />
            )}
            <div className="text-center">
                <p className="font-semibold text-foreground">{guestName}</p>
                <p className="text-muted-foreground">
                    {actionText}{' '}
                    <span className="font-medium text-foreground">
                        {speciesName}
                    </span>
                </p>
            </div>
        </div>
    )
}

export default QuestEventToast
