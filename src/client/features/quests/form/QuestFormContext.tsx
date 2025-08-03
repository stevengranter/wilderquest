// QuestFormContext.tsx
import React, { createContext, useContext, useState } from 'react'

type QuestFormData = {
    name?: string
    description?: string
}

const QuestFormContext = createContext<{
    data: QuestFormData
    update: (fields: Partial<QuestFormData>) => void
} | null>(null)

export function QuestFormProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<QuestFormData>({})

    const update = (fields: Partial<QuestFormData>) =>
        setData((prev) => ({ ...prev, ...fields }))

    return (
        <QuestFormContext.Provider value={{ data, update }}>
            {children}
        </QuestFormContext.Provider>
    )
}

export function useQuestForm() {
    const context = useContext(QuestFormContext)
    if (!context)
        throw new Error('useQuestForm must be used inside QuestFormProvider')
    return context
}
