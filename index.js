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
        "blocks" : [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `${textToQuote}`
            }
          },
          {
            "type": "context",
            "elements": [
              {
                "type": "mrkdwn",
                "text": "_Quote author_ from *Movie name*"
              }
            ]
          }
        ]
        // "text": "Hello World!",
        // "attachments": [
        //   {
        //     "text": `${textToQuote}`
        //   }
        // ]
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
      "text": "Type in your quote and see the magic happen \nExamples: \n/quote -movie batman (shows quotes from batman)\n/quote -char jack sparrow (shows quotes from jack sparrow)\n/quote i'll be back (searches for quotes containing 'i'll be back'"
    })
  } else {
    // continueRequest(req.body.response_url, req.body.text);

    res.status(200)
      .type('application/json')
      .send({
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `Here are some quotes we found matching "${req.body.text}"`
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
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Pick Me"
              },
              "value": "pick_option_1"
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
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Pick Me"
              },
              "value": "pick_option_2"
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
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Pick Me"
              },
              "value": "pick_option_3"
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
                  "emoji": true,
                  "text": "Shuffle Quotes"
                },
                "value": "get_more_quotes"
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
        ]
      }
      )
  }

})


app.post('/api/response', (req, res) => {
  const parsedPayload = JSON.parse(req.body.payload)
  if (parsedPayload.actions[0].value === 'cancel_quote') {
    res.sendStatus(200)
    request.post({
      headers: { 'content-type': 'application/json' },
      uri: parsedPayload.response_url,
      body: JSON.stringify({
        "delete_original": "true"
      })
    }
    )

  } else {
    console.log(parsedPayload)
    if (parsedPayload.actions[0].value.slice(0,8) === 'pick_opt') {
      res.sendStatus(200)
      let choice = `You chose option ${parsedPayload.actions[0].value.slice(12)}`
      continueRequest(parsedPayload.response_url, choice)
  }
}
)

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))