import classes from './TabletopLayout.module.css'
// import SearchForm from '@/components/SearchForm'
import { Outlet } from 'react-router'


export default function TabletopLayout() {
    return (
        <div
            className={`${classes.tabletop} w-full h-full p-4 md:p-6 lg:p-8 `}
            role='region'
            aria-label='Tabletop surface'
        >
            <Outlet />

        </div>
    )
};
