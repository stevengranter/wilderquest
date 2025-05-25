import {Request, Response} from 'express'
import axios from 'axios'

const API_URL = 'https://api.inaturalist.org/v1'

const iNaturalistAPIProxy = async (req: Request, res: Response) => {
  console.log('iNaturalist API Proxy')

  try {
    const result = await axios.get(API_URL + req.url)

    if (result.status === 404) {
      res.status(404).send({ message: 'Not Found' })
      console.log('404 not found')
      return
    }

    // For all other status codes, assume success (or handle specific ones)
    res.status(result.status).send(result.data)
  } catch (error) {
    console.error('API Proxy Error:', error.message)

    if (axios.isAxiosError(error)) {
      res.status(500).json({ message: 'Internal Server Error' })
    } else {
      res.status(500).json({ message: 'Unexpected error occurred' })
    }
  }
};



export default iNaturalistAPIProxy
