/**
 * Truncate the message history to a manageable size.
 * Keeps the first system message + last N user/assistant messages.
 */
export function truncateMessages(messages: any[], limit: number = 8): any[] {
    if (!Array.isArray(messages)) return []

    const systemMessages = messages.filter((m) => m.role === 'system')
    const userAssistantMessages = messages.filter((m) =>
        m.role === 'user' || m.role === 'assistant',
    )

    const lastMessages = userAssistantMessages.slice(-limit)

    return [...systemMessages.slice(0, 1), ...lastMessages]
}
