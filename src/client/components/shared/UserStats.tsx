import { Skeleton } from '@/components/ui'
import { Trophy, Target, Leaf } from 'lucide-react'

interface UserStatsProps {
    stats: {
        totalQuestsParticipated: number
        activeQuests: number
        taxaFound: number
    } | null
    isLoading: boolean
}

export function UserStats({ stats, isLoading }: UserStatsProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-14" />
            </div>
        )
    }

    if (!stats) {
        return null
    }

    const statItems = [
        {
            label: 'Quests',
            value: stats.totalQuestsParticipated,
            icon: Trophy,
            color: 'text-yellow-600',
        },
        {
            label: 'Active',
            value: stats.activeQuests,
            icon: Target,
            color: 'text-blue-600',
        },
        {
            label: 'Species',
            value: stats.taxaFound,
            icon: Leaf,
            color: 'text-green-600',
        },
    ]

    return (
        <div className="flex items-center gap-6 text-sm">
            {statItems.map((item) => {
                const Icon = item.icon
                return (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                        <span className="font-medium">{item.value}</span>
                        <span className="text-muted-foreground">
                            {item.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
