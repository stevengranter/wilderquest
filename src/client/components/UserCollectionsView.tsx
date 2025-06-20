import {useEffect, useState} from 'react'
import axios from 'axios'
import {Collection} from '../../types/types.js'

export default function UserCollectionsView({userId}: { userId: number }) {
    const [collections, setCollections] = useState<Collection[]>([])

    useEffect(() => {
        if (!userId) {
            return
        }
        api.get(`/users/${userId}/collections`).then((response) => {
            setCollections(response.data)
        })
    }, [])

    return (
        <div>
            {collections.length > 0 && (
                <ul>
                    {collections.map((collection) => (
                        <li key={collection.id}>{collection.name}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}
