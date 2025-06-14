import 'dotenv/config'
import { Request, Response } from 'express'
import axios from 'axios'

const API_URL = 'https://api.pexels.com/v1/search'
const PER_PAGE = 3
const PEXELS_API_KEY = process.env.PEXELS_API_KEY

const pexelsAPIProxy = async (req: Request, res: Response) => {
    const { query } = req.query
    const url = API_URL + '?query=' + query + '&per_page=' + PER_PAGE
    const result = await axios.get(url, {
        headers: {
            Authorization: PEXELS_API_KEY,
        },
    })
    if (result.status === 404) {
        res.status(404).send({ message: 'Not Found' })
    }
    res.status(200).send(result.data)
}

export default pexelsAPIProxy
