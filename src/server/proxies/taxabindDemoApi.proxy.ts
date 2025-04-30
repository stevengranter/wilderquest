import { Client } from '@gradio/client'
import { Request, Response } from 'express'

const taxabindDemoAPIProxy = async (req: Request, res: Response) => {
    const inputImage = req.body.image
    if (!inputImage) {
        res.status(400).send({ message: 'No image provided' })
        return
    }

    const client = await Client.connect('MVRL/taxabind-demo')
    const result = await client.predict('/process', {
        input_image: inputImage,
    })
    console.log(result)

    if (!result) {
        res.status(500).send({ message: 'Internal Server Error' })
        return
    }
    if (result.status === 404) {
        res.status(404).send({ message: 'Not Found' })
        return
    }
    res.status(200).send(result.data)
    return
}

export default taxabindDemoAPIProxy
