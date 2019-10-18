const axios = require('axios')
const WebSocket = require('ws')
const querystring = require('querystring')

class Binance {
  constructor(binanceKey) {
    this.api = axios.create({
      baseURL: `https://api.binance.com/`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-MBX-APIKEY': binanceKey
      }
    })

    this.listenKey = null
    this.keepAliveInterval = 30 * 60 * 1000 // every 30 minutes
    this.messageHandler = null
    this.timer = null
    this.ws = null

    this.initWebSocket()
  }

  async initWebSocket() {
    try {
      console.log('Binance: connecting WebSocket')
      this.listenKey = await this.getListenKey()
      console.log('Binance: listenKey', this.listenKey)
      this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.listenKey}`)
      console.log('Binance: WebSocket', this.ws.url)
      this.keepWebSocketAlive()
      this.ws.on('close', this.handleWebSocketDisconnect.bind(this))
      this.ws.on('message', this.handleWebSocketMessage.bind(this))
    } catch (e) {
      console.log('Binance: initWebSocket', e)
    }
  }

  keepWebSocketAlive () {
    console.log('Binance: setting keep-alive interval to ', this.keepAliveInterval)
    this.timer = setInterval(() => {
      this.sendKeepAlive()
    }, this.keepAliveInterval)
  }

  sendKeepAlive () {
    console.log('Binance: sending keep-alive')
    this.api.put('/api/v1/userDataStream', querystring.stringify({
      listenKey: this.listenKey
    }))
    .then(() => console.log('WebSocket keep-alive sent'))
    .catch(() => console.log('WebSocket keep-alive failed', e))
  }

  handleWebSocketDisconnect () {
    console.log('WebSocket disconnected')
    this.ws = null
    clearInterval(this.timer)
    this.initWebSocket()
  }

  async handleWebSocketMessage (message) {
    console.log('Binance: WebSocket Message received', message)
    let json = JSON.parse(message)
    const price = parseFloat(json.p)
    if (price === 0) {
      console.log(`Symbol ${json.s} is ${price}, we need to fix it!`)
      json.p = await this.getSymbolPriceTicker(json.s)
      this.messageHandler(json)
    } else {
      this.messageHandler(json)
    }
  }

  async getListenKey () {
    return new Promise((resolve, reject) => {
      this.api.post('/api/v1/userDataStream')
      .then(response => resolve(response.data.listenKey))
      .catch(reason => reject(reason))
    })
  }

  async getSymbolPriceTicker(symbol) {
    const url = '/api/v3/ticker/price'
    console.log(`Fetching price for ${symbol}`)
    return new Promise((resolve, reject) => {
      this.api.get(url)
      .then(response => {
        console.log(url, 'response.data', response.data)
        const price = parseFloat(response.data.find(s => s.symbol === symbol)['price'])
        resolve(price)
      })
      .catch(reason => {
        console.log(url, reason)
        reject(reason)
      })
    })
  }

  setMessageHandler (handler) {
    this.messageHandler = handler
  }

  deleteMessageHandler () {
    this.messageHandler = null
  }
}

module.exports = Binance
