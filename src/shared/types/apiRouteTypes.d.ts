export const API_ROUTES: {
    readonly REGISTER: '/api/users/register'
    readonly LOGIN: '/api/users/login'
    readonly REFRESH_TOKEN: '/api/auth/refresh'
    readonly PRODUCTS: '/api/products'
    // ... other routes
}

export type ApiRoutes = typeof API_ROUTES
export type ApiRouteKeys = keyof ApiRoutes
