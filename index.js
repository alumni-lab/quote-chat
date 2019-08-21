const express = require('express')
const app = express()
var request = require('request');
const querystring = require('querystring');

const port = process.env.PORT || 5000

app.get('/', (req, res) => res.send('Hello World!'))
app.post('/quote', (req, res) => {
    console.log(req.query)
    request.post({
        headers: { 'content-type': 'application/json' }
        , url: req.query.response_url, body: {
            "response_type": "in_channel",
            "text": "Hello World!",
            "attachments": [
                {
                    "text": "Hello to the world!"
                }
            ]
        }
    }
        , function (error, response, body) {
            console.log(error, response, body);
        },
        res.status(200));
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