import { Badge } from '@/components/ui/badge'
import { QuestStatus } from '../types'
import { Clock, Play, Pause, Square } from 'lucide-react'

interface QuestStatusBadgeProps {
    status: QuestStatus
    className?: string
}

export function QuestStatusBadge({ status, className }: QuestStatusBadgeProps) {
    const getStatusConfig = (status: QuestStatus) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pending',
                    icon: Clock,
                    className: 'bg-gray-50/70 text-gray-600 border-gray-200/50',
                }
            case 'active':
                return {
                    label: 'Active',
                    icon: Play,
                    className:
                        'bg-green-100 text-green-800 border-green-300 animate-pulse',
                }
            case 'paused':
                return {
                    label: 'Paused',
                    icon: Pause,
                    className:
                        'bg-yellow-50/70 text-yellow-600 border-yellow-200/50',
                }
            case 'ended':
                return {
                    label: 'Ended',
                    icon: Square,
                    className:
                        'bg-yellow-50/70 text-yellow-600 border-yellow-200/50',
                }
            default:
                return {
                    label: status,
                    icon: Clock,
                    className: 'bg-gray-50/70 text-gray-600 border-gray-200/50',
                }
        }
    }

    const config = getStatusConfig(status)
    const Icon = config.icon

    return (
        <Badge className={`${config.className} ${className}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </Badge>
    )
}
