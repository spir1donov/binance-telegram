const axios = require('axios')

class Telegram {
  constructor (telegramToken, botUrl) {
    this.api = axios.create({
      baseURL: `https://api.telegram.org/bot${telegramToken}/`
    })

    this.setWebhook(botUrl)
  }

  sendMessage(to, text) {
    return new Promise((resolve, reject) => {
      this.api.post('sendMessage', {
        text: text,
        chat_id: to
      })
      .then(response => resolve(response.data))
      .catch(reason => reject(reason))
    })
  }

  async setWebhook(botUrl) {
    this.api.post('setWebhook', {
      url: botUrl
    })
    .then(response => console.log(response.data))
    .catch(reason => console.error(reason))
  }
}

module.exports = Telegram
