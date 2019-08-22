const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
const port = process.env.PORT || 5000



const body = JSON.stringify({
    "response_type": "in_channel",
    "text": "Hello World!",
    "attachments": [
        {
            "text": "Hello to the world!"
        }
    ]
});


function continueRequest(url) {
    setTimeout(() => {
        request.post({
            headers: { 'content-type': 'application/json' },
            uri: url,
            body: body
        }
            , function (error, response, body) {
                console.log(error, response, body);
            }
        )
    }, 1000);
}

app.get('/', (req, res) => res.send('Hello World!'))
app.post('/quote', (req, res) => {
    console.log("INCOMING REQUEST")
    console.log(req.body.response_url)
    continueRequest(req.body.response_url);

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