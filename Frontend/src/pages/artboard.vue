<script lang="ts" setup>
import type { InkognitosNFT } from "$/../typechain";
import { INK_FACTOR } from "$/lib/constants";
import { openErrorModal, parseErrorMessage } from "$/lib/utils";
import type { FactoryItem, InkToken } from "$/store/session";
import userStore, { CONTRACTS, getFactoryContract, getInkContract, getPassContract, getSigner, sameAddress } from "$/store/session";
import { useAsyncState } from "@vueuse/core";
import axios from "axios";
import * as paper from "paper";

const log = console.log;



async function fullscreen() {
  const elem = pageDiv.value as HTMLElement | any;

  if ( elem.requestFullscreen ) {
    elem.requestFullscreen();
  } else if ( elem.webkitRequestFullscreen ) {
    /* Safari */
    elem.webkitRequestFullscreen();
  } else if ( elem.msRequestFullscreen ) {
    /* IE11 */
    elem.msRequestFullscreen();
  }
}

const router = useRouter();
const route = useRoute();
const studio = ref();
const activeItem = reactive<FactoryItem>( {} );

// const inkSpendApproved = ref( false );
const inkSpendable = reactive( {
  value   : false,
  loading : false,
} );

const {
  mintFormOpen,
  selectedAddress,
  user, hasSession,
  inkColors,
  provider,
  isMobile,
} = userStore.getState();

const saveStatus = reactive( {
  isModified : false,
  isSaving   : false,
  error      : "",
} );

const pageDiv = ref<HTMLElement>();
const headerDiv = ref<HTMLElement>();

const publishState = reactive( {
  isLoading         : false,
  isOpen            : false,
  missingInk        : false,
  missingInkLoading : false,
  publishLoading    : false,
  isDone            : false,
} );

async function nextStep() {
  const $Factory = await getFactoryContract();

  // if( !activeItem?.permit ){
  // }

  await getPermit();
  await ensureInkSpendable();

  try {
    const permit = activeItem.permit as InkognitosNFT.SubmitPermitStruct;
    const signature = activeItem.permitSignature as string;

    console.log( {
      permit, signature,
    } );
    publishState.publishLoading = true;

    // const gas = await $Factory.estimateGas.mint( permit, signature );

    // console.log( gas );
    console.log( {
      permit,
      signature,
    } );

    const txn = await $Factory?.mint( permit, signature );

    if( !txn ) {
      return;
    }

    await txn.wait();
    publishState.isDone = true;
    await openErrorModal(
      "Success",
      "A new token was succefully minted. You are its initial owner and creator.",
      [
        {
          text : "New Canvas",
          action() {
            window.location.href = `/artboard`;
          },
          clas : "btn-outline-primary align-self-start",
        },
        {
          text : "View Token",
          action() {
            window.location.href = `/tokens/${ activeItem!.tokenId || activeItem!._id }`;
          },
          clas : "btn-outline-primary",
        },
        {
          text : "Gallery",
          action() {
            window.location.href = `/tokens/`;
          },
          clas : "btn-primary",
        },
      ]
    );
  } catch ( err: any ) {
    await openErrorModal( "Mint Failed", parseErrorMessage( err ) );
  }

  publishState.publishLoading = false;
  await startPublish( false );
}

async function loadDraft( id: string ) {
  if ( !id ) {
    return null;
  }

  saveStatus.isSaving = true;

  const {
    data,
  } = await axios.request( {
    method : "GET",
    url    : `/api/tokens/drafts/${ id }?t=${ Date.now() }`,
  } );

  Object.assign( activeItem, data );
  console.log( activeItem );

  const {
    data: svg,
  } = await axios.request( {
    method : "GET",
    url    : `/api/tokens/${ id }/image?t=${ Date.now() }`,
  } );

  saveStatus.isModified = false;
  saveStatus.isSaving = false;
  await studio.value?.w.loadSvg( svg );
}

/*
-------------------------------------
Save Draft
-------------------------------------
*/

async function getPermit() {
  try {
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/tokens/drafts/permit?t=${ Date.now() }`,
      data   : {
        id : activeItem?._id,
      },
      timeout : 8000,
    } );

    console.log( {
      data,
    } );
    Object.assign( activeItem, data );

    if ( activeItem.permit?.inkIds ) {
      activeItem.inkTokensUsed =
        Object.values( activeItem.permit?.inkIds )
        .reduce( ( $, inkId, index ) => {
          if ( !inkId ) {
            return $;
          }

          $[ inkId ] = Number( activeItem.permit?.inkQtys[ index ] );

          return $;
        }, {} as Record<string, number> ) as Record<string, number>;
    }

    console.log( activeItem.inkTokensUsed );
  } catch ( err: any ) {
    await openErrorModal( "Permit Issue", err.message );
  }
}

async function saveDraft() {
  const json = await studio.value?.w.exportJSON();

  // console.log( activeItem );

  try {
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/tokens/drafts/save`,
      data   : {
        id : activeItem?._id,
        json,
      },
      timeout : 30000,
    } );

    if ( activeItem?._id !== data._id ) {
      ( await router.replace( {
        query : {
          id : data._id,
        },
      } ) );

      return;
    } else {
      const {
        data,
      } = await axios.request( {
        method : "GET",
        url    : `/api/tokens/drafts/${ activeItem?._id }`,
      } );

      Object.assign( activeItem, data );
    }
  } catch ( err: any ) {
    // await openErrorModal( "Problem Saving", err.message );
  }

  saveStatus.isModified = false;
  await getPermit();
  saveStatus.isSaving = false;
}

async function setProfilePic() {
  if ( !activeItem._id || saveStatus.isModified ) {
    await saveDraft();
  }

  try {
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/me/pic`,
      data   : {
        tokenId : activeItem.tokenId || activeItem._id,
      },
    } );

    user.value!.picture = activeItem._id;
  } catch ( error: any ) {
    console.error( error );
  }
}

async function startPublish( value = true ) {
  if ( !selectedAddress.value || isMobile.value ) {
    return;
  }

  const value0 = publishState.isOpen;

  publishState.isOpen = value;

  if ( value && !value0 ) {
    await getPermit();
    await updateInk();
  }
}

async function hasPass() {
  const studio = await getPassContract();

  if ( !studio ) {
    return;
  }

  return !( await studio.balanceOf( selectedAddress.value ) ).isZero();
}

const {
  state: havePass,
  execute: checkPass,
} = useAsyncState( async () => {
  return await hasPass();
}, false );

async function updateInk() {
  publishState.isLoading = true;
  publishState.missingInk = false;

  if ( !havePass.value ) {
    await checkPass();
  }

  if ( !havePass.value ) {
    if ( !activeItem.inkTokensUsed ) {
      return;
    }

    publishState.missingInk = Object.entries( activeItem.inkTokensUsed ).some(
      ( [
        tokenId, used,
      ] ) => {
        const token = inkColors.value[ tokenId ];

        if ( !token.myBalance ) {
          return true;
        }

        return token.maxSupply?.gt?.( 0 ) && token.myBalance?.lt( used || 0 );
      }
    );
  }

  publishState.isLoading = false;
}

function onKeyDown( e: KeyboardEvent ) {
  if ( e.ctrlKey ) {
    if ( e.code === "KeyS" ) {
      saveDraft().then();
      e.preventDefault();
      e.stopPropagation();

      return;
    }
  }
}

onBeforeUnmount( async () => {
  window.removeEventListener( "keydown", onKeyDown );
} );
onMounted( async () => {
  if ( route.query.id ) {
    await loadDraft( String( route.query.id ) );
  }


  window.onbeforeunload = () => {
    if ( saveStatus.isModified ) {
      return "Are you sure you want to leave?";
    }
  };
  window.removeEventListener( "keydown", onKeyDown );
  window.addEventListener( "keydown", onKeyDown );
  await userStore.start();
  userStore.loadInkColors();
  userStore.loadInkBalances();

  try {
    await updateInk();
  } catch ( err ) {
    console.log( {
      err,
    } );
  }
} );

async function ensureInkSpendable() {
  const $Factory = await getFactoryContract();
  const $Ink = await getInkContract();

  // Pass holders don't need to spend ink
  await checkPass();

  if ( havePass.value ) {
    return;
  }

  if ( !$Factory || !$Ink ) {
    return false;
  }

  inkSpendable.value = !!( await $Ink?.callStatic.isApprovedForAll(
    selectedAddress.value,
    $Factory.address
  ) );

  if ( !inkSpendable.value ) {
    inkSpendable.loading = true;

    try {
      const txn = ( await $Ink.setApprovalForAll( $Factory.address, true ) ).wait(
        1
      );
    } catch ( err ) {
      console.log( err );
    }
  }

  inkSpendable.value = !!( await $Ink?.callStatic.isApprovedForAll(
    selectedAddress.value,
    $Factory.address
  ) );
  inkSpendable.loading = false;
}

async function mintMissing() {
  if ( !activeItem ) {
    return;
  }

  const signer = await getSigner();
  const inkContract = await getInkContract();

  await userStore.loadInkBalances();

  if ( !inkContract || !signer ) {
    return;
  }

  if ( !activeItem!.inkTokensUsed ) {
    await getPermit();
  }

  const used = activeItem!.inkTokensUsed;
  const needed: Record<number, number> = {};

  if ( used ) {
    Object.entries( used ).forEach( ( [
      tokenId, used,
    ] ) => {
      const {
        myBalance,
        maxSupply,
      } = inkColors.value[ tokenId ];

      if ( maxSupply?.isZero() ) {
        return;
      }


      const amtNeeded = BigNumber.from( used ).sub( myBalance );

      if ( amtNeeded.gt( 0 ) ) {
        needed[ tokenId ] = Math.ceil( amtNeeded.toNumber() );
      }
    } );
  }

  if ( Object.keys( needed ).length === 0 ) {
    return;
  }

  const ids = Object.keys( needed );
  const qtys = Object.values( needed );

  try {
    publishState.missingInkLoading = true;

    const txn = await inkContract.mintMany(
      await signer.getAddress(),
      ids,
      qtys,
      {
        value : await inkContract.callStatic.mintPriceMany( ids, qtys ),
      }
    );

    await txn.wait();
  } catch ( err: any ) {
    await openErrorModal( "Transaction failed", parseErrorMessage( err ) );
  }

  // await countInk();
  await getPermit();
  await updateInk();
  publishState.missingInkLoading = false;
}

async function countInk() {
  const colorsUsed = {};

  // const validColors = Object.values( inkColors.value ).map( x=>x.color );

  try {
    if ( !Object.values( inkColors.value ).length ) {
      await userStore.loadInkBalances();
    }
  } catch ( err ) {
    console.log( err );
  }

  console.log( {
    inkColors : inkColors.value,
  } );


  const inkByColor = Object.values( inkColors.value ).reduce( ( acc, x ) => {
    acc[ x.color ] = x;

    return acc;
  }, {} as Record<string, InkToken> );


  for ( const path of ( studio.value?.w.stateMan().paths as paper.Path[] ) ) {
    path.reorient( true, true );

    if ( path.parent instanceof paper.CompoundPath ) {
      continue;
    }

    if ( path.hasStroke() ) {
      const color = "#000000";

      colorsUsed[ color ] = Number( colorsUsed[ color ] ) || 0;
      colorsUsed[ color ] += Number( path.strokeWidth * ( 1 + path.length ) ) || 0;
    }

    if ( path.hasFill() ) {
      const color = path.fillColor?.toCSS( true ).toUpperCase();
      let area = 0;

      if ( !path.closed ) {
        const path2 = path.clone( {
          insert : false,
        } );

        path2.closePath();
        area = path2.area;
        path2.remove();
      } else {
        area = path.area;
      }


      if ( color && Object.keys( inkByColor ).includes( color ) ) {
        colorsUsed[ color ] = Number( colorsUsed[ color ] ) || 0;
        colorsUsed[ color ] += Math.abs( area ) || 0;
      } else {
        path.fillColor = null;
      }
    }
  }

  const inkTokensUsed = {};

  console.log( {
    colorsUsed,
    inkByColor,
  } );
  Object.keys( colorsUsed ).forEach( ( color ) => {
    const inkTokenId = ( inkByColor?.[ color ]?.tokenId )?.toString();

    if ( !inkTokenId ) {
      return;
    }

    inkTokensUsed[ inkTokenId ] = Math.ceil( colorsUsed[ color ] * INK_FACTOR );
  } );
  // ---
  activeItem.inkTokensUsed = inkTokensUsed;
  console.log( inkTokensUsed );
}

function canvasModified() {
  saveStatus.isModified = true;
  countInk();
}


const showTable = ref( false );
// const timeSaved = computed( () => activeItem?.timeSaved ? new Date( activeItem.timeSaved ) : null );
// const timeAgoSaved = useTimeAgo( timeSaved );


</script>
<template lang="pug">
main.flex-column.w-100(ref="pageDiv").h-100.d-flex
  nav.navbar.navbar-expand.d-flex.bg-white.z-top.p-0(
    ref="headerDiv"
  ).border-bottom
    .container-lg
      .nav.navbar-nav.flex-nowrap.align-items-center
        .nav-link.h-100
          RouterLink.btn.btn-light(to="/account")
            i.fa.fa-fw.fa-chevron-left
            span.d-none.d-md-inline Account

      .navbar-nav.me-auto
        .btn-toolbar(v-if="hasSession && selectedAddress && !isMobile")
          QrCodeWidget

          .btn.btn-primary(
            v-if="activeItem?.inkTokensUsed"
            @click="showTable=true"
          )
            i.fa.fa-list.fa-fw

      .navbar-nav.ms-auto.mx-2(v-if="sameAddress(user?.address, selectedAddress)")
        .btn-toolbar


          .btn.btn-light(
            @click="setProfilePic()"
            :disabled="!activeItem._id || activeItem._id === user?.picture"
          )
            i.fa-fw.far.fa-user
            span.d-none.d-md-inline Set Persona

          .btn-group
            .btn(
              :class="{ 'disabled': (!saveStatus.isModified || saveStatus.isSaving), 'btn-danger': saveStatus.isModified }",
              @click="saveStatus.isSaving = false; saveDraft();"
            )
              span(
                v-if="saveStatus.isSaving"
              ) #[span.spinner-border.spinner-border-sm] Loading
              span(
                v-else-if="saveStatus.isModified"
              ) #[i.fa.fa-fw.fa-save] Save
              span(
                v-else
              ) #[i.fa.fa-fw.fa-check]



            .btn.btn-success(
              v-if="( (!saveStatus.isModified) && hasSession && !isMobile && sameAddress(user?.address, selectedAddress)) && activeItem"
              @click="startPublish()"
              :class="{ disabled: saveStatus.isModified }"
            ) Publish #[i.fa.fa-fw.fa-chevron-right]


      .navbar-nav(v-if="!sameAddress(user?.address, selectedAddress)")
        .nav-link
          AuthMenu

    .pos-rel
      .pos-abs.top.w-100
        .alert.alert-danger.faded(v-if="activeItem?.isPublic")
          |#[i.fa.fa-exclamation-circle] Item is published.

        template(v-else)
          .alert.alert-danger.faded.shake(v-if="!hasSession")
            |#[i.fa.fa-exclamation-circle] Please #[a.btn(@click="userStore.start(true)") Sign In] so you can save your work.

  Teleport(to="#modals")
    ModalBox(
      v-model:value="showTable"
    )
      template(#header)
        h4.m-0 INK Used

      TokenMaterials(
        v-if="activeItem?.inkTokensUsed",
        :value="activeItem",
        showWallet
      ).bg-white.mb-2

      .modal-footer
        .btn(
          v-if="publishState.missingInkLoading"
        ) #[.spinner-border.spinner-border-sm] Confirm...
        .btn.btn-light(
          v-else-if="publishState.missingInk"
          @click="mintMissing()"
        ) Top up what you need

  AuthGuard
  Studio(
    v-if="!activeItem.tokenId"
    ref="studio",
    :user="user",
    @modify="canvasModified",
    :inkColors="inkColors"
  )

  .h-100(v-else).flex-center
    .card
      .card-header
        h4 Item has been published.
      .card-body
        RouterLink.btn.btn-primary(
          :to="`/tokens/${activeItem.tokenId}`",
        ) View Token {{activeItem.tokenId}}

  Teleport(to="#modals")
    ModalBox(v-model:value="publishState.isOpen")
      template(#header)
        h5 Publish

      template(#default)
        .modal-body(
          v-if="!activeItem || !activeItem?.inkTokensUsed"
        )
          h4 Can't publish this drawing.
          p Try saving it again.

        .modal-body.p-0(v-else).bg-light
          .square
            LoadImage.inner(
              :src="`/api/tokens/${activeItem._id}/image`"
            )

          .bg-white.border-top
            TokenMaterials(
              v-if="activeItem?.inkTokensUsed && !havePass",
              :value="activeItem",
              showWallet
            ).bg-white

          .p-4(
            v-if="publishState.isLoading"
          ).striped-dark.animated.flex-center
            .spinner-border

          .p-5(
            v-else-if="publishState.missingInk"
          )
            .card-header.pb-4
              .row.align-items-center
                .col-auto.nowrap
                  i.fa.fa-lg.fa-exclamation-triangle
                .col
                  strong You need more INK to publish this NFT.

            .card-body
              .row.align-items-center.g-3
                .col-12
                  .list-group
                    .list-group-item.list-group-item-success.list-group-item-action(
                      v-if="publishState.missingInkLoading"
                    )
                      |#[span.spinner-border.spinner-border-sm] Waiting for confirmation
                    .list-group-item.list-group-item-primary.list-group-item-action(
                      v-else,
                      @click="mintMissing()"
                    ).strong
                      |#[i.fa.fa-fw.fa-eye-dropper] Quick-mint what is needed

                .col-12
                  small Market
                  .list-group.list-group-item-primary
                    .list-group-item.list-group-item-secondary.list-group-item-action(
                      @click="mintFormOpen = true; publishState.isOpen = false"
                    )
                      |#[i.fa.fa-fw.fa-tint] INK Shop

                .col-12
                  small Secondary Market
                  .list-group
                    a.list-group-item.list-group-item-light.list-group-item-action.bg-light(
                      v-if="CONTRACTS.InkognitosInk",
                      target="blank",
                      :href="`https://looksrare.org/assets/${CONTRACTS.InkognitosInk?.address}/${activeItem.tokenId}`"
                    )
                      i.fa.fa-fw.fa-external-link-alt
                      | LooksRare.org

                    a.list-group-item.list-group-item-light.list-group-item-action.bg-light(
                      v-if="CONTRACTS.InkognitosInk",
                      target="blank",
                      :href="`https://opensea.io/assets/${CONTRACTS.InkognitosInk?.address}/${activeItem.tokenId}`"
                    )
                      i.fa.fa-fw.fa-external-link-alt
                      | OpenSea.io

                .col-12
                  small Other Options
                  .alert.alert-light.text-start
                    ul.m-0
                      li Reduce INK utilization &amp; try again
                      li Extract INK by #[strong Burning] NFTs &amp; try again

        template(
          v-if="!publishState.isLoading && !publishState.missingInk && !publishState.isDone"
        )
          .modal-footer.bg-success.d-block
            .row.g-3.align-items-center
              .col
                h4 Ready to publish!
              .col-auto
                template(v-if="publishState.publishLoading")
                  .btn.btn-light.striped-dark.animated
                    |#[span.spinner-border.spinner-border-sm] Confirm...
                template(v-else)
                  .btn.btn-success(
                    @click="nextStep()"
                  ) Publish #[i.fa.fa-arrow-right]
          .modal-footer.d-block.bg-light
            div.small
              ul
                li By minting, you agree to our terms or service.
                li The INK tokens used in this drawing will be locked for the lifetime of the NFT.
                li Owners have the ability to burn their tokens, unlocking the INK.
                li When burned, 50% will be returned to you, and 50% to the owner who burned it.
                li After the mint, you will be the owner and creator of the token.
</template>

<style lang="scss" scoped>
main {
  user-select: none !important;
  width: 100%;
  max-height: 100vh;
  overflow: hidden;
  top: 0;
  left: 0;
  padding: 0;
  position: fixed;
  background-color: #efefef;
}
</style>
<route lang="yaml">
meta:
  layout: default
  hideNavbar: true
  hideFooter: true
</route>
