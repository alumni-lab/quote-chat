# Quote Chat

## A slack app that lets you talk using movie quotes 🎬

Once this app is installed in a workspace, users can use the slash command in any channel where they can:
 - type `/quote -help` for instructions
 - type `/quote QUOTE` to find and display three quotes matching QUOTE
   - click the `Shuffle Quotes` button to get three more quotes matching QUOTE
   - select a quote with the `Pick Me` button to post the quote to the channel

To add new movies to the database use the [Script DB Scraper](https://github.com/alumni-lab/script-db)

### Tech Stack:
- Node.js, Express (slack endpoint)
- Python (script scraper and DB filler)
- PostgreSQL
- Heroku (hosting)
## Preview

![](/images/quoteChat.gif)