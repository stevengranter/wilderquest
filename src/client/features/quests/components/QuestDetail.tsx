import { useParams } from 'react-router'
import { useQuest } from '@/hooks/useQuest'
import { QuestView } from './QuestView'
import { useAuth } from '@/hooks/useAuth'

interface QuestProps {
    questId?: string | number;
}

export default function QuestDetail({ questId: propQuestId }: QuestProps) {
    const routeParams = useParams();
    const urlQuestId = routeParams.questId;
    const activeQuestId = propQuestId || urlQuestId;
    const { user } = useAuth();

    const {
        questData,
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress,
        isLoading,
        isError,
        updateStatus,
    } = useQuest({ questId: activeQuestId });

    const isOwner = !!user && questData && Number(user.id) === Number(questData.user_id);

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
            isOwner={isOwner}
        />
    );
}
