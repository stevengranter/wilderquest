// src/components/TokenTestComponent.tsx
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { testUtils } from '@/services/authApi'

export function TokenTestComponent() {
    const { accessToken, isAuthenticated } = useAuth()

    const testRefresh = async () => {
        console.log('Testing token refresh...')
        console.log('Current token:', accessToken)
        const wasRefreshed = await testUtils.simulateExpiredToken()
        console.log('Token was refreshed:', wasRefreshed)
    }

    // Add this to TokenTestComponent
    useEffect(() => {
        const interval = setInterval(() => {
            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')
            console.log('Token Status:', {
                accessToken: accessToken ? '✓' : '✗',
                refreshToken: refreshToken ? '✓' : '✗',
                time: new Date().toISOString(),
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    if (!isAuthenticated) {
        return <div>Please login first</div>
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <h2 className="text-lg font-bold">Token Test Panel</h2>
                <p>Access Token: {accessToken ? '✓ Present' : '✗ Missing'}</p>
            </div>
            <Button onClick={testRefresh}>Test Token Refresh</Button>
        </div>
    )
}
