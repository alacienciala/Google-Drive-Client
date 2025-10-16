import type { Plugin } from 'vue'
import vue3GoogleLogin from 'vue3-google-login'

const plugin: Plugin = {
  install(app) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set')
      return
    }

    app.use(vue3GoogleLogin, {
      clientId,
    })
  }
}

export default plugin
