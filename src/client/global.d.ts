declare module '*.svg' {
    const content: string
    export default content
}

declare module '*.module.css' {
    export const text: string
    export const styles: Record<string, string>
}

declare global {
    interface Window {
        L: typeof import('leaflet')
    }
}
