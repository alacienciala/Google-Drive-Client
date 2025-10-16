import router from './router'
import vuetify from './vuetify'
import google from './google'
import type { App } from 'vue'

export function registerPlugins (app: App) {
  app.use(router)
  app.use(vuetify)
  app.use(google)
}
