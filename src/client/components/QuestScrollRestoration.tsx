import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router'

const QUEST_SCROLL_KEY = 'wildernest_quest_scroll_position'

export function QuestScrollRestoration() {
    const { pathname } = useLocation()
    const navigationType = useNavigationType()
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Save scroll position when leaving quests page
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (pathname === '/quests') {
                const scrollY = window.scrollY
                sessionStorage.setItem(QUEST_SCROLL_KEY, scrollY.toString())
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () =>
            window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [pathname])

    // Handle navigation
    useEffect(() => {
        // Only handle navigation when we're on the quests page
        if (pathname !== '/quests') return

        if (navigationType === 'POP') {
            // User clicked back button - restore scroll position
            const savedScrollY = sessionStorage.getItem(QUEST_SCROLL_KEY)
            if (savedScrollY) {
                const scrollY = parseInt(savedScrollY, 10)
                if (scrollY > 0) {
                    // Clear any existing timeout
                    if (scrollTimeoutRef.current) {
                        clearTimeout(scrollTimeoutRef.current)
                    }

                    // Use multiple attempts to ensure scroll restoration works
                    requestAnimationFrame(() => {
                        window.scrollTo({ top: scrollY, behavior: 'instant' })
                    })

                    scrollTimeoutRef.current = setTimeout(() => {
                        if (window.scrollY !== scrollY) {
                            window.scrollTo({
                                top: scrollY,
                                behavior: 'instant',
                            })
                        }
                    }, 50)

                    setTimeout(() => {
                        if (window.scrollY !== scrollY) {
                            window.scrollTo({
                                top: scrollY,
                                behavior: 'instant',
                            })
                        }
                    }, 150)
                }
            }
        } else if (navigationType === 'PUSH') {
            // User navigated forward - check if we have a saved position
            const savedScrollY = sessionStorage.getItem(QUEST_SCROLL_KEY)
            if (savedScrollY) {
                const scrollY = parseInt(savedScrollY, 10)
                if (scrollY > 0) {
                    requestAnimationFrame(() => {
                        window.scrollTo({ top: scrollY, behavior: 'instant' })
                    })
                }
            }
        }
    }, [pathname, navigationType])

    // Continuously save scroll position while on quests page
    useEffect(() => {
        if (pathname !== '/quests') return

        const handleScroll = () => {
            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current)
            }

            // Debounce scroll position saving
            scrollTimeoutRef.current = setTimeout(() => {
                const scrollY = window.scrollY
                sessionStorage.setItem(QUEST_SCROLL_KEY, scrollY.toString())
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

    return null
}
