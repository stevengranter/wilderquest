import { tool } from 'ai'
import { z } from 'zod'

export const getCurrentDateTool = tool({
    description: 'Get the current date and time',
    parameters: z.object({
        format: z.string().optional().describe('Date format preference (e.g., "short", "long", "iso")'),
    }),
    execute: async ({ format = 'long' }) => {
        const now = new Date()

        switch (format) {
            case 'short':
                return {
                    date: now.toLocaleDateString(),
                    time: now.toLocaleTimeString(),
                    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'short' }),
                }
            case 'iso':
                return {
                    date: now.toISOString(),
                    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
                }
            default:
                return {
                    date: now.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    time: now.toLocaleTimeString(),
                    timestamp: now.getTime(),
                }
        }
    },
})

export const getDateInfoTool = tool({
    description: 'Get current date information and perform date calculations',
    parameters: z.object({
        operation: z.enum(['current', 'add_days', 'day_of_week', 'days_until']).describe('Type of date operation'),
        days: z.number().optional().describe('Number of days to add or calculate'),
        targetDay: z.string().optional().describe('Target day of week (e.g., "Friday")'),
    }),
    execute: async ({ operation, days = 0, targetDay }) => {
        const now = new Date()

        switch (operation) {
            case 'current':
                return {
                    currentDate: now.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    dayOfWeek: now.getDay(),
                    timestamp: now.getTime(),
                }

            case 'add_days':
                const futureDate = new Date(now)
                futureDate.setDate(now.getDate() + days)
                return {
                    resultDate: futureDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                    daysFromNow: days,
                }

            case 'days_until':
                if (!targetDay) return { error: 'Target day required' }
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                const targetDayIndex = dayNames.findIndex(day =>
                    day.toLowerCase() === targetDay.toLowerCase(),
                )

                if (targetDayIndex === -1) return { error: 'Invalid day name' }

                const currentDayIndex = now.getDay()
                let daysUntil = targetDayIndex - currentDayIndex
                if (daysUntil <= 0) daysUntil += 7 // Next occurrence

                const targetDate = new Date(now)
                targetDate.setDate(now.getDate() + daysUntil)

                return {
                    targetDay,
                    daysUntil,
                    targetDate: targetDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                }

            default:
                return { error: 'Unknown operation' }
        }
    },
})
