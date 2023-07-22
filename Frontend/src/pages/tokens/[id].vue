<script lang="ts" setup>
import ListGuard from "$/components/ListGuard.vue";
import { etherscanURL } from "$/lib/nav";
import { openErrorModal, timeAgo } from "$/lib/utils";
import { getCNC, lineFill } from "$/lib/Whiteboard";
import type { PathType } from "$/lib/Whiteboard";
import type { FactoryItem, Reaction } from "$/store/session";
import userStore, { CONTRACTS, getFactoryContract, getReactions, REACTIONS, sameAddress } from "$/store/session";
import { BigNumber } from "@ethersproject/bignumber";
import { useTimeAgo } from "@vueuse/core";
import { PaperOffset } from "paperjs-offset";


const VITE_BASE = import.meta.env.VITE_BASE;



// Props
// const props = withDefaults( defineProps<{
//   activeItem: FactoryItem | null;
// }>(), {
//   activeItem : null,
// } );

// const activeItem = TokenNFT.activeItem;
// Data
const activeItem = reactive<FactoryItem>( {
  tokenId      : "",
  ownerAddress : "",
} );

const isLoading = ref( false );

const {
  selectedAddress,
  user,
  hasSession,
} = userStore.getState();

const route = useRoute();

useHead( {
  title : ()=>`Inkognitos/${ activeItem.tokenId }`,
  meta  : [
    {
      name : "title", content : ()=>`Inkognitos/${ activeItem.tokenId }`,
    },
    {
      name : "image", content : ()=>`${ VITE_BASE }/api/tokens/${ activeItem.tokenId }/image`,
    },
    {
      property : "og:title", content : ()=>`Inkognitos/${ activeItem.tokenId }`,
    },
    {
      property : "og:image", content : ()=>`${ VITE_BASE }/api/tokens/${ activeItem.tokenId }/image`,
    },
  ],
} );

let svgUrl;

async function exportImage( type = "jpg" ){
  const paper = ( await import( "paper" ) ).default;
  const colorBlack = new paper.Color( "black" );

  // if(type==="cnc"){
  //   type = "svg"
  // }

  try{
    const {
      data:svg,
    } = await axios.request( {
      method : "GET",
      url    : `/api/tokens/${ activeItem.tokenId }/image`,
    } );
    
    const p = new paper.PaperScope();
    // console.log(svg);
    

    p.setup( new paper.Size( 1024, 1024 ) );
    // p.project.activate();

    const l = new paper.Layer();
    const circle = false;

    const bg = circle ? new paper.Shape.Circle( {
      insert    : true,
      position  : p.view.size.divide( 2 ),
      radius    : p.view.size.width / 2,
      fillColor : new paper.Color( {
        hue        : 0,
        saturation : 0,
        lightness  : 50,
      } ),
    } ) : new paper.Shape.Rectangle( {
      insert    : true,
      position  : p.view.size.divide( 2 ),
      size      : p.view.size,
      fillColor : new paper.Color( {
        hue        : 0,
        saturation : 0,
        lightness  : 50,
      } ),
    } );

    bg.sendToBack();
    
    const l1 = new paper.Layer();


    if( type === "cnc" ){

      const svgData = await getCNC(svg);
      
      var preface = "<?xml version=\"1.0\" standalone=\"no\"?>\n";
      var svgBlob = new Blob( [
        preface, svgData,
      ], {
        type : "image/svg+xml;charset=utf-8",
      } );

      const filename = window.prompt(
        "Save as:",
        `inkognitos-${ new Date().toISOString() }.svg`
      )?.replace( /(\.svg)?$/i, ".svg" );

      if ( !filename ) {
        return;
      }


      if ( svgUrl ) {
        URL.revokeObjectURL( svgUrl );
      }

      svgUrl = URL.createObjectURL( svgBlob );

      var downloadLink = document.createElement( "a" );

      downloadLink.href = svgUrl;
      downloadLink.download = filename;
      document.body.appendChild( downloadLink );
      downloadLink.click();
      document.body.removeChild( downloadLink );

      return;
    }

    l1.importSVG( svg );
    p.view.update();
    p.view.element.toBlob( ( blob ) => {
      if( !blob ) {
        return;
      }

      const url = URL.createObjectURL( blob );
      const a = document.createElement( "a" );

      a.setAttribute( "href", url );
      a.setAttribute( "download", `Inkognitos-${ activeItem.tokenId }.${ type }` );
      a.click();
      a.remove();
    }, type );
    p.view.remove();
    p.project.remove();
  } catch( error:any ){
    console.error( error );
  }
}

// Mounted
onMounted( async () => {
  isLoading.value = true;
  await userStore.start();
  await getReactions();


  const fCtx = await getFactoryContract();

  if ( route.params.id ) {
    try {
      const {
        data,
      } = await axios.request( {
        method : "get",
        url    : `/api/tokens/${ route.params.id }`,
      } );


      Object.assign( activeItem, data );
    } catch ( err ) {
      console.error( err );
    }
  }
  
  activeItem.createdAgo = activeItem.timeSaved ? useTimeAgo( activeItem.timeSaved ) : "some time ago";
  ( async()=>{
    if( activeItem.tokenId ){
      activeItem.ownerAddress = ( await fCtx.callStatic.ownerOf( activeItem.tokenId ) ).toString();
    }
  } )().then();
  //
  isLoading.value = false;
} );


// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

const COMMENT_MAX_LENGTH = 128;

async function submitComment( token: FactoryItem ) {
  const message = ( newPost.message ).toLowerCase().trim();

  if ( !message ) {
    return;
  }
  
  const comment = reactive( {
    userAddress : user.value?.address,
    message,
    _loading    : true,
    _signed     : false,
  } );

  if( message.length > COMMENT_MAX_LENGTH ){
    openErrorModal( "Comment is too long" );

    return;
  }

  token.comments?.push( comment );
  newPost.message = "";

  try {
    const signed = await userStore.signData( [
      [
        "tokenId", "uint256", token.tokenId,
      ],
      [
        "messageHash", "hash", message,
      ],
      [
        "timestamp", "uint256", Date.now(),
      ],
    ] );

    comment._signed = true;

    const {
      data,
    } = await axios.request( {
      method : "post",
      url    : `/api/tokens/${ token._id }/comment`,
      data   : {
        text : message,
        signed,
      },
    } );

    Object.assign( comment, {
      ...data,
      _loading : false,
    } );
    newPost.message = "";
  } catch ( error: any ) {
    console.error( error );
    newPost.message = comment.message || "";
    token.comments?.splice(
      token.comments.indexOf( comment ),
      1
    );
  }
}


async function submitReaction( token: FactoryItem, reaction: Reaction ) {
  // if ( !token.reactions ) {
  //   token.reactions = [];
  // }
  if( token.alreadyReacted ){
    return;
  }

  reaction._loading = true;

  try {
    const signed = await userStore.signData( [
      [
        "tokenId", "uint256", token.tokenId,
      ],
      [
        "emoji", "string", reaction.emoji,
      ],
      [
        "timestamp", "uint256", Date.now(),
      ],
    ] );

    const {
      data,
    } = await axios.request( {
      method : "post",
      url    : `/api/tokens/${ token._id }/react`,
      data   : {
        signed,
      },
    } );

    token.reactionCounts = data.reactionCounts;
  } catch ( error: any ) {
    console.error( error );
  }

  reaction._loading = false;
}



const newPost = reactive<{
  message: string,
  reaction: string,
  messageLen: number,
  _errors: Record<string, string>,
}>( {
  message    : "",
  messageLen : 0,
  reaction   : "",
  _errors    : {},
} );


async function remixItem( item: FactoryItem ) {
  try {
    const {
      data: newTokenId,
    } = await axios.request( {
      method : "post",
      url    : `/api/tokens/${ item._id }/remix`,
    } );

    window.open( `/artboard/?id=${ newTokenId }`, "_blank" );
  } catch ( error: any ) {
    console.error( error );
  }
}

async function burnToken( item: FactoryItem ){
  if( !item.tokenId ) {
    return;
  }
          
  const factory = await getFactoryContract();
  const estGas = await factory.estimateGas.burn( item.tokenId, {} );

  console.log( `Est.gas ${ estGas.toString() }` );
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


</script>

<route lang="yaml">
meta:
  layout: default
  hideFooter: true
  hideNavbar: false
</route>
<template lang="pug">


.bg-light.py-4
  .container
    .pos-rel(v-if="isLoading")
      .py-3.striped-dark.animated.appear.pos-abs.top.w-100
      
    .row.g-3(v-else-if="activeItem?.tokenId")
      .col
        .sticky-top(style="z-index: 1; top: 8em;")
          .row.align-items-center.g-2
            .col-auto
              RouterLink.btn.btn-white.border(
                :to="`/tokens`"
              )
                i.fa.fa-fw.fa-chevron-left
                span.d-none.d-md-inline Gallery

            .col-auto
              .bg-blur.p-1.rounded
                h4.monospace.m-0
                  span.d-none.d-md-inline Token #
                  span {{ activeItem.tokenId }}
            .col
            .col-auto(
              v-if="user?.address && activeItem?.ownerAddress && BigNumber.from(activeItem.ownerAddress).eq( user?.address || 0 )"
            ).appear
              .btn.btn-outline-danger(
                @click.stop="burnToken(activeItem)"
              )
                span.d-none.d-md-inline Burn
                i.fa.fa-fw.fa-fire
                
            .col-auto.appear(
              v-if="user?.address"
            )
              .btn.btn-white.border(
                @click="remixItem(activeItem)"
              )
                span.d-none.d-md-inline Remix
                i.fa.fa-fw.fa-shuffle
                
        .card.mt-3
          .square.bg-light1.card-body(
              v-if="activeItem"
            )
              LoadImage.no-select.inner(:src="`/api/tokens/${activeItem._id}/image`")
            


          .card-body.bg-light1.border-top(
            v-if="activeItem.reactionCounts && Object.values(activeItem.reactionCounts).length"
          )
            .row.flex-nowrap
              .col
                .row.g-2.flex-nowrap
                  .col-auto(
                    v-for="[name, count] in Object.entries(activeItem.reactionCounts).sort( (a,b)=> (b[1] - a[1]) )"
                  ).pos-rel
                    .btn.btn-white.rounded-circle.border.shadow-sm(
                      :style="`width:1.618em; height:1.618em; font-size: 2rem;`",
                    ).flex-center
                      span {{ REACTIONS[ name ]?.emoji }}
                    strong.monospace.bg-white.rounded-pill.px-1.mb-n2.pos-abs.bottom.right(
                      v-if="activeItem.reactionCounts?.[ name ] && count > 1"
                    ) {{ count }}

          .card-footer.p-3
            ShareButtons(
              :url="`${VITE_BASE}/api/tokens/${activeItem.tokenId}/image`"
              :media="`${VITE_BASE}/api/tokens/${activeItem.tokenId}/image`"
              :title="`Inkognitos #${activeItem.tokenId}`"
              twitterUser="InkognitosWorld"
              hashtags="art,svg"
            ).justify-content-around


        .row.g-3(v-if="activeItem.comments").py-3
          .col-12
            .list-group
              template(
                v-for="comment in activeItem.comments"
              )
                .comment.list-group-item(
                  :class="{loading: comment._loading}"
                ).pos-rel
                  .row.g-3.align-items-center
                    .col-auto.stack
                      JazzIcon(
                        :address="comment.userAddress"
                        size="2rem"
                        noLabel
                      ).layer.m-n1
                      .spinner-border(v-if="comment._loading").layer
                      

                    .col
                      div.pre {{ comment.message }}


                    .col-auto
                      small.faded {{ timeAgo( comment.createdAt ) }}

                    //- .pos-abs.right.top.bottom.col-auto

              template(v-if="!selectedAddress")
                .list-group-item.bg-light2.flex-center.striped-dark
                  AuthStatus

              template(v-else)
                .list-group-item.bg-light2.p-2
                  .row.g-2
                    .col-12
                      .row.g-3
                        .col-auto.flex-center.d-none.d-lg-flex
                          JazzIcon(
                            :address="selectedAddress"
                            size="2rem"
                            noLabel
                          )
                        .col
                          .form-floating
                            textarea.form-control.bg-white.border-0(
                              placeholder="Write"
                              v-model="newPost.message"
                              :class="{ 'is-invalid': ( newPost.message.length>COMMENT_MAX_LENGTH ) }"
                              @keydown.enter="($) => { \
                                if (!$.shiftKey) { \
                                  submitComment(activeItem); \
                                  $.preventDefault(); \
                                  return; \
                                } \
                              }"
                            )
                            
                            .badge.bg-white.m-1.pos-abs.bottom.right(
                              :class="{ 'text-danger': ( newPost.message.length>COMMENT_MAX_LENGTH ) }"
                            ) {{ newPost.message.length }}/{{COMMENT_MAX_LENGTH}}
                            label Write a comment...

                        .col-auto.d-none.d-lg-flex
                          button.btn.btn-light.h-100.d-flex.align-items-center.h-100(
                            @click="if (activeItem) { submitComment(activeItem); };"
                          )
                            div #[i.fa.fa-paper-plane]

                  //- .row.ms-auto.faded.py-3
                    .col-auto
                      small.text-muted #[kbd.bg-light.me-2 #[i.fa.fa-arrow-turn-down.fa-rotate-90]] Post Message
                    .col-auto
                      small.text-muted #[kbd.bg-light.me-2 Shift #[i.fa.fa-arrow-turn-down.fa-rotate-90]] New Line

      .col-12.col-lg-3.col-md-4.pos-rel(
        style="min-width: 6rem;"
      ).order-1
        .sticky-top(style="z-index: 1; top: 5em;")
          .row.g-4
            //- ALready reacted
            .col-12(v-if="activeItem?.alreadyReacted").appear
              .row.align-items-center
                .col
                  div You reacted
                  small #[i {{ timeAgo(activeItem.alreadyReacted?.createdAt) }}]
                .col-auto
                  h1.m-0 {{ activeItem?.alreadyReacted.name }}
              hr.m-0

            //- Reaction menu
            .col-12
              .row.g-2.flex-fill.justify-content-around.align-items-center
                template(
                  v-for="( [key,r], i ) in Object.entries(REACTIONS)"
                )
                  .col.col-md-4(
                    style="min-width: 2rem; max-width: 6rem;"
                  )
                    .square.w-100(
                      @click="submitReaction(activeItem, REACTIONS[key])"
                      :class="{pointer: !activeItem?.alreadyReacted, faded: activeItem?.alreadyReacted && (activeItem?.alreadyReacted.name !== r.emoji) }"
                    ).no-select
                      .inner.avatar.avatar-xl
                        .pos-abs.top(
                          v-if="r._loading"
                          style="border-width: 4px"
                        ).spinner-border.w-100.h-100

                        .avatar-img.rounded-4 {{ r.emoji }}

                        .badge(
                          v-if="activeItem.reactionCounts?.[ r.emoji ]"
                        ) {{ activeItem.reactionCounts?.[ r.emoji ] }}

              
            .col-12(
              v-if="activeItem?.inkTokensUsed"
              :style="`--delay: ${ 1.5 + 0.1 }`"
            ).d-none.d-lg-block.appear
              .card.bg-light1
                .card-block
                  TokenMaterials(
                    :value="activeItem"
                  ).mb-1
            .col-12
              h6 Export
              .row.g-2
                //- v-if="user?.isAdmin || sameAddress(activeItem.userAddress, user?.address)"
                .col: .btn.btn-primary.w-100(@click="exportImage('png')") #[i.fa.fa-fw.fa-image] Export PNG
                .col: .btn.btn-primary.w-100(@click="exportImage('jpg')") #[i.fa.fa-fw.fa-image] Export JPEG
                .col: .btn.btn-primary.w-100(@click="exportImage('cnc')") #[i.fa.fa-fw.fa-image] Export CNC
            .col-12
              FetchData(
                :url="`/api/tokens/${ activeItem._id }/remixes`"
              )
                template(#default="{data}")
                  ListGuard(:items="data?.items")
                    template(#emptyText)
                      .alert.alert-light No Remixes
                    h6 {{data?.items?.length}} Remixes
                    .row
                      .col-3(v-for="remix in data?.items")
                        TokenCard(
                          :value="remix"
                          @open=" $router.push({path: `/tokens/${ remix.tokenId || remix._id }`}) "
                        )


            .col-12.appear(:style="`--delay: ${ 1.5 + 0.2 }`")
              .list-group.list-group-flush
                .list-group-item.px-0.bg-transparent
                  h6 Published #[span.text-muted {{ activeItem.createdAgo }}] by:
                  JazzIcon(
                    :address="activeItem?.userAddress"
                    :me="user?.address"
                    size="2rem"
                  ).py-2

                .list-group-item.px-0.bg-transparent(
                  v-if="activeItem?.ownerAddress && !sameAddress(activeItem?.ownerAddress, activeItem?.userAddress)"
                )
                  small Owner
                  JazzIcon(
                    :address="activeItem?.ownerAddress"
                    :me="user?.address"
                    size="2rem"
                  ).py-2


            .col-12(
              v-if="(activeItem.tokenId ?? false)"
              :style="`--delay: ${ 1.5 + 0.3 }`"
            ).appear
              .card
                .btn-group.w-100
                  a.btn.bg-white.py-2(
                    :href="etherscanURL('token', { tokenId: activeItem.tokenId, contract: CONTRACTS.InkognitosNFT?.address + '' })",
                    target="_blank"
                  )
                    img(
                      src="https://etherscan.com/images/favicon3.ico",
                      style="width: 1.5em; filter: contrast(2)"
                    )

                  a.btn.bg-white.py-2(
                    :href="`https://opensea.io/assets/ethereum/${ CONTRACTS.InkognitosNFT?.address }/${ activeItem?.tokenId }`",
                    target="_blank",
                  )
                    img(
                      src="https://opensea.io/static/images/logos/opensea.svg",
                      style="width: 1.5em; filter: contrast(2)"
                    )
            

                  a.btn.bg-white.py-2(
                    :href="`https://looksrare.org/collections/${ CONTRACTS.InkognitosNFT?.address }/${ activeItem?.tokenId }`",
                    target="_blank",
                  )
                    img(
                      src="https://etherscan.io/images/svg/brands/looksrare-black.svg",
                      style="width: 1.5em; filter: contrast(2)"
                    )
            


</template>
<style lang="scss" scoped>

.comment{
  &.loading{
    opacity: 0.5;
    filter: grayscale(50%);
  }
}

textarea{
  &:focus{
    min-height: 8rem;
  }
}

.pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.reaction-icon {
  filter: brightness(0.95) saturate(0.5);
  font-size: 1rem;
  width: 4em;
  height: 4em;
  transition: all .5s ease;

  &:hover {
    border-width: 1rem;
    transform: scale(1.2);
    filter: brightness(1) saturate(1);
  }
}
</style>
