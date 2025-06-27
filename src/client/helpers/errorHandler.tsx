// Based on ErrorHandler.tsx by teddysmithdev
// https://github.com/teddysmithdev/FinShark/blob/master/frontend/src/Helpers/ErrorHandler.tsx

import axios, { AxiosError } from 'axios'
import { data } from 'react-router'
import { toast } from 'sonner'
import { string } from 'zod'

export const handleError = (error: AxiosError | { message?: string }) => {
    if (axios.isAxiosError(error)) {
        const err = error.response
        if (Array.isArray(err?.data.errors)) {
            for (const val of err.data.errors) {
                // toast({
                //     title: 'Error',
                //     description: val.description,
                // })
                console.log(val.message)
            }
        } else if (typeof err?.data.errors === 'object') {
            for (const e in err?.data.errors) {
                toast(err.data.errors[e][0])
                console.log(err.data.errors[e][0])
            }
        } else if (err?.data) {
            console.log(err)
            toast.error(err.data.message)
            // console.log(err.data.message)
        } else if (err?.status == 401) {
            // toast({ title: 'Error', description: 'Please login' })
            console.log('Please login')
            window.history.pushState({}, 'LoginPage', '/login')
        }
    } else if (error?.message) {
        console.log(error.message)
        toast.error(error.message)
    } else if (error) {
        // console.log(err)
        toast.error(error)
    }
}
