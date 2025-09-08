import debug from 'debug'

// Check if we're in development mode
const isDevelopment =
    typeof window !== 'undefined' && (globalThis as any).__IS_DEVELOPMENT__

// Enable debug logging only in development
if (isDevelopment) {
    // Configure debug library to use console.log in browser
    debug.log = console.log.bind(console)

    // Enable all client debug namespaces
    debug.enable('*')

    ;(debug as any).colors = [
        '#FF4444', // Red - auth
        '#00FF88', // Green - quests
        '#0088FF', // Blue - events
        '#FF8800', // Orange - ui
        '#FF00FF', // Magenta - data
        '#00e1ff', // Teal - general
    ]

    console.log('🔧 Debug logging enabled (development mode)')
}

const createClientDebug = (namespace: string) => {
    const debugInstance = debug(namespace)
    return (message: string, ...args: any[]) => {
        debugInstance(message, ...args)
    }
}

export const clientDebug = {
    auth: createClientDebug('auth'),
    quests: createClientDebug('quests'),
    events: createClientDebug('events'),
    ui: createClientDebug('ui'),
    data: createClientDebug('data'),
    general: createClientDebug('general'),
}

// Test debug message to verify it's working
clientDebug.general('🔧 Debug utility initialized')
