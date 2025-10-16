/// <reference types="vite/client" />
/// <reference types="unplugin-vue-router/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_DRIVE_SCOPE: string
  readonly VITE_OAUTH_SECRET: string
  readonly VITE_JWT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
