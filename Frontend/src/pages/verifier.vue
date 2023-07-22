<script lang="ts" setup>
import userStore, { getFactoryContract, getInkContract, sameAddress } from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

const {
  selectedAddress,
  user,
  
} = userStore.getState();

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  await userStore.start();

  const nft = await getFactoryContract();
  const owner = await nft.owner();
  const verifier0 = await nft._addrVerifier();

  try{
    const {
      data: {
        verifier,
      },
    } = await axios.request( {
      method : "GET",
      url    : `/api/verifier`,
    } );

    if( !verifier ){
      console.log( "Could not determine verifier." );
      
      return;
    }


    if( sameAddress( verifier0, verifier ) ){
      console.log( "Verifier is correct." );
      
      try{
        await nft.set_baseImageURI( "https://test.decentfactory.xyz/api/tokens/", "/image" );
      }catch( err ){
        console.log( err );
      }

      return;
    }

    if( sameAddress( owner, selectedAddress.value ) ){
      try{
        await nft.set_addrVerifier( verifier );
      }catch( err ){
        console.log( err );
      }
    }
  } catch( error:any ){
    console.error( error );
  }
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );


</script>
<template lang="pug">

.container
  .card
    .card-header
    .card-body



</template>
<style lang="scss" scoped>

</style>
