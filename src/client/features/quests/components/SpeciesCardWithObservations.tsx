import { INatTaxon } from '@shared/types/iNatTypes'
import { ReactNode } from 'react'
import { SpeciesCard } from '@/features/quests/components/SpeciesCard'
import { Quest as ServerQuest } from '../../../../server/models/quests'
import { ObservationDialog } from './ObservationDialog'

export type ClientQuest = Omit<ServerQuest, 'user_id'> & {
    user_id: string
}

interface SpeciesCardWithObservationsProps {
    species: INatTaxon
    questData?: ClientQuest
    locationData?: {
        location_name?: string
        latitude?: number
        longitude?: number
    }
    children?: ReactNode
    found?: boolean
    actionArea?: ReactNode
    avatarOverlay?: {
        displayName?: string
        displayNames?: string[]
        firstFinder?: string
    } | null
}

export function SpeciesCardWithObservations(
    props: SpeciesCardWithObservationsProps
) {
    const {
        species,
        questData,
        locationData,
        children,
        found,
        actionArea,
        avatarOverlay,
    } = props
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

    if (!displayData?.latitude || !displayData?.longitude) {
        return card
    }

    return (
        <ObservationDialog
            species={species}
            latitude={displayData.latitude}
            longitude={displayData.longitude}
            locationName={displayData.location_name}
            found={found}
        >
            {card}
        </ObservationDialog>
    )
}
