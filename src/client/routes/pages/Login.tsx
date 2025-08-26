import LoginForm from '../../components/LoginForm'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import React from 'react'

export default function Login() {
    const {isAuthenticated, logout} = useAuth()

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        logout()
    }

    const logoutPrompt = (
        <div>
            Already logged in, log out?
            <Button onClick={handleClick}>Log out</Button>
        </div>
    )

    return (
        <div className='flex flex-col items-center justify-center h-full p-10'>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                wilderQuest
            </h1>
            <Card className='flex w-100 p-5'>
                {isAuthenticated ? logoutPrompt : <LoginForm/>}
            </Card>
        </div>
    )
}