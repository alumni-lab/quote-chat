const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: false
}))
const port = process.env.PORT || 5000
const qcToken = process.env.QUOTE_CHAT_TOKEN

const {
  Client
} = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
async function dbQuery(quote) {
  let quoteList = [];
  let res = await client.query(`SELECT * FROM quotes WHERE quote LIKE '%${quote}%' LIMIT 12;`);
  for (let row of res.rows) {
    let quo = row
    const result = await client.query(`SELECT * FROM characters WHERE id = ${row.character_id};`)
    quo.character = result.rows[0].name
    quoteList.push(quo)
  }
  if (quoteList.length < 4) {
    const quoteSplit = quote.split(' ')
    let i = 0
    while (quoteList.length < 30) {
      if (i < quoteSplit.length) {

        if (quoteSplit[i].length > 3) {
          //only check words with length greater than 3
          let more = await client.query(`SELECT * FROM quotes WHERE quote LIKE '%${quoteSplit[i]}%';`);
          for (let row of more.rows) {
            let quo = row
            const result = await client.query(`SELECT * FROM characters WHERE id = ${row.character_id};`)
            quo.character = result.rows[0].name
            quoteList.push(quo)
          }
        }
      } else {

        let evenMore = await client.query(`SELECT * FROM quotes LIMIT ${30 - quoteList.length};`);
        for (let row of evenMore.rows) {
          let quo = row
          const result = await client.query(`SELECT * FROM characters WHERE id = ${row.character_id};`)
          quo.character = result.rows[0].name
          quoteList.push(quo)
        }
      }
      i++;
    }


  }

  let shuffled = shuffle(quoteList);

  return shuffled.slice(0, 3)

}

async function getDetails(id) {
  let res = await client.query(`SELECT * FROM quotes WHERE id = ${id};`);
  return res
}
async function getChar(id) {
  let res = await client.query(`SELECT * FROM characters WHERE id = ${id};`);

  return res.rows[0].name
}

function continueRequest(clearUrl, reply_to, quoteText, quoteChar, quoteMovie, userName) {
  // clear origin message
  request.post({
    headers: {
      'content-type': 'application/json'
    },
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
      "as_user": false,
      "username": `from Quote-Chat`,
      "reply_broadcast": "true",
      "delete_original": "true",
      "blocks": [{
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `<${userName}> posted \n${quoteText}`
        }
      },
      {
        "type": "context",
        "elements": [{
          "type": "mrkdwn",
          "text": `_${quoteChar}_ from *${quoteMovie}*`
        }]
      }
      ]
    })
  }, function (error) {
    console.log(error);
  })
}


app.post('/quote', async (req, res) => {
  if (req.body.text.toLowerCase() == '-help') {
    res.send({
      "text": "Type in your quote and see the magic happen \nExamples: \n/quote -movie batman (shows quotes from batman)\n/quote -char jack sparrow (shows quotes from jack sparrow)\n/quote i'll be back (searches for quotes containing 'i'll be back'"
    })
  } else {
    // GET QUOTES FROM DB
    let quotes = await dbQuery(req.body.text);
    console.log(req.body)
    res.status(200)
      .type('application/json')
      .send({
        "blocks": [{
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
            "text": quotes[0].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[0].id}`

          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[0].character} from The Lord of the Rings`
          }]
        },
        {
          "type": "divider"
        },

        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": quotes[1].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[1].id}`

          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[1].character} from The Lord of the Rings`
          }]
        },
        {
          "type": "divider"
        },

        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": quotes[2].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[2].id}`

          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[2].character} from The Lord of the Rings`
          }]
        },

        {
          "type": "divider"
        },
        {
          "type": "actions",
          "elements": [{
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Shuffle Quotes"
            },
            "value": `get_more_quotes_${req.body.text}`
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
      })
  }

})


app.post('/api/response', async (req, res) => {
  const parsedPayload = JSON.parse(req.body.payload)
  console.log("############################", parsedPayload.user)
  const userName = parsedPayload.user.id
  if (parsedPayload.actions[0].value === 'cancel_quote') {
    res.sendStatus(200)
    request.post({
      headers: {
        'content-type': 'application/json'
      },
      uri: parsedPayload.response_url,
      body: JSON.stringify({
        "delete_original": "true"
      })
    })
  } else if (parsedPayload.actions[0].value.slice(0, 15) === 'get_more_quotes') {
    // GET QUOTES FROM DB
    let quotes = await dbQuery(parsedPayload.actions[0].value.slice(16))
    res.status(200)
    request.post({
      headers: {
        'content-type': 'application/json',
      },
      uri: parsedPayload.response_url,
      body: JSON.stringify({
        "blocks": [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Here are some quotes we found matching "${parsedPayload.actions[0].value.slice(16)}"`
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": quotes[0].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[0].id}`
          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[0].character} from The Lord of the Rings`
          }]
        },
        {
          "type": "divider"
        },

        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": quotes[1].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[1].id}`
          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[1].character} from The Lord of the Rings`
          }]
        },
        {
          "type": "divider"
        },

        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": quotes[2].quote
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Pick Me"
            },
            "value": `pick_option_${quotes[2].id}`
          }
        },
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `Quote by ${quotes[2].character} from The Lord of the Rings`
          }]
        },

        {
          "type": "divider"
        },
        {
          "type": "actions",
          "elements": [{
            "type": "button",
            "text": {
              "type": "plain_text",
              "emoji": true,
              "text": "Shuffle Quotes"
            },
            "value": `get_more_quotes_${parsedPayload.actions[0].value.slice(16)}`
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
      })
    })
  } else {
    if (parsedPayload.actions[0].value.slice(0, 8) === 'pick_opt') {
      const yourQuote = await getDetails(parsedPayload.actions[0].value.slice(12))
      res.sendStatus(200)
      const quoteQuote = yourQuote.rows[0].quote
      const quoteChar = await getChar(yourQuote.rows[0].character_id)
      const quoteMovie = 'The Lord of the Rings'
      continueRequest(parsedPayload.response_url, parsedPayload.channel.id, quoteQuote, quoteChar, quoteMovie, userName)
    }
  }
}
)

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))