import { Button } from '@/components/ui/button'
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
                variant="neutral"
                className="flex-1"
                onClick={
                    props.status === 'active'
                        ? props.handlePaused
                        : props.handleActive
                }
                disabled={props.status === 'ended'}
            >
                {props.status === 'active' ? (
                    <>
                        <Pause /> Pause
                    </>
                ) : (
                    <>
                        <Play />{' '}
                        {props.status === 'pending' ? 'Start' : 'Resume'}
                    </>
                )}
            </Button>
            <Button
                variant="neutral"
                className="flex-1"
                onClick={props.handleEnded}
                disabled={props.status === 'ended'}
            >
                <StopCircle /> End
            </Button>
        </div>
    )
}
