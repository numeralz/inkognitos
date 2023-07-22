<script lang="ts" setup>
import {  Method } from "axios";



const props = withDefaults( defineProps<{
  url: string,
  method?: Method,
  params?: any,
  body?: any,
}>(), {
  method : "get",
  params : {},
  body   : {},
} );

const response = ref<any >( null );
const isLoading = ref<any >( false );

// Emits
const emit = defineEmits<{
  ( event: "update", data: any ): void
}>();

// Expose
defineExpose( {
  update : async ()=>{
    await doRequest( props.url );
  },
} );

async function doRequest( url ){
  try{
    isLoading.value = true;

    const {
      data,
    } = response.value = await axios.request( {
      method : props.method,
      url,
      params : props.params,
      data   : props.body,
    } );

    console.log( response.value );
    emit( "update", data );

    // handle result
  } catch( error:any ){
    console.error( error );
    response.value = null;
  }
    
  isLoading.value = false;
}

onMounted( async () => {
  watch(
    ()=> props.url,
    async ( url, url0 ) => {
      if( url ){
        await doRequest( url );
      }
    },
    {
      immediate : true,
    }
  );
} );

</script>
<template lang="pug">

slot(
  v-if="isLoading"
  name="loading"
  v-bind="{ url: props.url }"
)
slot(
  name="default"
  v-else-if="response"
  :data="response.data"
  :res="response"
)
  //- pre {{response}}

</template>
<style lang="scss" scoped>

</style>
