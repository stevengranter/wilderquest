import axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router' // Corrected import for useParams from 'react-router-dom'

type Collection = {
    id: string;
    name: string;
    description: string;
    taxon_ids: number[];
    is_private: boolean;
    user_id: string;
    created_at: string;
    updated_at: string;
}

const API_URL = '/api/collections'

// Define the interface for the props the component accepts
interface CollectionProps {
    collectionId?: string | number; // Optional prop for direct usage
}

// Define the interface for route parameters
// interface CollectionRouteParams {
//     collectionId?: string; // Route params are always strings from the URL
// }

export default function CollectionDetail({ collectionId: propCollectionId }: CollectionProps) {
    // Get the collection ID from the URL parameters
    const routeParams = useParams()
    const urlCollectionId = routeParams.collectionId

    // Determine the active collection ID, prioritizing the prop over the URL parameter
    const activeCollectionId = propCollectionId || urlCollectionId

    // State for data, loading status, and error status
    const [collectionData, setCollectionData] = useState<Collection | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true) // Renamed to isLoading for clarity
    const [isError, setIsError] = useState<string | null>(null) // Renamed to isError for clarity

    useEffect(() => {
        if (!activeCollectionId) {
            setCollectionData(null)
            setIsLoading(false)
            setIsError(null)
            return
        }

        const fetchCollection = async () => {
            setIsLoading(true) // Start loading
            setIsError(null) // Clear any previous errors

            try {
                const response = await axios.get(`${API_URL}/${activeCollectionId.toString()}`)
                console.log(response.data)
                setCollectionData(response.data)
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setIsError(err.response?.data?.message || err.message || 'An unknown error occurred')
                } else {
                    setIsError('An unexpected error occurred.')
                }
                setCollectionData(null) // Clear data on error
            } finally {
                setIsLoading(false) // End loading, regardless of success or failure
            }
        }

        fetchCollection()

    }, [activeCollectionId])


    if (isLoading) {
        return <div>Loading collection...</div>
    }

    if (isError) {
        return <div style={{ color: 'red' }}>Error: {isError}</div>
    }


    if (!collectionData) {

        return (
            <div>
                <h1>No Collection Selected or Found</h1>
                <p>Please select a collection or navigate to a valid collection ID.</p>
                {/* Example of displaying links to specific collections */}
                <ul>
                    <li><a href='/collection/123'>Collection 123</a></li>
                    <li><a href='/collection/456'>Collection 456</a></li>
                </ul>
            </div>
        )
    }

    // Render the collection data
    return (
        <div>
            <h1>Collection Detail: {collectionData.name || `ID: ${collectionData.id}`}</h1>
            <p>{collectionData.description}</p>
            {/* You can add more details from collectionData here */}
            {propCollectionId && <p> (Rendered via **prop** with ID: {propCollectionId})</p>}
            {!propCollectionId && urlCollectionId &&
                <p> (Rendered via **URL parameter** with ID: {urlCollectionId})</p>}
            <p>
                <a href={`/collections/${collectionData.id}/edit`}>Edit Collection</a>
            </p>
            <h2>Taxa</h2>
            <ul>
                {collectionData.taxon_ids?.map((taxonId) => (
                    <li key={taxonId}>{taxonId}</li>
                ))}
            </ul>
        </div>
    )
}