const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
const port = process.env.PORT || 5000


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
            "text": "Type in your quote and see the magic happen"
        })
    } else {
        // continueRequest(req.body.response_url, req.body.text);

        res.status(200)
        .set('content-type', 'application/json')
        .send([{
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "We found *10 Quotes* that match your search*"
                }
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your quote option 1*"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Quote by _Quote author_ from *Movie name*"
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your quote option 2*"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Quote by _Quote author_ from *Movie name*"
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*Your quote option 3*"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": "Quote by _Quote author_ from *Movie name*"
                    }
                ]
            },
            {
                "type": "divider"
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Shuffle options"
                        },
                        "value": "load_more_quotes"
                    },
                    {
                        "type": "button",
                        "style": "danger",
                        "text": {
                            "type": "plain_text",
                            "text": "Cancel"
                        },
                        "value": "cancel_quote"
                    }
                ]
            }
        ])
    }

})

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))