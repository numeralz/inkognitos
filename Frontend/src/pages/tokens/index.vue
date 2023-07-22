
<script lang="ts" setup>

import ListGuard from "$/components/ListGuard.vue";
import { clamp, openErrorModal } from "$/lib/utils";
import type { FactoryItem } from "$/store/session";
import userStore, { getFactoryContract, getReactions } from "$/store/session";

const {
  selectedAddress,
  user,
} = userStore.getState();

const chunkSize = 8;
const pageSize = chunkSize * 3;

const state = reactive<{
  isLoading: boolean;
  page: number;
}>( {
  isLoading : true,
  page      : 0,
} );

const route = useRoute();
const router = useRouter();
const activeItem = ref<FactoryItem|null>( null );
const items = ref<FactoryItem[]>( [] );

const pagination = reactive( {
  itemCount  : 1,
  pageSize   : 24,
  activePage : 1,
} );

function gotoPage( p ){
  router.push( {
    query : {
      page : p,
    },
  } );
}

async function fetchPage( p = 1 ){
  const {
    data: {
      items: _items,
      skip: _skip,
      limit: _limit,
      total: _total,
    },
  } = await axios.get( `/api/tokens`, {
    params : {
      skip  : Math.max( 0, p - 1 ) * pagination.pageSize,
      limit : pagination.pageSize,
    },
  } ) as {
    data: {
      items: any[];
      skip: number;
      limit: number;
      total: number;
    }
  };

  pagination.pageSize = _limit;
  pagination.itemCount = _total;
  pagination.activePage = clamp( 1 + Math.floor( _skip / pagination.pageSize ), 1, 1 + Math.ceil( pagination.itemCount / pagination.pageSize ) );
  items.value = _items.map( ( _item ) => {
    const item = reactive( _item );

    console.log( item );
    ( async ()=>{
      try{
        const fCtx = await getFactoryContract();

        item.ownerAddress = ( await fCtx.ownerOf( item.tokenId ) )?.toString();
      }catch( err ){
        // 
      }
    } )().then( ( ...args:any )=>{
      console.log( ...args );
    } ).catch( ( err )=>{
      console.error( err );
    } );

    return item;
  } );
}

function itemsOnPage( page = 0 ){
  return items.value.slice( page * pageSize, ( page + 1 ) * pageSize );
}

function itemIsActive( item: FactoryItem ) {
  return item._id === activeItem.value?._id;
}

async function openItem( item: FactoryItem ) {
  activeItem.value = item;
}

async function burnToken( item: FactoryItem ){
  if( !item.tokenId ) {
    return;
  }
          
  const factory = await getFactoryContract();
  const estGas = await factory.estimateGas.burn( item.tokenId, {} );

  console.log( `Est.gas ${ estGas.toString() }` );
  
  if( typeof window === "undefined" ) {
    return;
  }

  await openErrorModal(
    `Are you sure you want to burn token ${ item.tokenId }?`,
    `The creator and the owner (you) will each receive 1/2 of the INK tokens locked in this NFT.`,
    [
      {
        text   : "Cancel",
        action : async ( {
          setOpen,
        } )=>{
          setOpen( false );
        },
        clas : "btn-outline-light",
      },
      {
        text   : "Burn",
        action : async( {
          setOpen,
        } )=>{
          if( !item.tokenId ) {
            setOpen( false );

            return;
          }

          // try{
          //   await factory.callStatic.burn( item.tokenId, {} );
          // }catch( err ){
          //   console.log( err );
          // }

          try{
            await factory.burn( item.tokenId, {
              gasLimit : estGas.add( 1000 ),
            } );
            window.location.reload();
          }catch( err ){
            console.log( err );
          }

          setOpen( false );
        },
        clas : "btn-danger",
      },
    ]
  );
}

function closeItem(){
  activeItem.value = null;
}

async function sendToken( token:FactoryItem ){
  const factory = await getFactoryContract();
  const dest = window.prompt( "Enter destination address:" );

  if( !dest ){
    return;
  }

  try{
    await factory.callStatic["safeTransferFrom(address,address,uint256)"]?.(
      selectedAddress.value,
      dest,
      token.tokenId!
    );
  }catch( err ){
    console.log( err );

    return;
  }

  await factory["safeTransferFrom(address,address,uint256)"](
    selectedAddress.value,
    dest,
    token.tokenId!
  );
}


onMounted( async () => {
  await userStore.start();
  await getReactions();
  await fetchPage( Number( route.query?.page ) || 0 );
  removeEventListener( "keydown", onKeyDown );
  addEventListener( "keydown", onKeyDown );
} );
onBeforeUnmount( async () => {
  removeEventListener( "keydown", onKeyDown );
} );

function onKeyDown( e: KeyboardEvent ) {
  if( activeItem.value ){
    if ( e.code === "ArrowRight" ) {
      nextItem( 1 );
    }else
    if ( e.code === "ArrowLeft" ) {
      nextItem( -1 );
    }
  }
}

function nextItem( d = 1 ){
  if( !activeItem.value ){
    return;
  }

  const index = ( items.value.indexOf( activeItem.value ) + d );

  if( index < 0 ){
    return;
  }

  if( index !== ( index % pagination.pageSize ) ) {
    gotoPage( pagination.activePage +  Math.floor( index / pagination.pageSize ) );
  }
  
  openItem(
    items.value[index % items.value.length]
  );
}

async function remixItem( item: FactoryItem ) {
  try {
    const {
      data: newTokenId,
    } = await axios.request( {
      method : "post",
      url    : `/api/tokens/${ item._id }/remix`,
    } );

    router.push( {
      path  : `/artboard/`,
      query : {
        id : String( newTokenId ),
      },
    } );
  } catch ( error: any ) {
    console.error( error );
  }
}

</script>
<template lang="pug">

div
  .py-3.border-bottom.bg-light1.shadow-sm
    .container
      .row
        .col
          h4 Explore
        .col-auto
          RouterLink(
            to="/artboard"
          ).btn.btn-success.border.btn-lg Draw #[i.fa.fa-arrow-right]
  
  div
    .container
      Pagination(
        :itemCount="pagination.itemCount"
        :pageSize="pagination.pageSize"
        :activePage="pagination.activePage"
        @change="gotoPage"
      ).py-3

      ListGuard(:items="items")
        template(#emptyText) Nothing yet.
        .row.g-1.g-lg-2
          template(
            v-for="(item,i) in items",
          )
            .col-4.col-md-3.col-lg-2(
              :key="item._id"
              v-if="!item._deleted"
            )
              TokenCard(
                :value="item"
                :active="itemIsActive( item )"
                @open="openItem"
              ).shadow

      Pagination(
        :itemCount="pagination.itemCount"
        :pageSize="pagination.pageSize"
        :activePage="pagination.activePage"
        @change="gotoPage"
      ).py-3


  Teleport(to="#modals")
    Transition(
      name="slide"
      mode="out-in"
    )
      TokenModal(
        :activeItem="activeItem"
        @close="closeItem"
        @burn="burnToken(activeItem)"
        @remix="remixItem(activeItem)"
        @send="sendToken(activeItem)"
      )
            
</template>
<style lang="scss" scoped>
body {
  height: 100%;
}
.hovercard{
  background: transparentize( $light, 0.7 );
  transition: background-color 0.2s ease-in-out;
  &:hover{
    background: $light;
  }
}
</style>
