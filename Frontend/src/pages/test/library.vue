<script lang="ts" setup>
import { openErrorModal, safeUrl } from "$/lib/utils";
import type { FactoryItem } from "$/store/session";
import userStore, { getFactoryContract } from "$/store/session";
import type { BigNumberish } from "ethers";
import gsap from "gsap";

const   {
  utils: {
    clamp, interpolate,
  },
} = gsap;



/*  */
async function fetchDrafts() {
  const {
    data,
  } = await axios.request( {
    method : "GET",
    url    : `/api/tokens/drafts`,
    
  } );

  console.log( data );
  
  return data.items;
}

/* Fetch */
async function fetchCreated() {
  const factory = await getFactoryContract();

  if ( !factory || !selectedAddress.value ) {
    return [];
  }
  
  return ( await factory.callStatic.tokensOfCreator( selectedAddress.value ) ).map( tokenId => reactive( {
    tokenId : tokenId.toString(),
  } ) );
}

/*  */
async function fetchOwned() {
  const factory = await getFactoryContract();

  if ( !factory || !selectedAddress.value ) {
    return [];
  }

  return ( await factory.callStatic.tokensOfOwner( selectedAddress.value ) ).map( tokenId => reactive( {
    tokenId : tokenId.toString(),
  } )  );
}


interface TabData {
  label: string,
  fetch: ()=>Promise<any>,
  items: FactoryItem[],
  busy?: boolean,
}
const tabs = ref<TabData[]>( [] );

tabs.value.push( {
  label : "Your Drafts",
  fetch : fetchDrafts,
  items : [],
  busy  : false,
} );
tabs.value.push( {
  label : "You Own",
  fetch : fetchOwned,
  items : [],
  busy  : false,
} );
tabs.value.push( {
  label : "You Published",
  fetch : fetchCreated,
  items : [],
  busy  : false,
} );

const activeTab = ref<TabData>();

async function openTab( tab:TabData ){
  activeTab.value = tab;
  activeTab.value.busy = true;

  const items = await tab?.fetch?.();

  console.log( {
    items,
  } );
  activeTab.value.items = items;
  activeTab.value.busy = false;
}



const items = ref<FactoryItem[]>( [] );
const activeItem = ref<FactoryItem|null>();
const router = useRouter();

const {
  selectedAddress,
  user,
} = userStore.getState();

async function tokenMetadata( tokenId: BigNumberish ): Promise<any> {
  const factory = await getFactoryContract();
  const tokenUri = safeUrl( await factory!.callStatic.tokenURI( tokenId ) );
  const base64String = tokenUri.slice( 29 );
  const jsonString = window.atob( base64String );

  console.log( {
    jsonString,
  } );

  const metadata = JSON.parse( jsonString );

  const {
    name, description, image, attributes,
  } = metadata;

  const imageUrl = safeUrl( image );

  const tokenData = {
    tokenId,
    tokenUri,
    name,
    description,
    attributes,
    image : imageUrl,
  };

  console.log( tokenData );

  return tokenData;
}



async function deleteDraft( item: FactoryItem ) {
  if( !item._delete ){
    item._delete = setTimeout( () => {
      window.clearTimeout( item._delete );
      delete item._delete;
    }, 2000 );

    return;
  }


  activeItem.value = null;
  items.value = items.value.filter( ( i ) => i._id !== item._id );

  try {
    const {
      data,
    } = await axios.request( {
      method : "delete",
      url    : `/api/tokens/drafts/${ item._id }`,
    } );

    // handle result
  } catch ( error: any ) {
    console.error( error );
    await openErrorModal( "Could not delete draft." );
    items.value.push( item );

    return;
  }
}


onMounted( async () => {
  await getFactoryContract();
  await openTab( tabs.value[0] );
  removeEventListener( "keydown", onKeyDown );
  addEventListener( "keydown", onKeyDown );
} );
onDeactivated( async () => {
  removeEventListener( "keydown", onKeyDown );
} );

function onKeyDown( e: KeyboardEvent ) {
  if( activeItem.value ){
    if ( e.code === "ArrowRight" ) {
      nextItem( +1 );
    }else
    if ( e.code === "ArrowLeft" ) {
      nextItem( -1 );
    }
  }
}

function openItem( item ){
  activeItem.value = item;
}

function nextItem( d = 1 ){
  if( !activeItem.value ){
    return;
  }

  const index = ( items.value.indexOf( activeItem.value ) + d );

  if( index < 0 ){
    return;
  }

  openItem(
    items.value[index % items.value.length]
  );
}

</script>
<template lang="pug">

div
  .bg-white.sticky-top.border-bottom.py-3
    .container
      .nav.nav-pills.nav-fill
        li.nav-item(
          v-for="(tab, t) in tabs",
          :key="tab.label"
        )
          a.nav-link(
            @click="openTab( tab )",
            :class="{ active: tab.label === activeTab?.label }"
          )
            span.pos-rel {{ tab.label }}
              .pos-abs.bottom.right.left.text-center(
                v-if="tab.busy"
              ).mb-n5
                .spinner-border.faded.text-secondary
                

  .bg-light.vh-100.py-4
    .container
      .row.g-3(v-if="activeTab?.items")
        template(v-for="(item, i) in activeTab?.items")
          .col-md-4.col-lg-2
            TokenCard(
              :value="item"
              :active="false"
              @open="activeItem = item"
            )



  Teleport(to="#modals")
    TokenModal(
      :activeItem="activeItem"
      @close="activeItem=null"
      @delete="deleteDraft(activeItem)"
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
.nav-tabs{
}
</style>
