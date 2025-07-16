import { useEffect, useState } from 'react'
import api from '@/api/api'
import axios from 'axios'

export function QuestsPage() {
    return (
        <>
            <QuestsList />
       </>
    )
}

function QuestsList() {
    const [quests, setQuests] = useState([])
    useEffect(()=> {
        api.get('/collections').then((res) => {
            console.log(res.data)
            setQuests(res.data)
        })
    },[])

    return quests && (
        <>
        <h1>Quests</h1>
        <ul>
            {quests.map((quest) => (
                <li key={quest.id}>{quest.name}</li>
            ))}
        </ul>
        </>
    )

}