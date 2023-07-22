<script lang="ts" setup>

import { getPhase } from "$/lib/constants";
import { setMeta } from "$/lib/meta";
import userStore from "$/store/session";

setMeta( {
  title       : "Inkognito - Decent Factory",
  description : "A community-drawn NFT collection.",
  image       : "https://inkognitos.decentfactory.xyz/default.jpg",
  keywords    : "nft collection, diy nft, draw your own nft",
  url         : "https://inkognitos.decentfactory.xyz",
} );

const CONTRACTS = ref<Record<string, {address:string, abi:any}>>( {} );

const {
  inkColors,
} = userStore.getState();

onMounted( async () => {
  await userStore.start();

  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/contracts`,
    } );

    // handle result
    CONTRACTS.value = data;
  } catch( error:any ){
    console.error( error );
  }
} );

const {
  mintFormOpen,
} = userStore.getState();

function randomBg(){
  if( Math.random() > 0.5 ){
    return "transparent";
  }

  return `hsl(230,10%,${ 100 * ( ( Math.round( Math.random() * 5 ) + 2 ) / 7 ) }%)`;
}

const images = [
  {
    bgColor : randomBg(), src : "/landing/image.svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (1).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (2).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (3).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (4).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (5).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (6).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (7).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (8).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (9).svg",
  },
  {
    bgColor : randomBg(), src : "/landing/image (10).svg",
  },
];

const randomImages = images.sort( ( a, b )=>{
  return Math.sign( Math.random() - 0.5 );
} );

async function updateInk(){
  await userStore.loadInkColors();
  await userStore.loadInkBalances();
}


let c = 0;


const videos = [
  "/landing/sample-A.mp4",
  "/landing/sample-B.mp4",
  "/landing/sample-C.mp4",
];

const activeVideoIndex = ref( 0 );

function playNext( e:Event ){
  activeVideoIndex.value = ( activeVideoIndex.value + 1 ) % videos.length;
  ( <HTMLVideoElement>e.target ).play();
}


</script>


<template lang="pug">


mixin numero(n)
  svg( xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"  ).overflow-visible.pos-abs
    - var w = 50;
    g(transform=`translate(-40,20) rotate(${(Math.random()-0.5)*10})` opacity="1")
      rect( x=(-w/2) y=(-w/2) width=w height=w fill="#FFFFFF" stroke="#000" stroke-width="2" rx=10 ry=10)
      text( x="0" y="2" fill="#000" font-size="30" text-anchor="middle" alignment-baseline="middle" )= n

div
  .bg-light.px-lg-6
    .container
      .stack
        .row.g-0.align-items-center.layer
          template(
            v-for="(image,i) in images.slice(0,9)"
          )
            .col-6.col-lg-4
              .square(
                :class="[i>3 ? 'd-none d-lg-block' : '', (i==3 || i===0)?'col-12':'' ]"
                :style="{'background-color':image.bgColor}"
              )
                template(v-if="i===4")
                  video.inner(autoplay muted playsinline @ended="e=>playNext(e)" @click="e=>playNext(e)" :src="videos[activeVideoIndex]" ).w-100
                    source(type="video/webm" :src="videos[activeVideoIndex]")

                template(v-else-if="i===0")
                  .inner.flex-center.bg-white
                    div.p-4.bg-white
                      svg( xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 250 70" ).w-100
                        text( font-family="Chau Philomene One" x=0 y=50 width="120" fill="#000" font-size="50" text-anchor="right" alignment-baseline="baseline") Inkognitos
                        text( font-family="Chau Philomene One" x=120 y=60 fill="#000" font-size="12" text-anchor="right" alignment-baseline="baseline") by decentfactory
                      p.lead A collaborative NFT character factory.


                .inner(v-else-if="i===3").w-100.h-100.bg-white
                  .p-1.bg-white.h-100.flex-center
                    CountDown.h3(:to="getPhase('ink')?.date", labels).w-100
                      template(#default)
                        .d-flex.justify-content-between.nowrap.align-items-center
                          h5.mx-2 INK Sale
                          h5.mx-2.monospace #[RenderDate(:value="getPhase('ink')?.date")]
                        hr.my-2
                      template(#done)
                        a.btn.btn-black.px-4.rounded-pill(@click="mintFormOpen=true")
                          h2.m-0 Get INK #[i.fa.fa-arrow-right]

                template(v-else)
                  img.inner(:style="`--delay:${0.2*i}s`" :src="image.src")

  .section.bg-light1
    .container
              
      .row.g-3
        .col-lg
          .card.shadow-lg.h-100
            .row.g-0.align-items-center.h-100
              .col-4
                .square
                  .inner(:style="`background-image:url('${images[1]?.src}')`").appear.bg-zoom.bg-cover
              .col
                .card-body
                  .display-4 Inkognitos
                  p A crowd-created NFT collection, hand-drawn by the community.
                  p Draw a character for the collection, and earn 5% of secondary market sales forever.

                  //- RouterLink.btn.btn-outline-secondary.btn-lg.disabled.faded(to="/artboard" target="_blank") Studio #[i.fa.fa-arrow-right]
        .col-lg
          .card.shadow-lg.h-100
            .row.g-2.align-items-center.h-100
              .col-4
                .square
                  .inner(style="background-image: url(/landing/ink.svg)").appear.bg-zoom.bg-cover
              .col
                .card-body
                  .display-4 Ink
                  p Convertible utility token, that must be burned to create Inkognitos.

                  //- a.btn.btn-success.btn-lg(@click="mintFormOpen=true") INK Shop #[i.fa.fa-store]
        .col-12
          RouterLink(to="/info").btn.btn-primary.btn-lg Read More

  
  //- .bg-secondary
    .mb-n3.text-white.overflow-y-hidden
      div(style="overflow-x:auto").pb-4
        .container
          .row.g-3.flex-nowrap
            .col-lg-6
              .card.h-100
                .card-header.bg-info
                  h4.m-0 Phase One
                  p.display-4 #[strong.cursive Materials]

                .card-body.px-4.text-info
                  p.lead Get INK, which is the energy of thoughts, dreams, and ideas.
                  ulF
                    li INK is minted as #[strong bottles of 100 INK]
                    li Prices starting at #[strong Ξ 0.001] per bottle.
                    li INK comes in a several colors.
                    li Unused tokens can be sold on OpenSea, LooksRare, Rarible.
                        
                .card-footer.striped-dark.bg-white
                  CountDown.display-3(:to="getPhase('ink')?.date", labels)
                    template(#done)
                      a.btn.btn-black.px-4.rounded-pill(@click="mintFormOpen=true")
                        h2.m-0 Load up on INK #[i.fa.fa-arrow-right]

            .col-lg-6
              .card.h-100
                .card-header.bg-warning
                  h4.m-0 Phase Two
                  p.display-4 #[strong.cursive Submissions]

                .card-body.px-4.text-warning
                  p.lead Publish NFT tokens using INK
                  ul
                    li Drawn using the studio, using INK which gets burned to mint the NFT.
                    li Amount of INK used is counted and signed by our off-chain verification server.
                    li Like any ERC-721 NFT, they can be freely traded on NFT marketplaces.
                    li Submissions will be held in a secret vault until the reveal date.

                .card-footer.striped-dark.bg-white
                  CountDown.display-3(:to="getPhase('factory')?.date", labels)
                    template(#done)
                      RouterLink.btn.btn-black.px-4.rounded-pill(to="/artboard" target="_blank")
                        h2.m-0 Create

            .col-lg-6
              .card.h-100
                .card-header.bg-dark
                  h4.m-0 Phase Three
                  p.display-4 #[strong.cursive The Contest]

                  
                .card-body.px-4.text-dark
                  .lead We will


                .card-footer.bg-white.text-dark
                  h4.text-center Categories
                  .row.g-2
                    .col-4.col-sm-3.col-md-2(
                      v-for="item in CATEGORIES"
                    ).pos-rel.text-dark
                      .card.text-center.overflow-hidden.nowrap
                        .card-body.square
                          .inner.d-flex.justify-content-center.align-items-center
                            .display-1 {{ item.icon }}
                        .py-1.card-footer.w-100: strong {{ item.name }}
                
                

  //- .section.bg-white(v-if="Object.entries(CONTRACTS).length")
    .container
      .row.g-4
        .col-md-auto
          .display-2.faded Contracts
        .col-lg-auto
          .list-group.shadow-lg.border.border-dark
            .list-group-item(
              v-for="([name, c], i) in Object.entries(CONTRACTS)"
            ).p-3
              .row.g-1.align-items-center(
                @click="Object.assign(c, {_expanded: !c._expanded})"
              )
                .col-5
                  h5.m-0 {{ name }}
                .col.overflow-hidden
                  a.btn.btn-light.w-100(
                    :href="`https://etherscan.io/address/${c.address}`"
                    @click.stop=""
                    target="_blank"
                  ).d-flex
                    img(
                      src="https://etherscan.com/images/favicon3.ico",
                      style="width: 1.5em; filter: contrast(2)"
                    )
                    span.mx-2.monospace.text-overflow {{ c.address }}
                    span #[i.fa.fa-external-link]

              .py-3(v-if="c._expanded")
                RenderABI(:abi="c.abi")
                

  .bg-dark.section.shadow-lg
    .container.py-4
      .row.align-items-center.g-3.text-center
        .col-12.mx-auto
          h1 decentfactory
          p On-chain collaborative workspaces for the digital age.
          
        .col-auto.mx-auto
          SocialIcons.mx-auto.display-1

        //- .col
          h4 Become a Mod
          p We recognize and reward exceptional participation. We know your time is valuable, so when we see you actively engaging with the community, helping on-board new users, provide helpful feedback to our team, we are compelled to compensate you for your effort.
          BetaForm



</template>
<style lang="scss" scoped>

.gray1{
  background-color: #808185;
}
.orange{
  background-color: #E06E3A;
}
.gray2{
  background-color: #808185;
}


</style>
