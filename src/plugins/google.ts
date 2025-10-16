import type { Plugin } from 'vue'
import GoogleSignInPlugin from 'vue3-google-signin'

const plugin: Plugin = {
  install(app) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set')
      return
    }

    app.use(GoogleSignInPlugin, {
      clientId,
    })
  }
}

export default plugin
