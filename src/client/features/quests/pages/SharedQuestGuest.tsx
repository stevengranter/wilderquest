import { useParams } from 'react-router'
import { useQuest } from '@/hooks/useQuest'
import { QuestView } from '@/features/quests/components/QuestView/QuestView'

export default function SharedQuestGuest() {
    const { token } = useParams();

    const {
        questData,
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress,
        isLoading,
        isError,
        updateStatus,
        share,
        leaderboard,
    } = useQuest({ token });
    console.log(taxa);

    return (
        <QuestView
            questData={questData}
            taxa={taxa}
            mappings={mappings}
            aggregatedProgress={aggregatedProgress}
            detailedProgress={detailedProgress}
            isLoading={isLoading}
            isError={isError}
            updateStatus={updateStatus}
            isOwner={false}
            token={token}
            share={share}
            leaderboard={leaderboard}
        />
    );
}
