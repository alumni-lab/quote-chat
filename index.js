const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
const port = process.env.PORT || 5000

app.get('/', (req, res) => res.send('Hello World!'))
app.get('/quote', (req, res) => {
    console.log(req.body.response_url)
    request.post({
        headers: { 'content-type': 'application/json' }, 
        uri: req.body.response_url,
        body: JSON.stringify({
            "response_type": "in_channel",
            "text": "Hello World!",
            "attachments": [
                {
                    "text": "Hello to the world!"
                }
            ]
        })
    }
        , function (error, response, body) {
            console.log(error, response, body);
        }
    )

    res.status(200);

    // {
    // res.json(
    //     {
    //         "response_type": "in_channel",
    //         "text": "Hello World!",
    //         "attachments": [
    //             {
    //                 "text": "Hello to the world!"
    //             }
    //         ]
    //     })
    // }

})

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))