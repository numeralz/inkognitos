<script lang="ts" setup>
import { getProvider } from "$/store/session";
import { BigNumber } from "@ethersproject/bignumber";
import jazzicon from "@metamask/jazzicon";
import { utils } from "ethers";
import { useClipboard } from "@vueuse/core";

const props = withDefaults( defineProps<{
  me?: string;
  address: string;
  noLabel?: boolean;
  size?: string;
  noCopy?: boolean;
  noProfile?: boolean;
  busy?: boolean;
}>(), {
  noLabel : false,
  size    : "2em",
  address : "",
  me      : "",
  noCopy  : false,
} );

const myAddress = computed( () => {
  return BigNumber.from( props.address ).eq( props.me || 0 );
} );

const ensName = asyncComputed( async () => {
  const provider = await getProvider();
  return provider.lookupAddress( props.address );
} );

const wrapper = ref<HTMLElement>();
const size = 32;
const name = ref( "" );

async function checkPicture( address:string ){
  try{
    const {
      data,
    } = await axios.request( {
      method : "GET",
      url    : `/api/users/${ address }`,
    } );

    console.log( data );
    
    return `/api/tokens/${ data.picture }/image`;
  } catch( error:any ){
    console.error( error );

    return "";
  }
}

let pic = $ref( "" );

async function updateAddress( address:string ){
  while ( wrapper.value?.firstChild ) {
    wrapper.value.removeChild( wrapper.value.firstChild );
  }

  if( !address ){
    return;
  }

  try {
    const n = parseInt(
      BigNumber.from( address ).toHexString().slice( 2, 10 ),
      16
    );

    const el = jazzicon( size, n ) as HTMLDivElement;
    const svg = <SVGElement>el.getElementsByTagName( "svg" )[0];

    svg.setAttribute( "viewBox", `0 0 ${ size } ${ size }` );
    svg.style.width = "100%";
    svg.style.height = "auto";
    el.style.width = "100%";
    el.style.height = "100%";
    wrapper.value?.appendChild( el );
  } catch ( error ) {
    //
  }

  try{
    const {
      data,
    } = await axios.request( {
      method : "GET",
      url    : `/api/users/${ address }/name`,
    } );

    name.value = data;
  } catch( error:any ){
    console.error( error );
  }
}

const {
  text, copy, copied, isSupported,
} = useClipboard( {
  source : props.address,
} );


onMounted( async () => {
  watch(
    ()=> props.address,
    async ( address, address0 ) => {
      await nextTick();
      pic = await checkPicture( address );
      await updateAddress( address );
    },
    {
      immediate : true,
    }
  );
} );


const tooltipConfig = computed( ()=>{
  if( !props.address || props.noCopy ){
    return {
      disabled : true,
    };
  }

  return {
    disabled : utils.isAddress( props.address || "" ) ? false : true,
    content  : copied.value ? "Copied!" : "Copy",
    triggers : [
      "hover", "click",
    ],
    hideTriggers : [
      "hover",
    ],
    delay : {
      show : 0,
      hide : copied.value ? 1000 : 100,
    },
    arrowPadding : "2rem",
    placement    : "bottom",
  };
} );

</script>

<template lang="pug">

//- div
.d-flex.align-items-center.g-2.flex-nowrap.row.justify-content-center
  div.col-auto(
    v-if="!props.address || !utils.isAddress(props.address)"
    title="Invalid address"
  ).faded: .square(
    :style="{'min-width': props.size}"
  )
    .inner.icon.border-light.flex-center.bg-light
    .spinner-border.pos-abs.top.left.right.bottom(
      v-if="busy"
    )
    
  div.col-auto(
    v-else-if="BigNumber.from(props.address).isZero()"
    title="Null Address"
  ): .square(
    :style="{'min-width': props.size}"
  )
    .inner.icon.bg-white.flex-center.border-light
      i.fa.fa-times.fa-2x.text-dark
    .spinner-border.pos-abs.top.left.right.bottom(
      v-if="busy"
    )

  template(v-else)
    .col-auto
      component(
        :title="BigNumber.from(props.address).toHexString()"
        :to="`/users/${props.address}`"
        :is="noProfile?'div':'RouterLink'"
      ): .square(
        :style="{'min-width': props.size}"
      )
        img.inner.icon(
          v-if="pic" :src="pic" @error="pic=null")
        .inner.icon(
          v-show="!pic" :class="[myAddress ? 'border-primary':'']" ref="wrapper")

        .spinner-border.pos-abs.top.left.right.bottom(
          v-if="busy"
        )

    .col-auto(v-if="$slots.prefix")
      slot(name="prefix")

    .col(
      v-if="!noLabel"
      v-tooltip="tooltipConfig"
      :title="BigNumber.from(props.address).toHexString()"
      @click="(e)=>{ if(props.noCopy){ return } copy(); e.preventDefault(); e.stopPropagation(); }"
    ).text-truncate
    
      template(v-if="name")
        strong {{name}}
      slot(v-else)
        .monospace.text-truncate(
          :style="[myAddress? 'font-weight:bold' : '']"
        ) {{ ensName || BigNumber.from(props.address).toHexString() }}


  //- .col-auto(v-if="$slots.default")
    slot

  .col-auto(v-if="$slots.suffix")
    slot(name="suffix")

  

</template>

<style lang="scss" scoped>
.outer{
  padding: 1px;
}
.icon {
  margin:0;
  padding:0;
  border-radius: 50%;
  border: 3px solid #FFF;
  background-color: #EEE;
  overflow: hidden;
  // line-height: 100%;
  box-shadow: $box-shadow;
}
</style>
