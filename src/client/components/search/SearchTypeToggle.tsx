import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bird, FolderHeart, MapPinned } from 'lucide-react'

// Define the props for SearchTypeToggle
type SearchTypeToggleProps = {
    searchType: 'species' | 'observations' | 'collections'; // Assuming these are your search types
    setSearchType: React.Dispatch<
        React.SetStateAction<'species' | 'observations' | 'collections'>
    >;
};

export default function SearchTypeToggle({
                                             searchType,
                                             setSearchType,
                                         }: SearchTypeToggleProps) {
    return (
        <ToggleGroup
            type='single'
            value={searchType} // Bind value to searchType prop
            onValueChange={(value) => {
                // Only update if value is not null or undefined
                if (value) {
                    setSearchType(value as 'species' | 'observations' | 'collections')
                }
            }}
            className='w-full mt-4 text-center '
        >
            <ToggleGroupItem
                className='justify-center'
                value='species'
                icon={<Bird size={16} />}
            >
                Species
            </ToggleGroupItem>
            <ToggleGroupItem
                className='justify-center'
                value='observations'
                icon={<MapPinned size={16} />}
            >
                Observations
            </ToggleGroupItem>
            <ToggleGroupItem
                className='justify-center'
                value='collections'
                icon={<FolderHeart size={16} />}
            >
                Collections
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
