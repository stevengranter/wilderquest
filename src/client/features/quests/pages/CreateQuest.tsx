import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import SelectionDrawer from '@/features/collections/SelectionDrawer'
import { PlaceFinder } from '@/features/quests/components/PlaceFinder'
import { useAuth } from '@/hooks/useAuth'
import { ExploreTab } from '@/routes/explore/ExploreTab'

const formSchema = z.object({
    questName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
    placeName: z.string().min(2, {
        message: 'Quest name must be at least 2 characters.',
    }),
})

export function CreateQuest() {
    const { isAuthenticated } = useAuth()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questName: '',
            placeName: '',
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    if (!isAuthenticated) {
        return <p>Not authenticated.</p>
    }

    return (
        <div className="p-4">
            <h1>Create Quest</h1>
            <p>Create a new quest.</p>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
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
                        name="placeName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Place Name</FormLabel>
                                <FormControl>
                                    <PlaceFinder />
                                </FormControl>
                                <FormDescription>
                                    This is the iNaturalist place name
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Accordion
                        type="single"
                        collapsible
                        className="w-full max-w-xl"
                    >
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Add species</AccordionTrigger>
                            <AccordionContent>
                                <ExploreTab />
                                <SelectionDrawer />
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </div>
    )
}
