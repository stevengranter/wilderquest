import { Request, Response } from 'express'

type Client = {
    id: string
    res: Response
}

const clients: { [questId: string]: Client[] } = {}

export const subscribe = (req: Request, res: Response) => {
    const { questId } = req.params
    const clientId = Date.now().toString()
    const newClient = {
        id: clientId,
        res,
    }

    console.log(
        '🔌 SERVER: New EventSource client connecting to quest:',
        questId,
        'clientId:',
        clientId
    )

    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        })
        console.log('🔌 SERVER: EventSource headers sent successfully')

        if (!clients[questId]) {
            clients[questId] = []
            console.log(
                '🔌 SERVER: Created new client array for quest:',
                questId
            )
        }

        clients[questId].push(newClient)
        console.log(
            '🔌 SERVER: Added client to quest',
            questId,
            '- total clients:',
            clients[questId].length
        )

        // Send a comment to keep the connection alive
        res.write(': EventSource connection established\n\n')
        console.log('🔌 SERVER: Sent initial comment to keep connection alive')
        console.log('🔌 SERVER: Connection headers sent, waiting for events...')

        req.on('close', () => {
            console.log(
                '🔌 SERVER: Client disconnected from quest:',
                questId,
                'clientId:',
                clientId
            )
            clients[questId] = clients[questId].filter((c) => c.id !== clientId)
            console.log(
                '🔌 SERVER: Remaining clients for quest',
                questId,
                ':',
                clients[questId].length
            )
        })
    } catch (error) {
        console.error('🔌 SERVER: Error setting up EventSource:', error)
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to setup EventSource' })
        }
    }
}

export const sendEvent = (questId: string, event: Record<string, unknown>) => {
    console.log('📤 SERVER: Sending event to quest', questId, ':', event)
    const questClients = clients[questId]
    console.log(
        '📤 SERVER: Found',
        questClients?.length || 0,
        'clients for quest',
        questId
    )

    if (questClients && questClients.length > 0) {
        questClients.forEach((client, index) => {
            try {
                const messageData = `data: ${JSON.stringify(event)}\n\n`
                console.log(
                    '📤 SERVER: Sending to client',
                    index + 1,
                    'of',
                    questClients.length
                )
                console.log('📤 SERVER: Message data:', messageData)
                const writeResult = client.res.write(messageData)
                console.log('📤 SERVER: Write result:', writeResult)
                console.log('📤 SERVER: Successfully sent to client', index + 1)
                console.log(
                    '📤 SERVER: Client response writable:',
                    client.res.writable
                )
                console.log(
                    '📤 SERVER: Client response destroyed:',
                    client.res.destroyed
                )
            } catch (error) {
                console.error(
                    '📤 SERVER: Error sending to client',
                    index + 1,
                    ':',
                    error
                )
                console.error(
                    '📤 SERVER: Client response writable:',
                    client.res.writable
                )
            }
        })
    } else {
        console.warn('📤 SERVER: No clients found for quest', questId)
    }
}
