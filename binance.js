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
    this.messageHandler = null
    this.timer = null
    this.ws = null

    this.initWebSocket()
  }

  async initWebSocket() {
    try {
      this.listenKey = await this.getListenKey()
      console.log('Binance: listenKey', this.listenKey)
      this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.listenKey}`)
      console.log('Binance: WebSocket', this.ws.url)
      this.keepWebSocketAlive()
      this.ws.on('close', this.handleWebSocketDisconnect.bind(this))
      this.ws.on('message', this.handleWebSocketMessage.bind(this))
      this.sendKeepAlive()
    } catch (e) {
      console.log('Binance: initWebSocket', e)
    }
  }

  keepWebSocketAlive () {
    this.timer = setInterval(() => {
      console.log('Binance: sending keep-alive')
      this.sendKeepAlive()
    }, 30 * 1000) // every 30 seconds
  }

  sendKeepAlive () {
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
    this.setTimeout(() => {
      this.initWebSocket()
    }, 1000)
  }

  handleWebSocketMessage (message) {
    console.log('Binance: WebSocket Message received', message)
    this.messageHandler(message)
  }

  async getListenKey () {
    return new Promise((resolve, reject) => {
      this.api.post('/api/v1/userDataStream')
      .then(response => resolve(response.data.listenKey))
      .catch(reason => reject(reason))
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
