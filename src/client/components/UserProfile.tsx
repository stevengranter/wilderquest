import {Collection, UserData} from '../../types/types'
import {useEffect, useState} from 'react'
import axios from 'axios'
import {useParams} from 'react-router'
import avatar from 'animal-avatar-generator'
import {ReactSVG} from 'react-svg'

export default function UserProfile() {
    const {id} = useParams()
    const [user, setUser] = useState<UserData | null>(null)
    const [collections, setCollections] = useState<Collection[]>([])

    useEffect(() => {
        if (!id) return
        try {
            axios.get(`/api/users/${id}`).then((res) => {
                setUser(res.data)
            })
        } catch (error) {
            console.log(error)
        }
        try {
            axios.get(`/api/users/${id}/collections`).then((res) => {
                setCollections(res.data)
            })
        } catch (error) {
            console.log(error)
        }
    }, [id])

    return (
        <>
            <div className="flex flex-row">
                <h1 className='text-2xl'>
                    {user ? user.username : 'User Not Found'}
                </h1>
                {user && (
                    <ReactSVG
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar(user.user_cuid, { size: 100 }))}`}
                    />
                )}
            </div>
            <div>
                {collections.length > 0 &&
                    `Has ${collections.length} collections:`}
                {collections.length > 0 && (
                    <ul>
                        {collections.map((collection) => (
                            <CollectionView collection={collection}/>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}

function CollectionView({collection}: { collection: Collection }) {
    const [iNatData, setNatData] = useState([])

    useEffect(() => {
        if (!collection.taxon_ids) return
        try {
            const taxa_ids = encodeURIComponent(collection.taxon_ids.toString())
            axios.get(`/api/iNatAPI/taxa/${taxa_ids}`).then((res) => {
                console.log(res.data)
            })
        } catch (error) {
            console.log(error)
        }
    }, [collection])

    return (
        <li key={collection.id}>
            {collection.name}
            {collection.taxon_ids && collection.taxon_ids.length > 0 && (
                <ul>
                    Collection has {collection.taxon_ids.length} taxons
                    {collection.taxon_ids.map((taxon_id) => (
                        <li key={taxon_id}>{taxon_id}</li>
                    ))}
                </ul>
            )}
        </li>
    )
}
