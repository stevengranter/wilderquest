import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
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
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth.js'
import { RegisterFormSchema } from '@/components/RegisterForm.schema.js'
import { createNameId } from 'mnemonic-id'

type Inputs = {
    email: string
    username: string
    password: string
    confirmPassword: string
}

const RegisterForm = React.forwardRef(() => {
    const { register } = useAuth()

    const form = useForm<z.infer<typeof RegisterFormSchema>>({
        resolver: zodResolver(RegisterFormSchema),
        defaultValues: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        const result = await register(data)
        console.log(result)
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
