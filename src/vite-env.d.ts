/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_AUTH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

