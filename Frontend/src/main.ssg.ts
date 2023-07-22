
import "$/assets/root.scss";
// import { parse, stringify } from "@billjs/query-string";
import "@fortawesome/fontawesome-free/css/all.css";
import { setupLayouts } from "virtual:generated-layouts";
// @ts-ignore
import FloatingVue from "floating-vue";
import generatedRoutes from "virtual:generated-pages";
// import { createApp } from "vue";
/* @ts-ignore-next */
import "floating-vue/dist/style.css";
import { ViteSSG } from "vite-ssg";
import VueSocialSharing from "vue-social-sharing";
import App from "./App.vue";
import { createHead } from "@vueuse/head";


Error.stackTraceLimit = Infinity;

/* SSG */
const routes = setupLayouts( generatedRoutes );

export const createApp = ViteSSG(
  App,
  {
    routes,
  },
  ( {
    app, router, routes, isClient, initialState,
  } ) => {
    app.use( FloatingVue, {
      container : "#modals",
    } );
    app.use( VueSocialSharing );

    const head = createHead();

    app.use( head );
  }
);
