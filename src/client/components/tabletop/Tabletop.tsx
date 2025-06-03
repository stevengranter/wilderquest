import classes from './tabletop.module.css'
import SearchForm from '@/components/SearchForm'


export default function Tabletop() {
    return (
        <div
            className={`${classes.tabletop} w-full h-full p-4 `}
            role='region'
            aria-label='Tabletop surface'
        >
            <SearchForm />

        </div>
    )
};
