const express = require('express')
const app = express()
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: false
}))
const port = process.env.PORT || 5000
// const qcToken = process.env.QUOTE_CHAT_TOKEN
let bot_access_token = ''
let qcToken = ''

const clientID = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const {
  Client
} = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


// when user installs the app from (https://slack.com/oauth/authorize?scope=commands,bot&client_id=736356271046.734176595488)
app.get('/auth', async (req, res) => {
  // console.log('origin', req.query)
  getBotId(req.query.code, (accessData) => {
    client.query(`INSERT INTO auth (team_id, access_token, bot_access_token) VALUES (${accessData.team_id}, ${accessData.access_token}, ${accessData.bot_access_token})`);
  })
  res.status(200)
})

function getBotId(code, cb) {
  let authAccess = ''
  request.post({
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    uri: "https://slack.com/api/oauth.access",
    form: {
      "client_id": clientID,
      "client_secret": clientSecret,
      "code": code
    }
  }, function (error, res) {
    const body = JSON.parse(res.body)
    authAccess = {
      team_id: body.team_id,
      access_token: body.access_token,
      bot_access_token: body.bot.bot_access_token
    }
    cb(authAccess)
  })

}


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
  let res = await client.query(`SELECT * FROM quotes WHERE lower(quote) LIKE '%${quote.toLowerCase()}%' LIMIT 12;`);
  let exactQuote = '';
  for (let row of res.rows) {
    let quo = row
    const result = await client.query(`SELECT * FROM characters WHERE id = ${row.character_id};`)
    quo.character = result.rows[0].name
    exactQuote = quo;
  }
  if (quoteList.length < 4) {
    const stopWords = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself",
      "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they",
      "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am",
      "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing",
      "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with",
      "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from",
      "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there",
      "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
      "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don",
      "should", "now", ""];
    const quoteSplit = quote.split(' ').filter(function (word) {
      return !stopWords.includes(word);
    })
    let i = 0
    while (quoteList.length < 30) {
      if (i < quoteSplit.length) {

        let more = await client.query(`SELECT * FROM quotes WHERE lower(quote) LIKE '%${quoteSplit[i].toLowerCase()}%';`);
        for (let row of more.rows) {
          let quo = row
          const result = await client.query(`SELECT * FROM characters WHERE id = ${row.character_id};`)
          quo.character = result.rows[0].name
          quoteList.push(quo)
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
  if (exactQuote) {
    shuffled.unshift(exactQuote);
  }
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

async function continueRequest(clearUrl, reply_to, quoteText, quoteChar, quoteMovie, userName, teamID) {
  // clear origin message
  const teamAuth = await client.query(`SELECT * FROM auth WHERE team_id = ${teamID}`)
  qcToken = teamAuth.access_token
  bot_access_token = teamAuth.bot_access_token
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
      "token": bot_access_token,
      "as_user": false, 
      "username": `Quote-Chat`,
      "reply_broadcast": "true",
      "delete_original": "true",
      "blocks": [
        {
          "type": "context",
          "elements": [{
            "type": "mrkdwn",
            "text": `_<@${userName}> posted:_ `
          }]
        },
        {

          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `"${quoteText}"`
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
  }, function (error, res) {
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
      res.sendStatus(200)
      const yourQuote = await getDetails(parsedPayload.actions[0].value.slice(12))
      const quoteQuote = yourQuote.rows[0].quote
      const quoteChar = await getChar(yourQuote.rows[0].character_id)
      const quoteMovie = 'The Lord of the Rings'
      console.log(parsedPayload.team.id)
      continueRequest(parsedPayload.response_url, parsedPayload.channel.id, quoteQuote, quoteChar, quoteMovie, userName, parsedPayload.team.id)
    }
  }
}
)

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))