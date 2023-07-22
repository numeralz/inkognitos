<script lang="ts" setup>
import { until, useImage } from "@vueuse/core";



// const isLoading = ref( true );
// const isError = ref( false );

const props = withDefaults(
  defineProps<{
    src: string;
  }>(),
  {}
);

const emit = defineEmits<{
  ( event: "error" ): void;
}>();

const {
  isLoading,
  isReady,
  error: isError,
} = useImage( {
  src : props.src,
} );


until( isError ).toBeTruthy().then( () => {
  emit( "error" );
} );


// function loadImage( src:string ){
//   const img = new Image();

//   isLoading.value = true;
//   isError.value = false;
//   src2.value = "";
//   img.onabort = () => {
//     isError.value = true;
//     emit( "error" );
//   };
//   img.onerror = () => {
//     isError.value = true;
//     emit( "error" );
//   };
//   img.onload = () => {
//     isLoading.value = false;
//   };
//   img.src = src;
// }


// onMounted( () => {
//   watch(
//     ()=>props.src,
//     ( v, v0 )=>{
//       if( v && v !== v0 ) {
//         loadImage( v );
//       }
//     },
//     {
//       immediate : true,
//     }
//   );
// } );


</script>
<template lang="pug">
.stack.h-100
  .layer.appear(
    key="1"
    v-if="isError"
  ).bg-light2.flex-center.faded.appear
    i.fa.fa-exclamation-triangle.fa-3x.text-light.p-0.shake
      
  .layer.appear(
    key="2"
    v-else-if="isLoading"
  ).flex-center.appear
    .spinner-border.faded
  
  img.layer.appear(
    key="3"
    v-else-if="!isLoading && !isError"
    @error="isError=true"
    :src="src"
  )

</template>
<style lang="scss" scoped>
img{
  margin:0;
  display: block;
}
</style>
