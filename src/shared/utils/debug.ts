import debug from 'debug'

// Check if debug is enabled
const isDebugEnabled =
    typeof window !== 'undefined' && (globalThis as any).__DEBUG_ENABLED__

// Enable debug logging in browser if DEBUG environment variable is set
if (typeof window !== 'undefined' && isDebugEnabled) {
    localStorage.debug = isDebugEnabled

    // Configure debug library colors
    ;(debug as any).colors = [
        '#FF4444', // Red - auth
        '#00FF88', // Green - quests
        '#0088FF', // Blue - events
        '#FF8800', // Orange - ui
        '#FF00FF', // Magenta - data
        '#FFFF00', // Yellow - general
    ]

    console.log('🔧 Debug logging enabled:', isDebugEnabled)
}

// Create server debug instances
export const serverDebug = {
    auth: debug('app:server:auth'),
    db: debug('app:server:db'),
    cache: debug('app:server:cache'),
    api: debug('app:server:api'),
    events: debug('app:server:events'),
}

// Enable debug logging in server if DEBUG environment variable is set
if (typeof window === 'undefined') {
    const debugEnv = process.env.DEBUG
    console.log('🔍 Debug environment check - DEBUG:', debugEnv)
    if (debugEnv) {
        // Enable debug for server environment
        debug.enable(debugEnv)
        console.log('🔧 Server debug logging enabled:', debugEnv)

        // Test debug call to verify it's working
        setTimeout(() => {
            serverDebug.api(
                '🧪 Test debug message - if you see this, debug is working!'
            )
        }, 100)
    } else {
        console.log('🔍 No DEBUG environment variable set')
    }
}

// Create client debug function
const createClientDebug = (namespace: string) => {
    const debugInstance = debug(namespace)
    return (message: string, ...args: any[]) => {
        debugInstance(message, ...args)
    }
}

export const clientDebug = {
    auth: createClientDebug('app:client:auth'),
    quests: createClientDebug('app:client:quests'),
    events: createClientDebug('app:client:events'),
    ui: createClientDebug('app:client:ui'),
    data: createClientDebug('app:client:data'),
    general: createClientDebug('app:client:general'),
}

// Test debug message to verify it's working
clientDebug.general('🔧 Debug utility initialized')
