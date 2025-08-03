// Step1.tsx
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuestForm } from './QuestFormContext'

type FormValues = {
    name: string
}

export default function Step1() {
    const { data, update } = useQuestForm()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { name: data.name || '' },
    })

    const onSubmit = (values: FormValues) => {
        update(values)
        navigate('./step2')
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Step 1: Name</h2>

            <Input
                {...register('name', { required: 'Name is required' })}
                placeholder="Quest name"
            />
            {errors.name && <p>{errors.name.message}</p>}

            <Button type="submit">Next</Button>
        </form>
    )
}
