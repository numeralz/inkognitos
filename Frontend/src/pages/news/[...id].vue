
<script lang="ts" setup>
import RenderDate from "$/components/RenderDate.vue";
import { useShare } from "@vueuse/core";
import type { ShareOptions } from "@vueuse/core";
import { onBeforeRouteUpdate } from "vue-router";
export interface Article {
  _id?: string;
  slug: string;
  title: string;
  lead?: string;
  markdown?: string;
  html?: string;
  createdAt: Date;
  authorSign: {
    hash: string,
    address: string,
    signature: string,
  }
}

const currentPage = reactive<{
  items: Article[];
  page: number;
  total: number;
  perPage: number;
}>( {
  items   : [],
  page    : 1,
  total   : 0,
  perPage : 10,
} );

let activeItem = $ref<Article>();
let isLoading = $ref<boolean>( false );
let shareInfo = $ref<{
  url?: string,
  title?: string,
  quote?: string,
}>();

async function openItem( slug: string ) {
  isLoading = true;

  if( typeof window === "undefined" ) {
    return;
  }

  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/news/${ slug }`,
    } );

    activeItem = data as Article;

    const div = document.createElement( "div" );

    div.innerHTML = activeItem.html || "";

    const text = div.innerText;

    shareInfo = {
      url   : `${ window.location.protocol }//${ window.location.hostname }/news/${ activeItem.slug }`,
      title : activeItem.title,
      quote : activeItem.lead || ( `${ text.slice( 0, 50 ) }...` ),
    };
  } catch( error:any ){
    console.error( error );
  }

  isLoading = false;
}


const route = useRoute();

onMounted( async () => {
  const activeId = route.params.id?.[0];

  if( activeId ){
    await openItem( activeId );
  }
} );
// onBeforeRouteUpdate( async ( to, from, next ) => {
//   const activeId = String( to.params?.id );
  
//   if( activeId ){
//     await openItem( activeId );
//   }

//   next();
// } );



</script>
<template lang="pug">
div(v-if="!activeItem")
div(v-else)
  .bg-white.rounded-3.p-4
    .row.g-4
      .col
        h1 {{ activeItem.title }}
      .col-auto
        a.btn.btn-light(
          :href="`/news/${activeItem.slug}`"
        ).d-flex.justify-content-between.align-items-center
          span.text-muted
            | #[RenderDate(:value="activeItem.createdAt")]
      .col-12
        div(v-html="activeItem.html")
      .col-12
        hr
        .row.align-items-center
          ShareButtons(
            v-bind="shareInfo"
          )

  .card(
    v-if="activeItem.authorSign"
  )
    .card-footer
      blockquote.blockquote
        footer.blockquote-footer
          div Hash: {{ activeItem.authorSign.hash }}
          div Address: {{ activeItem.authorSign.address }}
          div Signature: {{ activeItem.authorSign.signature }}



</template>
<style lang="scss" scoped></style>
