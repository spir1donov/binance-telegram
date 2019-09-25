const express = require('express')
const Telegram = require('./telegram.js')
const Binance = require('./binance.js')
const app = express()
const port = 4321
const config = require('./local.js')

const telegram = new Telegram(config.telegramToken, config.botUrl)
const binance = new Binance(config.binanceKey, config.telegramUser, telegram)

app.use(express.json({
  type: '*/json',
  strict: false
}))

app.get('/', (req, res) => res.send(
  'This is a Telegram bot notification system for Binance. Request unknown.'
))

app.get('/test', async (req, res) => {
  try {
    const response = await telegram.sendMessage(config.telegramUser,
      req.query.test
    )
    text = `Message sent. API Response: ${JSON.stringify(response, null, 2)}`
  } catch (e) {
    text = `Error occured: ${JSON.stringify(e, null, 2)}`
  }
  console.log('GET /test result', text)
  res.send(text)
})

app.listen(port, () => console.log(`Bot listening on port ${port}!`))
