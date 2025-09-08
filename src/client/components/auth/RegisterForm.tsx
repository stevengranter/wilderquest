import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'
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
import React, { useMemo } from 'react'
import { useAuth } from '@/features/auth/useAuth'
import { createNameId } from 'mnemonic-id'
import { clientDebug } from '../../lib/debug'

export const RegisterFormInputSchema = z
    .object({
        email: z.string().email(),
        username: z.string().min(2).max(30),
        password: z.string().min(8, {
            message: 'Password must be at least 8 characters.',
        }),
        confirmPassword: z.string().min(8, {
            message: 'Password must be at least 8 characters.',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    })

type RegisterFormInput = z.infer<typeof RegisterFormInputSchema>

const RegisterForm = React.forwardRef(() => {
    const { register } = useAuth()

    const form = useForm<z.infer<typeof RegisterFormInputSchema>>({
        resolver: zodResolver(RegisterFormInputSchema),
        defaultValues: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit: SubmitHandler<RegisterFormInput> = async (data) => {
        const result = await register(data)
        clientDebug.auth('Registration result:', result)
    }

    const animalNameId = useMemo(() => {
        return createNameId({ capitalize: true, delimiter: '' })
    }, [])

    const fakeEmailAddress = useMemo(() => {
        return animalNameId.toLowerCase() + '@example.com'
    }, [animalNameId])

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 w-80 p-4"
            >
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder={fakeEmailAddress}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Enter your email address.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder={animalNameId} {...field} />
                            </FormControl>
                            <FormDescription>
                                Enter your desired username
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
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder=""
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Choose a password.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>

                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder=""
                                    {...field}
                                />
                            </FormControl>

                            <FormDescription>
                                Must match previous field.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit">Submit</Button>
            </form>
        </Form>
    )
})
RegisterForm.displayName = 'RegisterForm'
export default RegisterForm
