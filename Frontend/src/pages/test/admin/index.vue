<script lang="ts" setup>
import type { InkognitosNFT } from "$/../typechain";
import userStore, { getFactoryContract, getSigner } from "$/store/session";
import { onMounted } from "vue";
import { openErrorModal } from "../../lib/utils";

interface State {
  isLoading: boolean;
  items: any[],
  queue: any[],
}

const state = reactive<State>( {
  isLoading : false,
  items     : [],
  queue     : [],
} );

onMounted( async () => {
  // try{
  //   const {
  //     items,
  //   } = await ( await fetch( "/api/admin/drafts" ) ).json();

  //   console.log( items );
  //   state.items = items;
  // }catch( err ){
  //   console.log( err );
  // }
  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/admin/permits`,
    } );

    state.items = data.items;
  } catch( error:any ){
    console.error( error );
  }
} );

async function revealItem( item:any ){
  try{
    const {
      data,
    } = await axios.request( {
      method : "put",
      url    : `/api/admin/drafts/publish`,
      data   : {
        id : item._id,
      },
    } );

    // handle result
    console.log( data );
  } catch( error:any ){
    console.error( error );
  }
}

const activeItem = ref<any>( null );

async function openItem( item:any ) {
  activeItem.value = item;
}

async function approveItem( item:any ){
  const factory = await getFactoryContract();

  const domain:any = {
    name              : "SubmitPermit",
    chainId           : provider.value?.network.chainId,
    version           : "1",
    verifyingContract : factory.address,
  };

  const types = {
    SubmitPermit : [
      {
        name : "author",
        type : "address",
      },
      {
        name : "timestamp",
        type : "uint256",
      },
      {
        name : "inkIds",
        type : "uint256[]",
      },
      {
        name : "inkQtys",
        type : "uint256[]",
      },
    ],
  };
  
  const message = item.permit as InkognitosNFT.SubmitPermitStruct;

  openErrorModal( "Signing", JSON.stringify( message, null, 2 ) );

  const signature = ( await getSigner() )._signTypedData( domain, types, message );

  try{
    const {
      data,
    } = await axios.request( {
      method : "post",
      url    : `/api/admin/permits/${ item._id }/sign`,
      data   : {
        signature,
      },
    } );


    Object.assign( item, data );
    await openErrorModal( "OK", "Permit approved" );
  } catch( err:any ){
    console.error( err );
    await openErrorModal( "Failed", err.message );
  }
}

const {
  selectedAddress, provider,
} = userStore.getState();

</script>
<template lang="pug">
.page-h
  .row.g-3.h-100
    .col-lg.h-100.scroll-y
      h5 Submissions
      .row.g-2
        template(v-for="(item, i) in state.items", :key="item.tokenId")
          .col-12.col-md-6.col-xl-4
            .card.overflow-hidden
              .row.g-0
                .col-auto.bg-light1.d-flex
                  .square.bg-light(style="max-width:20rem; min-width: 10rem; width: 50%").align-self-center
                    LoadImage.inner.no-select(
                      v-if="item.image", :src="item.image"
                    )

                .col.border-start
                  TokenMaterials(:value="item")

                  .p-2(v-if="!item.permitSignature")
                    .btn.btn-success(@click="approveItem(item)") Approve

    .col-lg(v-if="activeItem")
      .card
        .card-body
          pre {{activeItem}}
  


</template>
<style lang="scss" scoped>
object{
  svg{
    width: 100%;
  }
}
</style>