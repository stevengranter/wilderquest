import { zodResolver } from '@hookform/resolvers/zod'
import { createNameId } from 'mnemonic-id'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button.js'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form.js'
import { Input } from '@/components/ui/input.js'
import { handleError } from '@/helpers/errorHandler'
import { useAuth } from '@/hooks/useAuth.js'
import { LoginRequestSchema } from '../../shared/schemas/Auth'

const LoginForm = React.forwardRef(() => {
    const navigate = useNavigate()
    const { login } = useAuth()

    const form = useForm<z.infer<typeof LoginRequestSchema>>({
        resolver: zodResolver(LoginRequestSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof LoginRequestSchema>) {
        const response = await login(values)

        if (response?.success) {
            // Use optional chaining here as well if 'response' can be undefined
            toast.success('Logged in successfully!')
            navigate('/welcome')
        } else {
            // If response is undefined, we'll hit the default message anyway
            const errorMessage =
                response?.message ?? 'Login failed. Please try again.'

            // Display on form
            form.setError('root.serverError', {
                type: 'server',
                message: errorMessage,
            })
        }
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
                <Button type="submit">Submit</Button>
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
