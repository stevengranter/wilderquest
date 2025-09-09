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
        console.log('EventSource headers sent successfully')

        if (!clients[questId]) {
            clients[questId] = []
            console.log(
                'Created new client array for quest: %s',
                questId
            )
        }

        clients[questId].push(newClient)
        console.log(
            'Added client to quest %s - total clients: %s',
            questId,
            clients[questId].length
        )

        // Send a comment to keep the connection alive
        res.write(': EventSource connection established\n\n')
        console.log('Sent initial comment to keep connection alive')
        console.log('Connection headers sent, waiting for events...')

        req.on('close', () => {
            console.log(
                'Client disconnected from quest %s, clientId: %s',
                questId,
                clientId
            )
            clients[questId] = clients[questId].filter((c) => c.id !== clientId)
            console.log(
                'Remaining clients for quest %s: %s',
                questId,
                clients[questId].length
            )
        })
    } catch (error) {
        console.log('Error setting up EventSource: %o', error)
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to setup EventSource' })
        }
    }
}

export const sendEvent = (questId: string, event: Record<string, unknown>) => {
    console.log('Sending event to quest %s: %o', questId, event)
    const questClients = clients[questId]
    console.log(
        'Found %s clients for quest %s',
        questClients?.length || 0,
        questId
    )

    if (questClients && questClients.length > 0) {
        questClients.forEach((client, index) => {
            try {
                const messageData = `data: ${JSON.stringify(event)}\n\n`
                console.log(
                    'Sending to client %s of %s',
                    index + 1,
                    questClients.length
                )
                console.log('Message data: %s', messageData)
                const writeResult = client.res.write(messageData)
                console.log('Write result: %s', writeResult)
                console.log('Successfully sent to client %s', index + 1)
                console.log(
                    'Client response writable: %s',
                    client.res.writable
                )
                console.log(
                    'Client response destroyed: %s',
                    client.res.destroyed
                )
            } catch (error) {
                console.log(
                    'Error sending to client %s: %o',
                    index + 1,
                    error
                )
                console.log(
                    'Client response writable: %s',
                    client.res.writable
                )
            }
        })
    } else {
        console.log('No clients found for quest %s', questId)
    }
}
