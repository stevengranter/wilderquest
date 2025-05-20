// SearchHistory Component
import { BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import React from 'react'
import { useNavigate } from 'react-router'
import _ from 'lodash'

export default function SearchHistory({
                                          searchHistory,
                                          setSearchHistory,
                                      }: {
    searchHistory: iNatTaxaResponse[]
    setSearchHistory: React.Dispatch<React.SetStateAction<iNatTaxaResponse[]>>
}) {
    const navigate = useNavigate()

    const handleBreadcrumbClick = (
        clickedItem: iNatTaxaResponse,
        index: number,
    ) => {
        if (index === searchHistory.length - 1) {
            return
        }

        const newHistory = searchHistory.slice(0, index + 1)
        setSearchHistory(newHistory)
        navigate(`/explore/${clickedItem.id}`)
    }

    return (
        searchHistory &&
        searchHistory.length > 0 && (
            <BreadcrumbList>
                {searchHistory.map((item, index) => (
                    <React.Fragment key={`${item.id}-${index}`}>
                        <BreadcrumbItem
                            onClick={() => handleBreadcrumbClick(item, index)}
                            style={{
                                cursor:
                                    index < searchHistory.length - 1
                                        ? 'pointer'
                                        : 'default',
                            }}
                        >
                            {_.startCase(
                                    _.camelCase(item.preferred_common_name),
                                ) ||
                                item.name ||
                                'Unknown Taxon'}
                        </BreadcrumbItem>
                        {index < searchHistory.length - 1 && (
                            <BreadcrumbSeparator />
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        )
    )
}
