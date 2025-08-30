import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router'
import { Input } from '@/components/ui/input'
import { INatTaxon } from '@/shared/types/iNatTypes'

function _TaxaSearch() {
    const { register } = useForm()
    return <Input {...register('TaxaSearch')} />
}

export function TaxaList({ taxa }: { taxa: INatTaxon[] }) {
    const searchParams = useSearchParams()

    useEffect(() => {
        console.log('Search params: ', searchParams)
    }, [searchParams])

    return (
        <ul className="list-disc pl-5">
            {taxa.map((taxon, index) => (
                <li key={index} className="text-sm text-gray-700">
                    {taxon.id}: {taxon.name}
                </li>
            ))}
        </ul>
    )
}
