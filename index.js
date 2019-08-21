const express = require('express')
const app = express()

const port = process.env.PORT || 5000

app.get('/', (req, res) => res.send('Hello World!'))
app.post('/quote', (req, res) => res.send(
    {
        "response_type": "in_channel",
        "text": "Hello World!",
        "attachments": [
            {
                "text":"Hello to the world!"
            }
        ]
    }
)

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))