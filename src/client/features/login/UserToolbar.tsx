import React, { useState } from 'react'
import LoginForm from '@/components/LoginForm'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export default function UserToolbar() {
    // State to control the Dialog's open/closed status
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Function to call when login is successful
    const handleLoginSuccess = () => {
        setIsDialogOpen(false) // Close the sheet
        // You might also want to do other things here, like redirecting
        // or updating user context.
        console.log('Login successful! Dialog is closing.')
    }

    return (
        <div className='flex flex-row h-15 justify-end px-5'>
            {/* Control the Dialog's open state using the 'open' prop */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    {/* When this button is clicked, it will set isDialogOpen to true */}
                    <Button onClick={() => setIsDialogOpen(true)}>Login</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Login</DialogTitle>
                    </DialogHeader>
                    <div className='grid flex-1 auto-rows-min gap-6 px-4'>
                        {/* Pass the handleLoginSuccess function to LoginForm */}
                        <LoginForm onLoginSuccess={handleLoginSuccess} />
                    </div>

                    {/*<DialogFooter>*/}
                    {/*    /!* The "Save changes" button here is likely not directly tied to LoginForm's submit.*/}
                    {/*        If LoginForm handles its own submission, this button might be redundant or*/}
                    {/*        needs to trigger LoginForm's submit. For now, it's just a button. *!/*/}
                    {/*    <Button type="submit">Save changes</Button>*/}
                    {/*    <DialogClose asChild>*/}
                    {/*        <Button variant="neutral">Close</Button>*/}
                    {/*    </DialogClose>*/}
                    {/*</DialogFooter>*/}
                </DialogContent>
            </Dialog>
        </div>
    )
}
