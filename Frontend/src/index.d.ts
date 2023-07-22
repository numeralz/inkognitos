/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

import { useAxios } from "$/composables/useAxios";
import type { providers } from "ethers";



declare module "*.vue" {
  import { DefineComponent } from "vue";
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
declare module "*.md" {
  import type { ComponentOptions } from "vue";
  const Component: ComponentOptions;
  export default Component;
}
declare global {
  Window;
  interface Window {
    ethereum: providers.ExternalProvider
  }
}
declare module "virtual:pwa-register/vue" {
  // @ts-expect-error ignore when vue is not installed
  import type { Ref } from "vue";

  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: ( registration: ServiceWorkerRegistration | undefined ) => void
    onRegisterError?: ( error: any ) => void
  }

  export function useRegisterSW( options?: RegisterSWOptions ): {
    needRefresh: Ref<boolean>
    offlineReady: Ref<boolean>
    updateServiceWorker: ( reloadPage?: boolean ) => Promise<void>
  }
}