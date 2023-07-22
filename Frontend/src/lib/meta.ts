
import { useHead } from "@vueuse/head";
export interface MetaData {
  page?: string,
  title?: string,
  description?: string,
  keywords?: string,
  image?: string,
  url?: string,
  type?: string,
  locale?: string,
}
export function setMeta( data: Partial<MetaData> ) {
  useHead( {
    title : [
      data.page,
      data.title,
    ].filter( x=>x ).join( " - " ),
    bodyAttrs : {
      class : "dark",
    },
    meta : [
      ...( data.description ? [
        {
          name : "description", content : data.description,
        },
        {
          name : "og:description", content : data.description,
        },
      ] : [] ),
      ...( data.keywords ? [
        {
          name : "keywords", content : data.keywords,
        },
      ] : [] ),
      ...( data.title ? [
        {
          name : "title", content : data.title,
        },
        {
          name : "og:title", content : data.title,
        },
      ] : [] ),
      ...( data.image ? [
        {
          name : "image", content : data.image,
        },
        {
          name : "og:image", content : data.image,
        },
      ] : [] ),
      ...( data.url ? [
        {
          name : "url", content : data.url,
        },
        {
          name : "og:url", content : data.url,
        },
      ] : [] ),
      ...( data.type ? [
        {
          name : "type", content : data.type || "website",
        },
      ] : [] ),
      {
        name : "locale", content : data.locale || "en-US",
      },
    ],
  } );
}
