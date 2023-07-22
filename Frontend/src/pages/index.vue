<script lang="ts" setup>

import { openErrorModal, parseErrorMessage } from "$/lib/utils";
import userStore, { getPassContract, getSigner, sameAddress } from "$/store/session";
import { useAsyncState } from "@vueuse/core";
// import "swiper/css";
// import "swiper/css/pagination";

// const router = useRouter();
const route = useRoute();

const {
  user,
  selectedAddress,
  mintFormOpen,
} = userStore.getState();

const props = withDefaults( defineProps<{
  code?: string
}>(), {} );


const {
  state: havePass,
  execute: checkPass,
} = useAsyncState( async () => {
  return await hasPass();
}, false );

onMounted(  async () => {
  if( typeof window !== "undefined" ) {
    const studio = await getPassContract();
    const base64String = await studio!.tokenURI( 0 );

    console.log( {
      base64String,
    } );

    const jsonString = window.atob( base64String.split( "," )[1] );
    const metadata = JSON.parse( jsonString );

    console.log( {
      jsonString,
      metadata,
    } );
  }



  watch( ()=>user.value?.picture, ( pic )=>{
    route.meta.hideNavbar = !pic;
  } );

  // alert( JSON.stringify( route.params ) );
  if( props.code ){
    console.log( props.code );
  }

  await checkPass();

  const checker = setInterval( async () => {
    await checkPass();

    if( havePass.value ){
      clearInterval( checker );
    }
  }, 1000 );
} );


const ideas = [
  "get REKD",
  "stay away",
  "didn't happen",
  "maximum regret",
  "FOMO for days",
  "walk planks",
  "kick rocks",
  "be relatively inconvenienced",
];

let randomInconvenience = ideas[ideas.length * Math.random() | 0];

async function hasPass(){
  const studio = await getPassContract();
  return !( await studio?.balanceOf( selectedAddress.value ) )?.isZero();
}


async function getPass(){
  const signer  = await getSigner();

  if( !signer ){
    return;
  }

  const studio = ( await getPassContract() )?.connect( signer );

  if( !studio ){
    return;
  }

  if( havePass.value  ){
    await openErrorModal( "Hold on!", "You already have a pass" );

    return;
  }

  // console.log( studio );
  // console.log( await studio.mintPrice() );
  
  try {
    await ( await studio.mint( {
      value : await studio.mintPrice(),
    } ) ).wait();
    await openErrorModal( "Success", "Your mint was successful." );
  }catch( err ){
    const err_ = parseErrorMessage( err );

    await openErrorModal( "Problem", err_ || JSON.stringify( err ) );
  }

  showPassModal.value = false;
  console.log( studio );
}

const newName = ref( "" );

async function setName(){
  // user.value.name = newName.value;

  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/me/name`,
      data   : {
        name : newName.value,
      },
    } );

    user.value!.name = data;
  } catch( error:any ){
    console.error( error );
  }
}

const showPassModal = ref( false );

</script>
<route lang="yaml">
meta:
  layout: default
  hideFooter: false
  # hideNavbar: true
</route>
<template lang="pug">

div
  .bg-cover(
    :style="{ 'background-image': `url(/img/front.svg)`}"
  )
    main.d-flex.align-items-center.no-select.pointer-events-none
      .container
        .row.g-4
          .col-12.col-lg-8.mx-auto
            .card.rounded-5.bg-white.border-0.overflow-hidden.pos-rel
              .card-body.overflow-hidden.pos-rel.py-4
                .square
                  Draw.inner
                    .d-flex.align-items-center.justify-content-center.h-100.text-dark.no-select.pointer-events-none
                      .div.text-center
                        SVG(src="/img/logoink.svg").w-100.mx-auto
                        hr
                        h2 Web3 Illustration Metaspace

              .card-body.text-center.border-top.striped-dark.py-4
                .row
                  .col: RouterLink.btn.btn-white.border.btn-lg(to="/tokens").w-100.shadow.py-4
                    h2.m-0 #[i.fa.fa-fw.fa-compass] Explore
                  .col: RouterLink.btn.btn-white.border.btn-lg(to="/artboard").w-100.shadow.py-4
                    h2.m-0 Draw #[i.fa.fa-fw.fa-pen-fancy]

              //- .card-footer.py-4.text-center
                .btn.btn-primary(@click="showPassModal=true") Studio Pass
                
              .card-footer.py-4
                h2: SocialIcons.justify-content-around


            //- .card.bg-white.border-0.text-dark
              .card-header.py-3
                AuthStatus(
                  label
                )
              template(v-if="user?.address && sameAddress(user?.address, selectedAddress)")
                .card-body.text-center
                  

                .card-footer.p-4.text-center
                  template(v-if="!user?.name")
                    h5 1. Choose your name
                    form(@submit.prevent="setName")
                      .input-group
                        input.form-control(v-model="newName")
                        button.btn.btn-primary #[i.fa.fa-check]

                  template(v-else-if="!user?.picture")
                    h5 Welcome, {{user?.name}}
                    RouterLink(to="/artboard").btn.btn-outline-primary.btn-lg Draw your persona #[i.fa.fa-chevron-right]


                  .card.shadow.bg-gradient-info.border-0(v-else).w-auto.mx-auto.d-inline-block
                    .card-body
                      h5.mb-3 Welcome, {{user?.name}}!
                      RouterLink(to="/tokens").btn.btn-primary.btn-lg Enter #[i.fa.fa-arrow-right]



  .section.bg-primary.text-white.border-top.border-white
    .container
      .row.align-items-center
        .col
          .display-1.card-title On-chain Illustration
          hr
          p.lead SVG is such a versatile image format, the world is your canvas.
          p Unlike pixel-based raster formats, SVG vector images are #[em pristine] at any scale, and can be easily exported to the real-world:
          ul
            li CNC Machining
            li Laser cutting
            li Embroidery
            li Stickers &amp; Stencils
            li Tattoos
        .col-4.d-none.d-md-block
          .square
            video.inner(
              src="/landing/sample-A.mp4"
              autoplay muted loop
            ).w-100

                    
  .section.bg-light.border-top.border-white
    .container
      .row.align-items-center.g-5
        .col.order-1
          .display-1.card-title Be Treated like Royalty
          hr
          .lead Keep 66% of secondary market royalties. The leftovers are re-invested back into the platform for maintenance and improvement.
          p We're inventing a bright future where sustainable digital collaboration thrives.
        .col-4.d-none.d-md-block
          .square
            video.inner(
              src="/landing/sample-B.mp4"
              autoplay muted loop
            ).w-100


  .section.bg-danger.text-white.border-top.border-white
    .container
      .row.align-items-center.g-5
        .col
          .display-1.card-title Love is Real
          hr
          .lead Nothing is more rewarding than watching your fans find inspiration and utility from your creative expression.
          p When others use your designs in the real world, your work transitions into the timeless domain.
        .col-4.d-none.d-md-block
          .square
            video.inner(
              src="/landing/sample-C.mp4"
              autoplay muted loop
            ).w-100

          
  //- .section.bg-info.border-top.border-white
    .container
      .row.align-items-center.g-5
        .col.order-1
          .display-1.card-title Social Rewards
          hr
          .lead Nothing is more rewarding than interacting with your fans.
        .col
          .square
        
.border-top.border-white

</template>
<style lang="scss">

html,
body {
  position: relative;
  height: 100%;
}

// #app { height: 100% }

// body {
//   background: #eee;
//   font-family: Helvetica Neue, Helvetica, Arial, sans-serif;
//   font-size: 14px;
//   color: #000;
//   margin: 0;
//   padding: 0;
// }
</style>
<style lang="scss" scoped>
// main{
//   position: relative;
//   height: 100vh;
// }

.bg-cover{
  min-height: 100vh;
  padding: 4rem 0;
}

:deep(){
  &.swiper{
    height: 100%;
    width: 100%;
  }

  &.swiper-slide {
    // .row{
    //   width: 100%;
    //   align-items: center;
    // }
    // padding: 3rem;
    overflow-y:hidden;
    &:nth-child(1){
      background: $light1;
    }
    &:nth-child(2){
      background: $light2;
    }
    &:nth-child(3){
      background: $light;
    }
    height: 100%;
    width: 100%;
    // text-align: center;
    font-size: 18px;
    border-bottom: 1px solid #000;

    /* Center slide text vertically */
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    user-select: none;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    -webkit-justify-content: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    -webkit-align-items: center;
    align-items: center;
  }

}


</style>
