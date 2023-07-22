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
  userStore.start();

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

.container.scroll-x
  .row.flex-nowrap
    .col-4(
      v-for="{name, abi, address} in repo"
    )
      template(
        v-if="name && address"
      )
        div {{name}}
        ContractUI(
          v-bind="{ name, address, abi }"
        )


</template>
<style lang="scss" scoped>
.scroll-x{
  overflow-x: auto;
}
</style>
