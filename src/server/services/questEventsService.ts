import { Request, Response } from 'express'

type Client = {
    id: string;
    res: Response;
};

const clients: { [questId: string]: Client[] } = {};

export const subscribe = (req: Request, res: Response) => {
    const { questId } = req.params;
    const clientId = Date.now().toString();
    const newClient = {
        id: clientId,
        res,
    };

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    if (!clients[questId]) {
        clients[questId] = [];
    }
    clients[questId].push(newClient);

    req.on('close', () => {
        clients[questId] = clients[questId].filter(c => c.id !== clientId);
    });
};

export const sendEvent = (questId: string, event: any) => {
    const questClients = clients[questId];
    if (questClients) {
        questClients.forEach(client => {
            client.res.write(`data: ${JSON.stringify(event)}

`);
        });
    }
};