import { Request, Response } from 'express'
import { serverDebug } from '@shared/utils/debug.js'

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

    serverDebug.events(
        'New EventSource client connecting to quest %s, clientId: %s',
        questId,
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
        serverDebug.events('EventSource headers sent successfully')

        if (!clients[questId]) {
            clients[questId] = []
            serverDebug.events(
                'Created new client array for quest: %s',
                questId
            )
        }

        clients[questId].push(newClient)
        serverDebug.events(
            'Added client to quest %s - total clients: %s',
            questId,
            clients[questId].length
        )

        // Send a comment to keep the connection alive
        res.write(': EventSource connection established\n\n')
        serverDebug.events('Sent initial comment to keep connection alive')
        serverDebug.events('Connection headers sent, waiting for events...')

        req.on('close', () => {
            serverDebug.events(
                'Client disconnected from quest %s, clientId: %s',
                questId,
                clientId
            )
            clients[questId] = clients[questId].filter((c) => c.id !== clientId)
            serverDebug.events(
                'Remaining clients for quest %s: %s',
                questId,
                clients[questId].length
            )
        })
    } catch (error) {
        serverDebug.events('Error setting up EventSource: %o', error)
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to setup EventSource' })
        }
    }
}

export const sendEvent = (questId: string, event: Record<string, unknown>) => {
    serverDebug.events('Sending event to quest %s: %o', questId, event)
    const questClients = clients[questId]
    serverDebug.events(
        'Found %s clients for quest %s',
        questClients?.length || 0,
        questId
    )

    if (questClients && questClients.length > 0) {
        questClients.forEach((client, index) => {
            try {
                const messageData = `data: ${JSON.stringify(event)}\n\n`
                serverDebug.events(
                    'Sending to client %s of %s',
                    index + 1,
                    questClients.length
                )
                serverDebug.events('Message data: %s', messageData)
                const writeResult = client.res.write(messageData)
                serverDebug.events('Write result: %s', writeResult)
                serverDebug.events('Successfully sent to client %s', index + 1)
                serverDebug.events(
                    'Client response writable: %s',
                    client.res.writable
                )
                serverDebug.events(
                    'Client response destroyed: %s',
                    client.res.destroyed
                )
            } catch (error) {
                serverDebug.events(
                    'Error sending to client %s: %o',
                    index + 1,
                    error
                )
                serverDebug.events(
                    'Client response writable: %s',
                    client.res.writable
                )
            }
        })
    } else {
        serverDebug.events('No clients found for quest %s', questId)
    }
}
