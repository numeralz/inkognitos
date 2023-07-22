
import "$/assets/root.scss";
// import { parse, stringify } from "@billjs/query-string";
import "@fortawesome/fontawesome-free/css/all.css";
import { createHead } from "@vueuse/head";
import { setupLayouts } from "virtual:generated-layouts";
// @ts-ignore
import FloatingVue from "floating-vue";
import generatedRoutes from "virtual:generated-pages";
// import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
/* @ts-ignore-next */
import "floating-vue/dist/style.css";
import VueSocialSharing from "vue-social-sharing";
// import { ViteSSG } from "vite-ssg";
import App from "./App.vue";


Error.stackTraceLimit = Infinity;

const app = createApp( App );

app.config.performance = true;
// app.config.globalProperties.$axios = {
//   ...axios,
// };

const routes = setupLayouts( generatedRoutes );

const router = createRouter( {
  history              : createWebHistory(),
  routes,
  linkActiveClass      : "active",
  linkExactActiveClass : "active",
  // parseQuery( url: string ) {
  //   return {
  //     ...parse(
  //       url
  //     ),
  //   } as LocationQuery;
  // },
  // stringifyQuery( q: any ) {
  //   return stringify(
  //     q
  //   );
  // },
  scrollBehavior( to, from, savedPosition ) {
    if ( to.hash ) {
      return {
        selector : to.hash,
        behavior : "smooth",
      };
    }

    setTimeout( () => {
      try {
        document?.getElementById( "app" )?.scrollIntoView();
      } catch ( err ) {
        console.log( err );
      }
    }, 10 );

    return {
      selector : "#app",
      behavior : "auto",
      top      : 0,
      left     : 0,
    };
  },
} );

app.use( router );
app.use( FloatingVue, {
  container : "#modals",
} );
app.use( VueSocialSharing );

const head = createHead();

app.use( head );
app.mount( "#app" );
