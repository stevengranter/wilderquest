/**
 * Dynamic Leaflet loader utility
 * Loads Leaflet CSS and JS only when needed to improve initial page load performance
 */

let leafletLoaded = false
let leafletLoadingPromise: Promise<void> | null = null

export interface LeafletLoadOptions {
    cssUrl?: string
    jsUrl?: string
    cssIntegrity?: string
    jsIntegrity?: string
}

/**
 * Dynamically loads Leaflet CSS and JS
 * @param options - Optional URLs and integrity hashes for Leaflet resources
 * @returns Promise that resolves when Leaflet is loaded and ready to use
 */
export function loadLeaflet(options: LeafletLoadOptions = {}): Promise<void> {
    // If already loaded, return resolved promise
    if (leafletLoaded) {
        return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (leafletLoadingPromise) {
        return leafletLoadingPromise
    }

    // Default URLs and integrity hashes
    const {
        cssUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        jsUrl = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
        cssIntegrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
        jsIntegrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=',
    } = options

    leafletLoadingPromise = new Promise<void>((resolve, reject) => {
        const loadCSS = (): Promise<void> => {
            return new Promise((resolveCSS, rejectCSS) => {
                // Check if CSS is already loaded
                const existingLink = document.querySelector(
                    `link[href="${cssUrl}"]`
                )
                if (existingLink) {
                    resolveCSS()
                    return
                }

                // Create and load CSS
                const link = document.createElement('link')
                link.rel = 'stylesheet'
                link.href = cssUrl
                link.integrity = cssIntegrity
                link.crossOrigin = 'anonymous'

                link.onload = () => resolveCSS()
                link.onerror = () =>
                    rejectCSS(new Error('Failed to load Leaflet CSS'))

                document.head.appendChild(link)
            })
        }

        const loadJS = (): Promise<void> => {
            return new Promise((resolveJS, rejectJS) => {
                // Check if JS is already loaded
                if (typeof window !== 'undefined' && (window as any).L) {
                    resolveJS()
                    return
                }

                // Create and load JS
                const script = document.createElement('script')
                script.src = jsUrl
                script.integrity = jsIntegrity
                script.crossOrigin = 'anonymous'

                script.onload = () => resolveJS()
                script.onerror = () =>
                    rejectJS(new Error('Failed to load Leaflet JS'))

                document.body.appendChild(script)
            })
        }

        // Load CSS first, then JS
        loadCSS()
            .then(() => loadJS())
            .then(() => {
                leafletLoaded = true
                resolve()
            })
            .catch((error) => {
                leafletLoadingPromise = null // Reset on error to allow retry
                reject(error)
            })
    })

    return leafletLoadingPromise
}

/**
 * Checks if Leaflet is already loaded
 * @returns true if Leaflet is loaded and available
 */
export function isLeafletLoaded(): boolean {
    return leafletLoaded && typeof window !== 'undefined' && !!(window as any).L
}

/**
 * Resets the loader state (useful for testing or forced reload)
 */
export function resetLeafletLoader(): void {
    leafletLoaded = false
    leafletLoadingPromise = null
}
