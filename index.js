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
            "text": "Quote chat slash command awaiting some awesome quotes!!"
        }
    ]
});


function continueRequest(url, textToQuote) {
    setTimeout(() => {
        request.post({
            headers: { 'content-type': 'application/json' },
            uri: url,
            body: JSON.stringify({
                "response_type": "in_channel",
                "text": "Hello World!",
                "attachments": [
                    {
                        "text": `Soon we will add a quote for "${textToQuote}"`
                    }
                ]
            })
        }
            , function (error) {
                console.log(error);
            }
        )
    }, 500);
}

app.get('/', (req, res) => res.send('Hello World!'))

app.post('/quote', (req, res) => {
    if (req.body.text.toLowerCase() == '-help') {   
        res.send({
            "text" : "Type in your quote and see the magic happen"
        })
    } else {
        continueRequest(req.body.response_url, req.body.text);
        res.status(200).send("Requesting quote!")
    }

})

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))