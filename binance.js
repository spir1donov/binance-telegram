const axios = require('axios')
const WebSocket = require('ws')
const Telegram = require('./telegram.js')

class Binance {
  // constructor(binanceKey, telegramRecipient, telegramBot) {
  constructor(config) {
    this.tg = axios.create({
      baseURL: `https://api.telegram.org/bot${config.telegramToken}/`
    })

    this.api = axios.create({
      baseURL: `https://api.binance.com/`,
      headers: {
        'Content-Type': 'application/json',
        'X-MBX-APIKEY': config.binanceKey
      }
    })

    this.listenKey = null
    this.telegram = new Telegram(config.telegramToken, config.botUrl)
    this.timer = null
    this.ws = null

    this.initWebSocket()
    this.setWebhook(botUrl)
  }

  async initWebSocket() {
    try {
      this.listenKey = await this.getListenKey()
      console.log('Binance: listenKey', this.listenKey)
      this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.listenKey}`)
      console.log('Binance: WebSocket', this.ws.url)
      this.keepWebSocketAlive()
      this.ws.on('close', this.handleWebSocketDisconnect)
      this.ws.on('message', this.handleWebSocketMessage)
    } catch (e) {
      console.log('Binance: initWebSocket', e)
    }
  }

  keepWebSocketAlive () {
    this.timer = setInterval(() => {
      this.sendKeepAlive()
    }, 30 * 60 * 1000) // every 30 minutes
  }

  sendKeepAlive () {
    this.api.put('/api/v1/userDataStream', {
      listenKey: this.listenKey
    })
    .then(() => console.log('WebSocket keep-alive sent'))
    .catch(() => console.log('WebSocket keep-alive failed', e))
  }

  handleWebSocketDisconnect () {
    console.log('WebSocket disconnected')
    this.ws = null
    clearInterval(this.timer)
    this.setTimeout(() => {
      this.initWebSocket()
    }, 1000)
  }

  handleWebSocketMessage (msg) {
    const message = JSON.parse(msg)
    console.log('Binance: WebSocket Message received', msg, message)

    if (message.e === 'executionReport' || message.e === 'ListStatus') {
      try {
        const result = this.sendMessage(config.telegramUser, `Order ID: ${message.i} for ${message.s}
        Side: ${message.S}, Type: ${message.o}
        Price: ${message.p}, Quantity: ${message.q}
        Current order status: ${message.X}`)
        console.log('Sending order update', text, ', Result:', result)
      } catch (e) {
        console.error('Error occured', e)
      }
    }
  }

  async getListenKey () {
    return new Promise((resolve, reject) => {
      this.api.post('/api/v1/userDataStream')
      .then(response => resolve(response.data.listenKey))
      .catch(reason => reject(reason))
    })
  }

  sendMessage(to, text) {
    return new Promise((resolve, reject) => {
      this.tg.post('sendMessage', {
        text: text,
        chat_id: to
      })
      .then(response => resolve(response.data))
      .catch(reason => reject(reason))
    })
  }

  async setWebhook(botUrl) {
    this.tg.post('setWebhook', {
      url: botUrl
    })
    .then(response => console.log(response.data))
    .catch(reason => console.error(reason))
  }
}

module.exports = Binance
