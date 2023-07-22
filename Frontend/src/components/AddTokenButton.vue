<script lang="ts" setup>
const props = defineProps( {
  address : {
    type     : String,
    required : true,
  },
  symbol : {
    type     : String,
    required : true,
  },
  decimals : {
    type     : Number,
    required : true,
  },
} );

async function watchAddress() {
  if( typeof window === "undefined" ) {
    return;
  }

  try {
    const wasAdded = await ( <any>window.ethereum )?.request?.( {
      method : "wallet_watchAsset",
      params : {
        type    : "ERC1155",
        options : {
          address  : props.address, // The address that the token is at.
          symbol   : props.symbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals : props.decimals, // The number of decimals in the token
          image    : "", // A string url of the token logo
        },
      },
    } );

    if ( wasAdded ) {
      console.log( "Added to wallet" );
    }
  } catch ( error ) {
    console.log( error );
  }
}
</script>
<template lang="pug">
.btn(@click="watchAddress")
  slot
    |#[i.fa.fa-plus]
</template>
<style lang="scss" scoped></style>
