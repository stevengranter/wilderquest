import LoginForm from '@/components/auth/LoginForm'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/core/auth/useAuth'
import { Button } from '@/components/ui/button'
import React from 'react'
import { useSearchParams } from 'react-router'

export default function Login() {
    const { isAuthenticated, logout, user } = useAuth()
    const [searchParams] = useSearchParams()
    const sessionExpired = searchParams.get('reason') === 'session_expired'

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        logout()
    }

    const logoutPrompt = (
        <div className="text-center space-y-4">
            {sessionExpired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <div className="text-sm text-yellow-800">
                        Your session has expired. Please log in again to
                        continue.
                    </div>
                </div>
            )}
            <div className="text-lg">
                {user
                    ? `Welcome back, ${user.username}!`
                    : 'You are currently logged in.'}
            </div>
            <div className="text-sm text-muted-foreground">
                If you're experiencing issues, try logging out and back in.
            </div>
            <Button onClick={handleClick} variant="neutral">
                Log out and sign in again
            </Button>
        </div>
    )

    return (
        <div className="flex flex-col items-center justify-center h-full p-10">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                wilderQuest
            </h1>
            <Card className="flex w-100 p-5">
                {isAuthenticated ? logoutPrompt : <LoginForm />}
            </Card>
        </div>
    )
}
