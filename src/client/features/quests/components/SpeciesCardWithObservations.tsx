import { INatTaxon } from '@shared/types/iNatTypes'
import { ReactNode } from 'react'
import { SpeciesCard } from '@/components/cards/SpeciesCard'
import { Quest as ServerQuest } from '../../../../server/repositories/QuestRepository'
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
}

export function SpeciesCardWithObservations(
    props: SpeciesCardWithObservationsProps
) {
    const { species, questData, locationData, children, found, actionArea } =
        props
    const displayData = questData || locationData

    if (!displayData?.latitude || !displayData?.longitude) {
        return (
            children || (
                <SpeciesCard
                    species={species}
                    className="h-full"
                    found={found}
                    actionArea={actionArea}
                />
            )
        )
    }

    return (
        <ObservationDialog
            species={species}
            latitude={displayData.latitude}
            longitude={displayData.longitude}
            locationName={displayData.location_name}
            found={found}
        >
            {children || (
                <SpeciesCard
                    species={species}
                    className="h-full"
                    found={found}
                    actionArea={actionArea}
                />
            )}
        </ObservationDialog>
    )
}
