/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_DRIVE_SCOPE: string
  readonly VITE_OAUTH_SECRET: string
  readonly VITE_JWT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
