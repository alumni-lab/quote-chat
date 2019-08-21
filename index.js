const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => res.JSON('Hello World!'))

app.listen(port, () => console.log(`Quote Chat listening on port ${port}!`))