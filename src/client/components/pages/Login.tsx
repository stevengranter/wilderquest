import LoginForm from '../LoginForm.js'
import {Card} from '@/components/ui/card.js'
import {useAuth} from '@/hooks/useAuth.js'
import {Button} from '@/components/ui/button.js'
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
        <div className='flex content-center justify-center p-10'>
            <Card className='flex w-100 p-5'>
                {isAuthenticated ? logoutPrompt : <LoginForm/>}
            </Card>
        </div>
    )
}
