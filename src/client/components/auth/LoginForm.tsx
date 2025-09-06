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
import { clientDebug } from '@shared/utils/debug'

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
        clientDebug.auth('🚀 Login attempt started with values:', values)

        try {
            clientDebug.auth('📡 About to call login function...')
            clientDebug.auth('📡 Login function type:', typeof login)

            const response = await login(values)

            clientDebug.auth('📥 Login response received successfully!')
            clientDebug.auth('📥 Response type:', typeof response)
            clientDebug.auth('📥 Response value:', response)
            clientDebug.auth('📥 Response has user?', !!response?.user)
            clientDebug.auth('📥 Response user:', response?.user)

            // Check if we have a successful response with user data
            if (response?.success && response?.user) {
                clientDebug.auth('✅ Login successful, user:', response.user)
                toast.success('Logged in successfully!')
                navigate(`/users/${response.user.username}`)
            } else if (response === undefined) {
                // This might indicate a network error or parsing issue
                clientDebug.auth(
                    '❌ Login response is undefined - check network/parsing'
                )
                form.setError('root.serverError', {
                    type: 'server',
                    message:
                        'Login failed - no response received. Check your network connection.',
                })
            } else {
                // Response exists but doesn't have user data
                clientDebug.auth(
                    '❌ Login response missing user data:',
                    response
                )
                form.setError('root.serverError', {
                    type: 'server',
                    message:
                        response?.message ||
                        'Authentication failed - invalid credentials',
                })
            }
        } catch (error) {
            clientDebug.auth('❌❌❌ LOGIN ERROR CAUGHT ❌❌❌')
            clientDebug.auth('Error object:', error)
            clientDebug.auth('Error type:', typeof error)
            clientDebug.auth('Error constructor:', error?.constructor?.name)

            // Log more details about the error
            if (error instanceof Error) {
                clientDebug.auth('Error name:', error.name)
                clientDebug.auth('Error message:', error.message)
                clientDebug.auth('Error stack:', error.stack)
            } else {
                clientDebug.auth('Error is not an Error instance:', error)
            }

            // More specific error handling
            const errorMessage =
                error instanceof Error ? error.message : String(error)
            clientDebug.auth('Error message string:', errorMessage)

            if (errorMessage.includes('fetch')) {
                clientDebug.auth('🔍 Detected fetch error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: 'Network error - please check your connection',
                })
            } else if (errorMessage.includes('HTTP error')) {
                clientDebug.auth('🔍 Detected HTTP error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: `Server error: ${errorMessage}`,
                })
            } else if (errorMessage.includes('JSON')) {
                clientDebug.auth('🔍 Detected JSON parsing error')
                form.setError('root.serverError', {
                    type: 'server',
                    message: 'Server response format error - invalid JSON',
                })
            } else {
                clientDebug.auth('🔍 Unknown error type, using generic message')
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
