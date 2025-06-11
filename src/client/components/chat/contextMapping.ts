// contextMapping.js
export const AppContexts = {
    HOME_PAGE: 'HOME_PAGE_CONTEXT',
    SEARCH: 'SEARCH_CONTEXT',
    GENERIC_PAGE: 'GENERIC_PAGE_CONTEXT', // Fallback
}

export const urlToContextMap = [
    { pattern: /^\/$/, context: AppContexts.HOME_PAGE }, // Matches "/"
    { pattern: /^\/search$/, context: AppContexts.SEARCH }, // Matches "/search"
]

// Helper function to get context
export function getContextFromPathname(pathname: string) {
    for (const entry of urlToContextMap) {
        if (entry.pattern.test(pathname)) {
            return entry.context
        }
    }
    return AppContexts.GENERIC_PAGE // Default context if no match
}
