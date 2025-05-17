import {Request, Response} from 'express'
import axios from 'axios'

const API_URL = 'https://api.inaturalist.org/v1'

const iNaturalistAPIProxy = async (req: Request, res: Response) => {
    const result = await axios.get(API_URL + req.url)
    if (result.status === 404) {
        res.status(404).send({message: 'Not Found'})
    }
    res.status(200).send(result.data)
}

export default iNaturalistAPIProxy
