import React, { useState } from 'react'
import LoginForm from '@/components/LoginForm'
import { Button } from '@/components/ui/button'
// Removed unused imports: Input, Label
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

export default function UserToolbar() {
    // State to control the Sheet's open/closed status
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Function to call when login is successful
    const handleLoginSuccess = () => {
        setIsSheetOpen(false) // Close the sheet
        // You might also want to do other things here, like redirecting
        // or updating user context.
        console.log('Login successful! Sheet is closing.')
    }

    return (
        <div className='flex flex-row h-15 justify-end px-5'>
            {/* Control the Sheet's open state using the 'open' prop */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    {/* When this button is clicked, it will set isSheetOpen to true */}
                    <Button onClick={() => setIsSheetOpen(true)}>Login</Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Login</SheetTitle>
                        <SheetDescription>
                            Make changes to your profile here. Click save when
                            you&apos;re done.
                        </SheetDescription>
                    </SheetHeader>
                    <div className='grid flex-1 auto-rows-min gap-6 px-4'>
                        {/* Pass the handleLoginSuccess function to LoginForm */}
                        <LoginForm onLoginSuccess={handleLoginSuccess} />
                    </div>

                    <SheetFooter>
                        {/* The "Save changes" button here is likely not directly tied to LoginForm's submit.
                            If LoginForm handles its own submission, this button might be redundant or
                            needs to trigger LoginForm's submit. For now, it's just a button. */}
                        <Button type='submit'>Save changes</Button>
                        <SheetClose asChild>
                            <Button variant='neutral'>Close</Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
