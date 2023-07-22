<script lang="ts" setup>
import userStore from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

const repo = reactive<{
  address: string,
  abi: any,
}[]>( [] );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  await userStore.start();

  try{
    const {
      data,
    } = await axios.request( {
      method : "GET",
      url    : `/api/contracts`,
    } );

    Object.assign( repo, Object.entries( data ).map( ( [
      name, {
        address, abi,
      },
    ] )=>( {
      name, address, abi,
    } ) ) );
  } catch( error:any ){
    console.error( error );
  }

  //
  isLoading.value = false;
} );



</script>
<template lang="pug">

main.bg-light
  .scroll-x.py-3.h-100
    .row.flex-nowrap.g-4.h-100.py-4
      .col-5
      .col.col-9(
        v-for="{name, abi, address} in repo"
      ).h-100
        template(
          v-if="name && address"
        )
          ContractUI(
            v-bind="{ name, address, abi }"
          ).shadow
      .col-5


</template>
<style lang="scss" scoped>
main{
  height: calc( 100vh - 10rem );
}
.scroll-x{
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  .col{
    scroll-snap-align: start;
  }
}
</style>
