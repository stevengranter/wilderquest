import { Button } from '@/components/ui/button'
import { Grid, List, Map } from 'lucide-react'

export default function ViewModeController({ viewMode, setViewMode }: {
    viewMode: string,
    setViewMode: (viewMode: string) => void
}) {
    return (<div className='flex items-center gap-1 rounded-md p-1'>
        <Button
            variant={viewMode === 'grid' ? 'default' : 'neutral'}
            size='sm'
            onClick={() => setViewMode('grid')}
        >
            <Grid className='h-4 w-4' />
        </Button>
        <Button
            variant={viewMode === 'list' ? 'default' : 'neutral'}
            size='sm'
            onClick={() => setViewMode('list')}
        >
            <List className='h-4 w-4' />
        </Button>
        <Button
            variant={viewMode === 'map' ? 'default' : 'neutral'}
            size='sm'
            onClick={() => setViewMode('map')}
        >
            <Map className='h-4 w-4' />
        </Button>
    </div>)
}

