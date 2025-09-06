import { Button } from '@/components/ui'
import { Pause, Play, StopCircle } from 'lucide-react'
import { QuestStatus as QuestStatusType } from '@/features/quests/types'

export function QuestControls(props: {
    handleActive: () => void
    status: QuestStatusType
    handlePaused: () => void
    handleEnded: () => void
}) {
    return (
        <div className="flex items-center gap-2 w-full">
            <Button
                className="flex-1"
                onClick={props.handleActive}
                disabled={props.status === 'active'}
            >
                <Play /> {props.status === 'pending' ? 'Start' : 'Resume'}
            </Button>
            <Button
                className="flex-1"
                onClick={props.handlePaused}
                disabled={
                    props.status === 'paused' || props.status === 'pending'
                }
            >
                <Pause /> Pause
            </Button>
            <Button
                className="flex-1"
                onClick={props.handleEnded}
                disabled={props.status === 'ended'}
            >
                <StopCircle /> End
            </Button>
        </div>
    )
}
