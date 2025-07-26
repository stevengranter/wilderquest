import { jwtDecode } from 'jwt-decode'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { testUtils } from '@/services/authApi'

interface TokenInfo {
    timeRemaining: string
    isExpired: boolean
}

export function TokenTestComponent() {
    const { accessToken, isAuthenticated } = useAuth()
    const [tokenStatus, setTokenStatus] = useState<{
        access: TokenInfo | null
        refresh: TokenInfo | null
    }>({
        access: null,
        refresh: null,
    })

    const getTokenTimeRemaining = (token: string | null): TokenInfo | null => {
        if (!token) return null

        try {
            const decoded = jwtDecode<{ exp: number }>(token)
            const expirationTime = decoded.exp * 1000 // Convert to milliseconds
            const now = Date.now()
            const timeRemaining = expirationTime - now

            if (timeRemaining <= 0) {
                return { timeRemaining: 'Expired', isExpired: true }
            }

            // Format remaining time
            const minutes = Math.floor(timeRemaining / 60000)
            const seconds = Math.floor((timeRemaining % 60000) / 1000)
            return {
                timeRemaining: `${minutes}m ${seconds}s`,
                isExpired: false,
            }
        } catch {
            return { timeRemaining: 'Invalid', isExpired: true }
        }
    }

    const testRefresh = async () => {
        console.log('Testing token refresh...')
        console.log('Current token:', accessToken)
        const wasRefreshed = await testUtils.simulateExpiredToken()
        console.log('Token was refreshed:', wasRefreshed)
    }

    useEffect(() => {
        const interval = setInterval(() => {
            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')

            setTokenStatus({
                access: getTokenTimeRemaining(accessToken),
                refresh: getTokenTimeRemaining(refreshToken),
            })
        }, 1000) // Update every second

        return () => clearInterval(interval)
    }, [])

    if (!isAuthenticated) {
        return <div>Please login first</div>
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <h2 className="text-lg font-bold">Token Status Panel</h2>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">Access Token:</span>
                        <span
                            className={`${tokenStatus.access?.isExpired ? 'text-red-500' : 'text-green-500'}`}
                        >
                            {tokenStatus.access
                                ? `${tokenStatus.access.timeRemaining} remaining`
                                : 'Not present'}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="font-medium">Refresh Token:</span>
                        <span
                            className={`${tokenStatus.refresh?.isExpired ? 'text-red-500' : 'text-green-500'}`}
                        >
                            {tokenStatus.refresh
                                ? `${tokenStatus.refresh.timeRemaining} remaining`
                                : 'Not present'}
                        </span>
                    </div>
                </div>
            </div>
            <Button onClick={testRefresh}>Test Token Refresh</Button>
        </div>
    )
}
