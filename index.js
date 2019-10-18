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
  let message = JSON.parse(`{"e":"executionReport","E":1571220675490,"s":"BTCUSDT","c":"5dM11w33W7Kaob6hosSX0K","S":"SELL","o":"MARKET","f":"GTC","q":"0.00129900","p":"0.00000000","P":"0.00000000","F":"0.00000000","g":-1,"C":"null","x":"TRADE","X":"FILLED","r":"NONE","i":710328223,"l":"0.00129900","z":"0.00129900","L":"8154.43000000","n":"0.01059260","N":"USDT","T":1571220675487,"t":190630354,"I":1601694188,"w":false,"m":false,"M":true,"O":1571220675487,"Z":"10.59260457","Y":"10.59260457"}`)
  message.p = await binance.getSymbolPriceTicker(message.s)
  text = `Dummy Order: TEST001 for ${message.s}
    Side: ${message.S}, Type: ${message.o}
    Price: ${message.p}, Quantity: ${message.q}
    Current order status: ${message.X}`

  console.log('Sending order update', text)
  try {
    const response = await telegram.sendMessage(config.telegramUser, text)
    text = `Message sent. API Response: ${JSON.stringify(response, null, 2)}`
  } catch (e) {
    text = `Error occured: ${JSON.stringify(e, null, 2)}`
  }
  console.log('POST /dummy result', text)
  res.send(text)
})

binance.setMessageHandler(handleBinanceMessage)

app.listen(port, () => console.log(`Bot listening on port ${port}!`))
