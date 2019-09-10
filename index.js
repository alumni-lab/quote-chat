const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }))
const port = process.env.PORT || 5000
const qcToken = process.env.QUOTE_CHAT_TOKEN

const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

function dbQuery(quote) {

  client.query('SELECT * FROM quotes limit 3;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
      
      client.query(`SELECT * FROM characters WHERE id LIKE ${row.character_id}`, (error, result) => {
        if(error) throw error;
        console.log(JSON.stringify(result.rows))
      })
    }
    client.end();
  });
}
dbQuery('something')

function continueRequest(clearUrl, reply_to, textToQuote) {
  // clear origin message
  request.post({
    headers: { 'content-type': 'application/json' },
    uri: clearUrl,
    body: JSON.stringify({
      "delete_original": "true"
    })
  })
  // send responst as user
  request.post({
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${qcToken}`
    },
    uri: 'https://slack.com/api/chat.postMessage',
    body: JSON.stringify({
      "channel": reply_to,
      "as_user": true,
      "delete_original": "true",
      "blocks": [
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
    })
  }
    , function (error) {
      console.log(error);
    }
  )
}


app.post('/quote', (req, res) => {
  if (req.body.text.toLowerCase() == '-help') {
    res.send({
      "text": "Type in your quote and see the magic happen \nExamples: \n/quote -movie batman (shows quotes from batman)\n/quote -char jack sparrow (shows quotes from jack sparrow)\n/quote i'll be back (searches for quotes containing 'i'll be back'"
    })
  } else {
    // GET QUOTES FROM DB
    let quotes = dbQuery('something');
    
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
              "text": quotes.one.quote
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
    if (parsedPayload.actions[0].value.slice(0, 8) === 'pick_opt') {
      res.sendStatus(200)
      let choice = `You chose option ${parsedPayload.actions[0].value.slice(12)}`
      continueRequest(parsedPayload.response_url, parsedPayload.channel.id, choice)
    }
  }
}
)

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))