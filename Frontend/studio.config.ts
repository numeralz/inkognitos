import Alias from "@rollup/plugin-alias";
import Vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { resolve } from "path";
import { defineConfig } from "vite";

const IS_DEV = process.env.NODE_ENV === "development";

console.log( {
  IS_DEV,
} );

// https://vitejs.dev/config
export default defineConfig( {
  resolve : {
    /*
    -------------------------------------
    Frontend/tsconfig.json
    -------------------------------------
    "paths": {
      "/*": [
        "./node_modules/*"
      ],
      "~/*": [
        "./*"
      ],
      "$/*": [
        "./src/*"
      ],
    },
    -------------------------------------
    */
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

    Alias(),

    Vue( {
      include : [
        /\.vue$/,
      ],
      // customElement : true,=
      isProduction : !IS_DEV,
      // template      : {
      //   preprocessOptions : {
      //     plugins : [
      //       {
      //         preCodeGen : vuePugPlugin,
      //       },
      //     ],
      //   },
      // },
    } ),

    AutoImport( {
      imports : [
        "vue",
        "vue-router",
        "@vueuse/head",
        // {
        //   "graphql-request" : [
        //     "request",
        //     "gql",
        //   ],
        // },
        {
          "@ethersproject/bignumber" : [
            "BigNumber",
            "BigNumberish",
          ],
        },
        {
          "@vueuse/core" : [
            "asyncComputed",
          ],
        },
        {
          axios : [
            [
              "default", "axios",
            ],
          ],
        },
        {
          "vue-meta" : [
            "useMeta",
          ],
        },
      ],
      eslintrc : {
        enabled          : true,
        filepath         : ".eslintrc-auto-import.json",
        globalsPropValue : true,
      },
      dts : "./src/auto-imports.d.ts",
    } ),
    Components( {
      dts  : "./src/components.d.ts",
      dirs : [
        "./src/components",
      ],
      include : [
        /\.ts$/,
        /\.vue$/,
        /\.vue\?vue/,
      ],
      // exclude : [
      //   /[\\/]node_modules[\\/]/,
      //   /[\\/]\.git[\\/]/,
      //   /[\\/]\.nuxt[\\/]/,
      // ],
    } ),
  ],
 
  build : {
    lib : {
      entry    : resolve( __dirname, "./src/studio.js" ),
      name     : "Studio",
      fileName : ( format ) => `Studio.${ format }.js`,
    },
    
    rollupOptions : {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external : [
        "vue",
      ],

      output : {
        dir     : "../Backend/static",
        format  : "umd",
        name    : "Studio",
        globals : {
          vue : "Vue",
        },
      },
      treeshake : true,
    },
    cssCodeSplit         : true,
    reportCompressedSize : false,
    minify               : false,
    // minify               : IS_DEV ? false : true,
  },
  // esbuild : {
  //   // banner            : "",
  //   treeShaking       : true,
  //   // sourcemap         : IS_DEV,
  //   minify            : false,
  //   minifySyntax      : false,
  //   minifyWhitespace  : false,
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
          // `@import "$/assets/theme";`,
        ].map( x => `${ x }\n` ).join( "" ),
      },
    },
  },

  optimizeDeps : {
    include : [
      "vue",
      "paper",
      "vue-router",
      "@vueuse/head",
      "@vueuse/core",
      "bootstrap",
      "axios",
      "vue-meta",
    ],
    exclude : [
      "vue-demi",
      "@popperjs/core",
    ],
  },
  // ssgOptions : {
  //   script     : "async",
  //   formatting : "minify",
  //   // mock       : true,
  // },


} );
