import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import api from '@/api/api'

export default function UserQuestsPage() {
    const { userId } = useParams()

    const { isPending, error, data } = useQuery({
        queryKey: ['userQuestData'],
        queryFn: () =>
            api.get(`/quests/user/${userId}`).then((res) => res.data),
    })

    if (isPending) return 'Loading...'

    if (error) return 'An error has occurred: ' + error.message

    return (
        <h2>
            User quests page{' '}
            {data && data.map((quest: Quest) => <li>Quest {quest.name}</li>)}
        </h2>
    )
}
