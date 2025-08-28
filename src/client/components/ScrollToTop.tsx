import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

const SCROLL_POSITION_KEY = 'wildernest_scroll_positions'

export function ScrollToTop() {
    const { pathname } = useLocation()
    const navigationType = useNavigationType()
    const prevPathnameRef = useRef<string>('')
    const isInitialLoadRef = useRef(true)
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Load scroll positions from sessionStorage
    const getScrollPositions = () => {
        try {
            const stored = sessionStorage.getItem(SCROLL_POSITION_KEY)
            return stored ? new Map(JSON.parse(stored)) : new Map()
        } catch {
            return new Map()
        }
    }

    // Save scroll positions to sessionStorage
    const saveScrollPositions = (positions: Map<string, number>) => {
        try {
            sessionStorage.setItem(
                SCROLL_POSITION_KEY,
                JSON.stringify([...positions])
            )
        } catch {
            // Ignore storage errors
        }
    }

    // Store scroll position periodically while on the page
    useEffect(() => {
        if (pathname !== '/quests') return

        const handleScroll = () => {
            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }

            // Debounce scroll position saving
            scrollTimeoutRef.current = setTimeout(() => {
                const scrollPositions = getScrollPositions()
                scrollPositions.set(pathname, window.scrollY)
                saveScrollPositions(scrollPositions)
            }, 100)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }
        }
    }, [pathname])

    useEffect(() => {
        const currentPathname = pathname
        const prevPathname = prevPathnameRef.current
        const scrollPositions = getScrollPositions()

        // Skip the first effect run (initial page load)
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false
            prevPathnameRef.current = currentPathname
            return
        }

        // Store scroll position when leaving a page
        if (prevPathname && prevPathname !== currentPathname) {
            const scrollY = window.scrollY
            if (prevPathname === '/quests') {
                scrollPositions.set(prevPathname, scrollY)
                saveScrollPositions(scrollPositions)
            }
        }

        // Handle navigation based on type
        if (navigationType === 'POP') {
            // Browser back/forward button - restore scroll position
            const savedScrollY = scrollPositions.get(currentPathname)
            if (savedScrollY !== undefined && savedScrollY > 0) {
                // Use requestAnimationFrame for better timing
                requestAnimationFrame(() => {
                    window.scrollTo({ top: savedScrollY, behavior: 'instant' })

                    // Additional attempts to ensure it works
                    setTimeout(() => {
                        if (window.scrollY !== savedScrollY) {
                            window.scrollTo({
                                top: savedScrollY,
                                behavior: 'instant',
                            })
                        }
                    }, 50)

                    setTimeout(() => {
                        if (window.scrollY !== savedScrollY) {
                            window.scrollTo({
                                top: savedScrollY,
                                behavior: 'instant',
                            })
                        }
                    }, 150)
                })
            }
        } else if (navigationType === 'PUSH') {
            // Forward navigation
            if (
                currentPathname.includes('/quests/') &&
                !currentPathname.endsWith('/quests')
            ) {
                // Navigating to quest detail - scroll to top
                window.scrollTo({ top: 0, behavior: 'instant' })
            } else {
                // Other forward navigation - try to restore previous scroll position
                const savedScrollY = scrollPositions.get(currentPathname)
                if (savedScrollY !== undefined && savedScrollY > 0) {
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: savedScrollY,
                            behavior: 'instant',
                        })
                    })
                } else {
                    window.scrollTo({ top: 0, behavior: 'instant' })
                }
            }
        } else {
            // REPLACE or other navigation types - scroll to top
            window.scrollTo({ top: 0, behavior: 'instant' })
        }

        // Update previous pathname
        prevPathnameRef.current = currentPathname
    }, [pathname, navigationType])

    return null
}
