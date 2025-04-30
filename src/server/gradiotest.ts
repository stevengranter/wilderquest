import { Client } from '@gradio/client'
import util from 'util'

const response_0 = await fetch(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Coccinellidae_%2814408978809%29.jpg/640px-Coccinellidae_%2814408978809%29.jpg'
)
const exampleImage = await response_0.blob()

const client = await Client.connect('MVRL/taxabind-demo')
const result = await client.predict('/process', {
    input_image: exampleImage,
})

console.log(util.inspect(result.data, { depth: null }))
