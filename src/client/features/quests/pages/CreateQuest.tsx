import { useAuth } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { ExploreTab } from '@/routes/explore/ExploreTab'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import SelectionDrawer from '@/features/collections/SelectionDrawer'

export function CreateQuest() {
    const {isAuthenticated} = useAuth();
    const formSchema = z.object({
        questname: z.string().min(2, {
            message: 'Quest name must be at least 2 characters.',
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            questname: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
    }


    if (!isAuthenticated) {
        return <p>Not authenticated.</p>;
    }

    return (
        <div className="p-4">
            <h1>Create Quest</h1>
            <p>Create a new quest.</p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="questname"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quest Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="My Awesome Quest" {...field} />
                                </FormControl>
                                <FormDescription>This is the display name for your quest.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Accordion type="single" collapsible className="w-full max-w-xl">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Location</AccordionTrigger>
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