import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bird, FolderHeart, MapPinned } from 'lucide-react'

// Define the type for searchKind. Using a Union Type is good here.
export type SearchCategory = 'species' | 'observations' | 'collections';

// Define the props for SearchCategorySelect
type SearchCategoryToggleProps = {
    searchCategory: SearchCategory; // Assuming these are your search types
    setSearchCategory: (category: SearchCategory) => void; // <--- FIX IS HERE
};

export default function SearchCategorySelect({
                                                 searchCategory,
                                                 setSearchCategory,
                                             }: SearchCategoryToggleProps) {
    return (
        <ToggleGroup
            type='single'
            value={searchCategory} // Bind value to searchType prop
            onValueChange={(value) => {
                // Only update if value is not null or undefined
                if (value) {
                    setSearchCategory(value as SearchCategory) // Cast to SearchCategory if necessary, though TypeScript should infer it
                }
            }}
            className=' mt-4 text-center '
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
            {/*<ToggleGroupItem*/}
            {/*    className='justify-center'*/}
            {/*    value='collections'*/}
            {/*    icon={<FolderHeart size={16} />}*/}
            {/*>*/}
            {/*    Collections*/}
            {/*</ToggleGroupItem>*/}
        </ToggleGroup>
    )
}
