import { ReactNode } from 'react'
import { SpeciesCard } from '@/components/SpeciesCard'
import { Quest as ServerQuest } from '../types/questTypes'
import { INatTaxon } from '@shared/types/iNaturalist'
import { ObservationDialog } from './ObservationDialog'
import { clientDebug } from '../lib/debug'
import { useQuestContext } from './QuestContext'

export type ClientQuest = Omit<ServerQuest, 'user_id'> & {
    user_id: string
}

interface SpeciesCardWithObservationsProps {
    species: INatTaxon
    locationData?: {
        location_name?: string
        latitude?: number
        longitude?: number
    }
    children?: ReactNode
    found?: boolean
    actionArea?: ReactNode
    avatarOverlay?: {
        // For competitive mode (single user)
        username?: string
        isRegistered?: boolean
        // For cooperative mode (multiple users)
        users?: Array<{
            username: string
            isRegistered?: boolean
        }>
        firstFinder?: string
    } | null
}

export function SpeciesCardWithObservations(
    props: SpeciesCardWithObservationsProps
) {
    const {
        species,
        locationData,
        children,
        found,
        actionArea,
        avatarOverlay,
    } = props

    // Use QuestContext for quest data
    const questContext = useQuestContext()
    const { questData } = questContext

    const displayData = questData || locationData

    const card = children || (
        <SpeciesCard
            species={species}
            className="h-full"
            found={found}
            actionArea={actionArea}
            avatarOverlay={avatarOverlay}
        />
    )

    clientDebug.quests(
        `SpeciesCardWithObservations: Rendering for species ${species.id} (${species.name})`,
        {
            hasLocation: !!(displayData?.latitude && displayData?.longitude),
            locationName: displayData?.location_name,
            found,
        }
    )

    return (
        <>
            <ObservationDialog species={species} found={found}>
                {card}
            </ObservationDialog>
        </>
    )
}
