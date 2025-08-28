import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuestMode } from '../types'

const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    locationName: z.string().min(2, {
        message: 'Location name must be at least 2 characters.',
    }),
    latitude: z.number(), // Remove .optional() if required
    longitude: z.number(), // Remove .optional() if required
    mode: z.enum(['competitive', 'cooperative']),
})

export default function QuestForm() {
    const [step, _setStep] = useState(1)
    // const {
    //     register,
    //     handleSubmit,
    //     control,
    //     formState: { errors },
    // } = useForm<FormValues>({
    //     defaultValues: { questName: '' },
    // })
    const form = useForm<z.infer<typeof formSchema>>({
        defaultValues: {
            questName: '',
            mode: 'competitive' as QuestMode,
        },
    })
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h1>Step 1</h1>
                        <FormField
                            control={form.control}
                            name="questName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quest Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="My Awesome Quest"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is the display name for your quest.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quest Mode</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select quest mode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="cooperative">
                                                Cooperative - Multiple
                                                participants can find the same
                                                species
                                            </SelectItem>
                                            <SelectItem value="competitive">
                                                Competitive - First to find a
                                                species claims it
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Choose how participants can find species
                                        in this quest.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )
            case 2:
                return <div>Step 2</div>
            case 3:
                return <div>Step 3</div>
            default:
                throw new Error(`Unknown step ${step}`)
        }
    }

    return (
        <FormProvider {...form}>
            <form>{renderStep()}</form>
        </FormProvider>
    )
}
