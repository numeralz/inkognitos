<script lang="ts" setup>
import { useShare } from "@vueuse/core";

const props = withDefaults( defineProps<{
  url?: string,
  title?: string,
  description?: string,
  files?: File[],
  hashtags?: string,
  icon?: string,
  media?: string,
  quote?: string,
  text?: string,
  twitterUser?: string,
}>(), {} );


// Emits
const emit = defineEmits<{
  ( event: "update:url", val: string ): void
  ( event: "update:title", val: string ): void
}>();


let shareInfo = $ref<{
  color?: string,
  description?: string,
  files?: File[],
  hashtags?: string,
  icon?: string,
  media?: string,
  network?: string,
  quote?: string,
  text?: string,
  title?: string,
  twitterUser?: string,
  url?: string,
}[]>( [] );
let share = $ref<{share:()=>void}>();

onMounted( async () => {
  // if( !import.meta.env.SSR ){
  //   emit( "update:url", window.location.href );
  //   emit( "update:title", document.body.title );
  // }

  watch( () => props.url, ( val, val0 ) => {
    if( !val || val === val0 ){
      return;
    }

    shareInfo = [
      {
        network : "twitter",
        icon    : "fab fa-twitter",
        color   : "#55acee",
      },
      {
        network : "reddit",
        icon    : "fab fa-reddit",
        color   : "#F64720",
      },
      {
        network : "facebook",
        icon    : "fab fa-facebook",
        color   : "#3b5998",
      },
      {
        network : "vk",
        icon    : "fab fa-vk",
        color   : "#4a76a8",
      },
      {
        network : "pinterest",
        icon    : "fab fa-pinterest",
        color   : "#cd1d1f",
      },
      // {
      //   network : "hackernews",
      //   icon    : "fab fa-hacker-news",
      //   color   : "#000",
      // },
      {
        network : "telegram",
        icon    : "fab fa-telegram",
        color   : "#0088cc",
      },
      {
        network : "whatsapp",
        icon    : "fab fa-whatsapp",
        color   : "#4dc247",
      },
      {
        network : "email",
        icon    : "fa fa-envelope",
        color   : "#000",
      },
    ].map( x=>( {
      ...props,
      ...x,
    } ) );
    share = useShare( {
      url   : props.url,
      title : props.title,
    } );
  }, {
    immediate : true,
  }  );
} );



</script>
<template lang="pug">

.row
  .col-auto
    a(@click="share.share()") #[i.fa-xl.fa.fa-share]

  .col-auto(
    v-for="item in shareInfo"
  )
    ShareNetwork(
      tag="div"
      v-bind="{...item}"
      :style="{'color':item.color}"
    )
      i.fa-xl(:class="item.icon")
    

</template>
<style lang="scss" scoped>

</style>
