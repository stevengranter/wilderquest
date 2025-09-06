import { zodResolver } from '@hookform/resolvers/zod'
import { createNameId } from 'mnemonic-id'
import React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import {
    Button,
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
} from '@/components/ui'
import { useAuth } from '@/features/auth/useAuth'
import { LoginRequestSchema } from '@shared/schemas/Auth'

const LoginForm = React.forwardRef(() => {
    const navigate = useNavigate()
    const { isAuthenticated, login } = useAuth()

    const form = useForm<z.infer<typeof LoginRequestSchema>>({
        resolver: zodResolver(LoginRequestSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof LoginRequestSchema>) {
        console.log('🚀 Login attempt started with values:', values)

        try {
            console.log('📡 About to call login function...')
            console.log('📡 Login function type:', typeof login)

            const response = await login(values)

            console.log('📥 Login response received successfully!')
            console.log('📥 Response type:', typeof response)
            console.log('📥 Response value:', response)
            console.log('📥 Response has user?', !!response?.user)
            console.log('📥 Response user:', response?.user)

            // Check if we have a successful response with user data
            if (response?.success && response?.user) {
                console.log('✅ Login successful, user:', response.user)
                toast.success('Logged in successfully!')
                navigate(`/users/${response.user.username}`)
            } else if (response === undefined) {
                // This might indicate a network error or parsing issue
                console.error(
                    '❌ Login response is undefined - check network/parsing'
                )
                form.setError('root.serverError', {
                    type: 'server',
                    message:
                        'Login failed - no response received. Check your network connection.',
                })
            } else {
                // Response exists but doesn't have user data
                console.error('❌ Login response missing user data:', response)
                form.setError('root.serverError', {
                    type: 'server',
                    message:
                        response?.message ||
                        'Authentication failed - invalid credentials',
                })
            }
        } catch (error) {
            console.error('❌❌❌ LOGIN ERROR CAUGHT ❌❌❌')
            console.error('Error object:', error)
            console.error('Error type:', typeof error)
            console.error('Error constructor:', error?.constructor?.name)

            // Log more details about the error
            if (error instanceof Error) {
                console.error('Error name:', error.name)
                console.error('Error message:', error.message)
                console.error('Error stack:', error.stack)
            } else {
                console.error('Error is not an Error instance:', error)
            }

            // More specific error handling
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            console.error('Error message string:', errorMessage)

            if (errorMessage.includes('fetch')) {
                console.log('🔍 Detected fetch error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: 'Network error - please check your connection',
                })
            } else if (errorMessage.includes('HTTP error')) {
                console.log('🔍 Detected HTTP error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: `Server error: ${errorMessage}`,
                })
            } else if (errorMessage.includes('JSON')) {
                console.log('🔍 Detected JSON parsing error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: 'Server response format error - invalid JSON',
                })
            } else {
                console.log('🔍 Unknown error type, using generic message')
                form.setError('root.serverError', {
                    type: 'server',
                    message: `An unexpected error occurred: ${errorMessage}`,
                })
            }
        }
    }

    if (isAuthenticated) {
        return 'Already logged in! Would you like to log out?'
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 font-bold"
            >
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>

                            <FormControl>
                                <div>
                                    <Input
                                        placeholder={createNameId({
                                            capitalize: true,
                                            delimiter: '',
                                        })}
                                        {...field}
                                    />
                                </div>
                            </FormControl>

                            <FormDescription>
                                Please enter your username
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <div>
                                <FormControl>
                                    <div>
                                        <Input
                                            type="password"
                                            placeholder=""
                                            {...field}
                                        />
                                    </div>
                                </FormControl>
                            </div>
                            <FormDescription>
                                Please enter a password
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                {form.formState.errors.root?.serverError?.message && (
                    <p className="text-destructive text-sm mt-2">
                        {form.formState.errors.root.serverError.message}
                    </p>
                )}
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Logging in...' : 'Submit'}
                </Button>
                <div>
                    Not registered?&nbsp;
                    <Link to="/register">Register here</Link>
                </div>
            </form>
        </Form>
    )
})

LoginForm.displayName = 'LoginForm'
export default LoginForm
