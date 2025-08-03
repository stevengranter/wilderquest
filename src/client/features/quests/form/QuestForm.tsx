import { Route, Routes } from 'react-router'
import Step2 from '@/features/quests/form/Step2'
import { QuestFormProvider } from './QuestFormContext'
import Step1 from './Step1'

export default function QuestForm() {
    return (
        <QuestFormProvider>
            <Routes>
                <Route path="/" element={<Step1 />} />
                <Route path="/step2" element={<Step2 />} />
            </Routes>
        </QuestFormProvider>
    )
}
