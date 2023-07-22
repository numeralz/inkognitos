import Alias from "@rollup/plugin-alias";
// import { visualizer } from "rollup-plugin-visualizer";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import Layouts from "vite-plugin-vue-layouts";
import Markdown from "vite-plugin-md";
import Pages from "vite-plugin-pages";
import Vue from "@vitejs/plugin-vue";
import { createHtmlPlugin } from "vite-plugin-html";
import { defineConfig } from "vite";
import generateSitemap from "vite-plugin-pages-sitemap";
import { resolve } from "path";

const IS_DEV = process.env.NODE_ENV === "development";

console.log( {
  IS_DEV,
} );

// https://vitejs.dev/config
export default defineConfig( {
  
  define : {
    "process.env" : {},
  },

  resolve : {
    alias : {
      "@/"          : `${ resolve( __dirname, "node_modules" ) }/`,
      "~/"          : `${ resolve( __dirname ) }/`,
      "~bootstrap/" : `${ resolve( __dirname, "node_modules/bootstrap" ) }/`,
      "$/"          : `${ resolve( __dirname, "src" ) }/`,
    },
  },

  /*
  -------------------------------------
  Plugins
  -------------------------------------
  */
  plugins : [
    // visualizer(),
    Vue( {
      include : [
        /\.vue$/,
      ],
      isProduction        : !IS_DEV,
      reactivityTransform : true,
    } ),
    
    createHtmlPlugin( {
      entry  : "/src/main.ts",
      inject : {},
      minify : true,
    } ),
    
    // https://github.com/hannoeru/vite-plugin-pages
    // yarn add -D vite-plugin-pages
    // import Pages from "vite-plugin-pages";
    Pages( {
      pagesDir : [
        "./src/pages/",
      ],
      onRoutesGenerated : ( routes ) => (
        generateSitemap( {
          routes,
          readable    : true,
          allowRobots : true,
          hostname    : "https://inkognitos.com",
        } ) ),
      exclude : [
        "**/test/**",
      ],
      extensions : [
        "vue",
        "md",
      ],
      importMode : "async",
    } ),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    // yarn add -D vite-plugin-vue-layouts
    // import Layouts from "vite-plugin-vue-layouts";
    Layouts( {
      layoutsDirs : [
        `src/layouts`,
      ],
      defaultLayout : "default",
    } ),

    Alias(),
    /*
    -------------------------------------
    ==> Frontend/src/main.ts
    import { createRouter } from "vue-router"
    import { setupLayouts } from "virtual:generated-layouts"
    import generatedRoutes from "virtual:generated-pages"
    const routes = setupLayouts(generatedRoutes)
    const router = createRouter({
      routes,
    });
    -------------------------------------
    ==> Frontend/tsconfig.json
    {
      "compilerOptions": {
        "types": ["vite-plugin-vue-layouts/client"]
      }
    }
    -------------------------------------
    ==> *.vue
    <route lang="yaml">
    meta:
      layout: default
      bgColor: yellow
    </route>
    -------------------------------------
    */

    // https://github.com/antfu/unplugin-auto-import
    // yarn add -D unplugin-auto-import
    // import AutoImport from "unplugin-auto-import"

    AutoImport( {
      sourceMap : IS_DEV,
      imports   : [
        "vue",
        "vue-router",
        "@vueuse/head",
        {
          "$/composables/useAxios.ts" : [
            [
              "default", "axios",
            ],
          ],
        },
        {
          "@ethersproject/bignumber" : [
            "BigNumber",
            "BigNumberish",
          ],
        },
        {
          "@vueuse/core" : [
            "asyncComputed",
            "useTimeAgo",
            "useWebWorkerFn",
            "reactify",
          ],
        },
        // {
        //   axios : [
        //     [
        //       "default", "axios",
        //     ],
        //   ],
        // },
        {
          "vue-meta" : [
            "useMeta",
          ],
        },
      ],
      include : [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      // dirs : [
      //   "./src",
      //   "./node_modules",
      // ],
      eslintrc : {
        enabled          : true,
        filepath         : "./.eslintrc-auto-import.json",
      },
      dts : "./auto-imports.d.ts",
    } ),
    // https://github.com/antfu/unplugin-vue-components
    // yarn add -D unplugin-vue-components
    // import Components from "vite-plugin-vue-components"
    /*
    -------------------------------------
    ==> Frontend/tsconfig.json

    "include": [
      "./src/components.d.ts",
    ]
    -------------------------------------
    */
    Components( {
      dts  : "./components.d.ts",
      dirs : [
        "./src/components",
      ],
      include : [
        /\.ts$/,
        /\.vue$/,
        /\.vue\?vue/,
        /\.md$/,
      ],
      // exclude : [
      //   /[\\/]node_modules[\\/]/,
      //   /[\\/]\.git[\\/]/,
      //   /[\\/]\.nuxt[\\/]/,
      // ],
    } ),

    // https://github.com/antfu/vite-plugin-md
    // yarn add -D vite-plugin-md
    // import Markdown from "vite-plugin-md"
    Markdown( {
      wrapperClasses : [
        "container",
        "text-left",
        "markdown",
      ],
      headEnabled       : true,
      exposeFrontmatter : true,
      frontmatter       : true,
      // builders          : [
      //   meta( {
      //     routeProps : [
      //       "layout", "requireAuth",
      //     ],
      //     defaults : {
      //       requireAuth : () => false,
      //     },
      //   } ),
      //   link(),
      // ],

    } ),

    // https://github.com/antfu/vite-plugin-inspect
    // yarn add -D vite-plugin-inspect
    // import Inspect from "vite-plugin-inspect"
    // Inspect( {
    //   enabled : false && IS_DEV,
    //   include : [
    //     /\.vue$/,
    //   ],
    // } ),
    

    // https://github.com/antfu/vite-plugin-pwa
    // yarn add -D vite-plugin-pwa
    // import VitePWA from "vite-plugin-pwa"
    // VitePWA( {
    //   registerType : "autoUpdate",
    //   // includeAssets: ["favicon.svg", "robots.txt", "safari-pinned-tab.svg"],
    //   manifest     : {
    //     name        : "Inkognitos NFT Studio",
    //     short_name  : "Inkognitos",
    //     theme_color : "hsla(0, 0%, 0%, 0.8)",
    //     icons       : [
    //       {
    //         src   : "./public/favicon.ico",
    //         sizes : "16x16",
    //         type  : "image/png",
    //       },
    //     ],
    //   },
    // } ),

    // https://github.com/intlify/vite-plugin-vue-i18n
    // yarn add -D @intlify/vite-plugin-vue-i18n petite-vue-i18n
    // import VueI18n from "@intlify/vite-plugin-vue-i18n";
    // VueI18n( {
    //   runtimeOnly : true,
    //   // compositionOnly : false,
    //   include     : [
    //     resolve( __dirname, "locales/**" ),
    //   ],
    // } ),
    /*
    -------------------------------------
    ==> Frontend/src/main.ts
    import { createI18n } from "petite-vue-i18n";
    import en from "./src/locales/en.yaml"
    const i18n = createI18n({
      locale: "en",
      messages
    });
    app.use(i18n);
    -------------------------------------
    ==> *.vue
    <script>
    import { useI18n } from "vue-i18n";
    const { locale, t } = useI18n({
      inheritLocale: true
    })
    </script>
    ...
    <i18n lang="yaml">
    en:
      hello: Hello
    es:
      hello: Hola
    </i18n>
    -------------------------------------
    ==> Frontend/tsconfig.json
    {
      "compilerOptions": {
        "types": ["@intlify/vite-plugin-vue-i18n/client"]
      }
    }
    -------------------------------------
    */
  ],
  /*
  -------------------------------------
  Server
  -------------------------------------
  */
  server : {
    host       : "0.0.0.0",
    port       : 30000,
    strictPort : true,
    https      : true,
    hmr        : {
      protocol   : "wss",
      clientPort : 30000,
      port       : 30000,
    },
    proxy : {
      "/api" : {
        target       : "http://backend:30002",
        ssl          : false,
        changeOrigin : true,
      },
      "/ws" : {
        target       : "http://backend:30003",
        ssl          : false,
        ws           : true,
        changeOrigin : true,
      },
    },
  },
  build : {
    sourcemap             : IS_DEV,
    cssCodeSplit          : true,
    reportCompressedSize  : true,
    polyfillModulePreload : true,
    // dynamicImportVarsOptions : {
    //   exclude : [],
    // },
    manifest              : false,
    minify                : IS_DEV ? false : "esbuild",
    
    // rollupOptions : {
    //   input : resolve( __dirname, "index.html" ),
    // },
  },
  // esbuild : {
  //   // banner           : "",
  //   // treeShaking      : true,
  //   sourcemap         : IS_DEV,
  //   // minify            : true,
  //   minifySyntax      : true,
  //   minifyWhitespace  : true,
  //   minifyIdentifiers : false,
  //   keepNames         : true,
  // },
  /*
  -------------------------------------
  Styles
  -------------------------------------
  */
  clearScreen : false,
  logLevel    : "error",
  css         : {
    devSourcemap        : true,
    preprocessorOptions : {
      scss : {
        quietDeps      : true,
        additionalData : [
          `@charset "UTF-8";`,
          `@use "sass:math";`,
          `@import "$/assets/variables.scss";`,
        ].map( x => `${ x }\n` ).join( "" ),
      },
    },
  },
  optimizeDeps : {
    include : [
      "vue",
      "vue-router",
      "@vueuse/head",
      "@vueuse/core",
    //   "axios",
    //   "vue-meta",
    ],
    exclude : [
      "three",
      "vue-demi",
      "bootstrap",
      "swiper",
      "axios-cache-adapter",
    ],
  },
} );
