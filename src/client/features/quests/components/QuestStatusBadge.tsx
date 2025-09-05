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
                    className: 'bg-gray-100 text-gray-800 border-gray-300',
                }
            case 'active':
                return {
                    label: 'Active',
                    icon: Play,
                    className: 'bg-green-100 text-green-800 border-green-300',
                }
            case 'paused':
                return {
                    label: 'Paused',
                    icon: Pause,
                    className:
                        'bg-yellow-100 text-yellow-800 border-yellow-300',
                }
            case 'ended':
                return {
                    label: 'Ended',
                    icon: Square,
                    className: 'bg-blue-100 text-blue-800 border-blue-300',
                }
            default:
                return {
                    label: status,
                    icon: Clock,
                    className: 'bg-gray-100 text-gray-800 border-gray-300',
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
