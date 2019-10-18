const express = require('express')
const Telegram = require('./telegram.js')
const Binance = require('./binance.js')
const app = express()
const port = 4321
const config = require('./local.js')

console.log(`
****************************
***** STARTING THE BOT *****
****************************
`)

const telegram = new Telegram(config.telegramToken, config.botUrl)
const binance = new Binance(config.binanceKey)

function handleBinanceMessage(message) {
  const event = message.e
  let text

  console.log('Handling Binance message', message)

  if (event === 'executionReport' || event === 'ListStatus') {
    text = `Order ID: ${message.i} for ${message.s}
    Side: ${message.S}, Type: ${message.o}
    Price: ${message.p}, Quantity: ${message.q}
    Current order status: ${message.X}`

    console.log('Sending order update', text)
    try {
      telegram.sendMessage(config.telegramUser, text)
    } catch (e) {
      console.error('Error occured', e)
    }
  }
}

app.use(express.json({
  type: '*/json',
  strict: false
}))

app.get('/', (req, res) => res.send(
  'This is a Telegram bot notification system for Binance. Request unknown.'
))

app.get('/test', async (req, res) => {
  let text
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

app.post('/dummy', async (req, res) => {
  let text
  let message = JSON.parse(req.body)
  message.p = await binance.getSymbolPriceTicker(message.s)
  text = `Dummy Order: TEST001 for ${message.s}
    Side: ${message.S}, Type: ${message.o}
    Price: ${message.p}, Quantity: ${message.q}
    Current order status: ${message.X}`

  console.log('Sending order update', text)
  // try {
  //   const response = await telegram.sendMessage(config.telegramUser, text)
  //   text = `Message sent. API Response: ${JSON.stringify(response, null, 2)}`
  // } catch (e) {
  //   text = `Error occured: ${JSON.stringify(e, null, 2)}`
  // }
  console.log('POST /dummy result', text)
  res.send(text)
})

binance.setMessageHandler(handleBinanceMessage)

app.listen(port, () => console.log(`Bot listening on port ${port}!`))
