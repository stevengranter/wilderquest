// Step2.tsx
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useQuestForm } from './QuestFormContext'

type FormValues = {
    description: string
}

export default function Step2() {
    const { data, update } = useQuestForm()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { description: data.description || '' },
    })

    const onSubmit = (values: FormValues) => {
        update(values)
        navigate('/quests/create/step3')
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Step 2: Description</h2>

            {data?.name && <p>{data.name}</p>}

            <textarea
                {...register('description', {
                    required: 'Description is required',
                })}
                placeholder="Quest description"
            />
            {errors.description && <p>{errors.description.message}</p>}

            <button
                type="button"
                onClick={() => navigate('/quests/create/step1')}
            >
                Back
            </button>
            <button type="submit">Next</button>
        </form>
    )
}
