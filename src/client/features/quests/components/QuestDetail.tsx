import { useLoaderData, useParams } from 'react-router'
import { useQuest } from '@/hooks/useQuest'
import { QuestView } from './QuestView'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

interface QuestProps {
    questId?: string | number
}

export default function QuestDetail({ questId: propQuestId }: QuestProps) {
    const routeParams = useParams()
    const urlQuestId = routeParams.questId
    const activeQuestId = propQuestId || urlQuestId
    const { user } = useAuth()
    const initialData = useLoaderData()

    useEffect(() => {
        console.log("initialData: ")
        console.log(initialData)
    },[initialData])

    const {
        questData,
        taxa,
        mappings,
        aggregatedProgress,
        detailedProgress,
        isLoading,
        isTaxaLoading,
        isTaxaFetchingNextPage,
        taxaHasNextPage,
        fetchNextTaxaPage,
        leaderboard,
        isError,
        updateStatus,
    } = useQuest({ questId: activeQuestId, initialData })

    useEffect(() => {
        console.log("Quest Data:")
        console.log(questData)
    }, [])

    const isOwner =
        !!user && questData && Number(user.id) === Number(questData.user_id)

    if (!activeQuestId) {
        return <div>Quest not found</div>
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (isError) {
        return <div>Error loading quest</div>
    }

    return (
        <QuestView
            questData={questData}
            taxa={taxa}
            mappings={mappings}
            aggregatedProgress={aggregatedProgress}
            detailedProgress={detailedProgress}
            isLoading={isLoading}
            isTaxaLoading={isTaxaLoading}
            isTaxaFetchingNextPage={isTaxaFetchingNextPage}
            taxaHasNextPage={taxaHasNextPage}
            fetchNextTaxaPage={fetchNextTaxaPage}
            isError={isError}
            updateStatus={updateStatus}
            isOwner={isOwner}
            leaderboard={leaderboard}
        />
    )
}
