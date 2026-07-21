/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
