import { isSameDay, isSameYear } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

export function QuestTimestamps({
    startsAt,
    endsAt,
}: {
    startsAt?: Date
    endsAt?: Date
}) {
    if (!startsAt) return null

    const now = new Date()
    const start = new Date(startsAt)
    const end = endsAt ? new Date(endsAt) : null

    // Auto-detect user's timezone or set a default
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const isActive = start <= now && (!end || end >= now)
    const hasEnded = end && end < now
    const isUpcoming = start > now

    const getDisplayText = () => {
        if (isUpcoming) {
            const days = Math.ceil(
                (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            return `Starts in ${days} day${days !== 1 ? 's' : ''}`
        }
        if (hasEnded) return 'Ended'
        if (end) {
            const days = Math.ceil(
                (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
            return `${days} day${days !== 1 ? 's' : ''} left`
        }
        return 'Active'
    }

    const formatCompactDateTime = () => {
        const includeStartYear = !isSameYear(start, now)
        const includeEndYear = end && !isSameYear(end, now)

        if (!end) {
            // Just start time
            const dateFormat = includeStartYear
                ? 'MMM d, yyyy, h:mm a (zzz)'
                : 'MMM d, h:mm a (zzz)'
            return formatInTimeZone(start, timeZone, dateFormat)
        }

        const isSameDayResult = isSameDay(start, end)

        if (isSameDayResult) {
            // Same day
            const dateFormat = includeStartYear ? 'MMM d, yyyy' : 'MMM d'
            const dateStr = formatInTimeZone(start, timeZone, dateFormat)
            const startTime = formatInTimeZone(start, timeZone, 'h:mm a')
            const endTime = formatInTimeZone(end, timeZone, 'h:mm a')
            const timezone = formatInTimeZone(end, timeZone, '(zzz)')

            return `${dateStr}, ${startTime} - ${endTime} ${timezone}`
        } else {
            // Different days
            const startFormat = includeStartYear
                ? 'MMM d, yyyy, h:mm a'
                : 'MMM d, h:mm a'
            const endFormat = includeEndYear
                ? 'MMM d, yyyy, h:mm a'
                : 'MMM d, h:mm a'

            const startStr = formatInTimeZone(start, timeZone, startFormat)
            const endStr = formatInTimeZone(end, timeZone, endFormat)
            const timezone = formatInTimeZone(end, timeZone, '(zzz)')

            return `${startStr} - ${endStr} ${timezone}`
        }
    }

    return (
        <div className="flex items-center gap-3">
            {/* Compact Status Badge */}
            <div
                className={`
                    inline-flex items-center px-2 py-1 rounded text-xs font-medium
                    ${
                        isActive
                            ? 'bg-green-100 text-green-800'
                            : hasEnded
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-blue-100 text-blue-800'
                    }
                `}
            >
                {getDisplayText()}
            </div>

            {/* Compact Date/Time Display */}
            <div className="text-sm text-muted-foreground">
                {!end ? (
                    <span>Starts {formatCompactDateTime()}</span>
                ) : (
                    <span>{formatCompactDateTime()}</span>
                )}
            </div>
        </div>
    )
}
