<script lang="ts" setup>
import { abbreviateNumber, bigClamp, bigMax, bigMin, format,
  openErrorModal, parseErrorMessage, Snoozer } from "$/lib/utils";
import type { InkToken } from "$/store/session";
import userStore, { sameAddress, CONTRACTS, getInkContract, getSigner } from "$/store/session";
import type { BigNumberish } from "@ethersproject/bignumber";
import { BigNumber } from "@ethersproject/bignumber";
import { utils } from "ethers";
import { parseEther } from "ethers/lib/utils";


const {
  selectedAddress,
  inkColors,
  provider,
  hasSession,
  user,
} = userStore.getState();

const emit = defineEmits<{
  ( event: "done" ): void;
}>();

const state = reactive<{
  metadata: any;
  qty: BigNumber;
  name: string;
  symbol: string;
  gasPrice: BigNumber;
  ethBalance: BigNumber;
  mintForAddress: string;
  final: any;
  isGift: boolean;
}>( {
  metadata       : {} as any,
  qty            : BigNumber.from( 1 ),
  name           : "",
  symbol         : "",
  gasPrice       : BigNumber.from( 0 ),
  ethBalance     : BigNumber.from( 0 ),
  final          : null as any,
  mintForAddress : "",
  isGift         : false,
} );

const activeItem = ref<{
  fees: BigNumber,
  subtotal: BigNumber,
  ready?: boolean,
  qty: BigNumber
} & Partial<InkToken>>( {
  fees     : BigNumber.from( 0 ),
  subtotal : BigNumber.from( 0 ),
  qty      : BigNumber.from( 1 ),
} );


const mintMaxCount = ref( BigNumber.from( 0 ) );

async function updateStats() {
  console.log( "updateStats" );

  const signer = await getSigner();

  state.ethBalance = await signer.getBalance();
  state.gasPrice = await signer.getGasPrice();
}


async function loadToken( token?: Partial<InkToken> ) {
  if( !token?.tokenId ){
    return;
  }
  
  const tokenId =  token.tokenId;

  activeItem.value = {
    ...token,
    fees     : BigNumber.from( 0 ),
    subtotal : BigNumber.from( 0 ),
  };
  activeItem.value.maxSupply = await CONTRACTS.InkognitosInk?.callStatic.maxSupply( tokenId );
  activeItem.value.totalSupply = await CONTRACTS.InkognitosInk?.callStatic.totalSupply( tokenId );
  activeItem.value.unitPrice = await CONTRACTS.InkognitosInk?.callStatic.mintPrice( tokenId, 1 );

  try{
    const tokenUri = await CONTRACTS.InkognitosInk?.callStatic.tokenURI( tokenId );

    if( tokenUri ){
      const base64String = tokenUri.slice( 29 );
      const jsonString = window?.atob( base64String );
      const metadata = JSON.parse( jsonString );

      state.metadata = metadata;
    }else{
      state.metadata = {};
    }
  }catch( err ){
    console.log( "No metadata" );
  }

  await updateOption( activeItem.value );
}

// Mounted
onMounted( async () => {
  await userStore.start();
  await userStore.loadInkBalances();
  await updateStats();
  await getInkContract();
  await loadToken( Object.values( inkColors.value )[0] );
  
  if( !state.mintForAddress ){
    state.mintForAddress = selectedAddress.value;
  }

  mintMaxCount.value = await CONTRACTS.InkognitosInk?.callStatic.mintMaxCount() || BigNumber.from( 1 );

  const _inkContract = CONTRACTS.InkognitosInk;

  if ( !_inkContract ) {
    openErrorModal( "Network issue or wrong chain." );

    return;
  }

  _inkContract.callStatic.name().then( ( val ) => {
    state.name = val;
  } );
  _inkContract.callStatic.symbol().then( ( val ) => {
    state.symbol = val;
  } );
} );

const snoozer = new Snoozer();

async function updateOptionInverse( item: any, budget: BigNumberish ) {
  if( budget ){
    item.subtotal = BigNumber.from( budget ).abs();
  }

  if( !item.unitPrice?.gte( 0 ) ){
    return;
  }
    
  state.qty = bigMax(
    1,
    bigMin(
      item.subtotal?.div( item.unitPrice ),
      mintMaxCount.value,
      supplyRemain.value
    )
  );
  snoozer.snooze( async () => {
    await updateOption( item );
    await updateFees( item );
  }, 1000 );
}

async function updateOption( item: any, qty?: BigNumberish ){
  if ( qty ) {
    state.qty = BigNumber.from( qty ).abs();
  }

  state.qty = bigMax(
    1,
    bigMin(
      state.qty,
      mintMaxCount.value,
      supplyRemain.value
    )
  );
  item.subtotal = item.unitPrice?.mul( state.qty ) || BigNumber.from( 0 );
  snoozer.snooze( async () => {
    await updateFees( item );
  }, 1000 );
}

const supplyRemain = computed( () => {
  return activeItem.value?.maxSupply?.sub( activeItem.value?.totalSupply || 0 ) || BigNumber.from( 0 );
} );

function tokenRemain( item ){
  return item?.maxSupply?.sub( item?.totalSupply || 0 ) || BigNumber.from( 0 );
}

const isValid = computed( () => {
  if( !supplyRemain.value?.gt( 0 ) ) {
    console.log(
      "supplyRemain <= 0"
    );

    return false;
  }

  if( !state.qty?.gte( 1 ) ) {
    console.log(
      "qty <= 1"
    );

    return false;
  }

  if( !state.qty.lte( supplyRemain.value || 0 ) ) {
    console.log(
      "qty > (supplyRemain)"
    );

    return false;
  }

  if( !state.ethBalance?.gte( activeItem.value.subtotal || 0 ) ) {
    console.log(
      "state.ethBalance.lt( state.activeItem.subtotal )"
    );

    return false;
  }


  if( !state.qty?.lte( mintMaxCount.value ) ) {
    console.log(
      "state.qty?.gt( mintMaxCount.value )"
    );

    return false;
  }

  return true;
} );

async function previewOption( item ){
  await updateOption( item );
  activeItem.value.ready = true;
}

async function updateFees( item: any ){
  const inkContract = await getInkContract();

  try {
    const gasUnits = await inkContract?.estimateGas.mintMany?.(
      selectedAddress.value,
      [
        item.tokenId,
      ],
      [
        state.qty,
      ],
      {
        value : item.unitPrice?.mul( state.qty ) || BigNumber.from( 0 ),
      }
    );

    const gasCost = gasUnits?.mul( state.gasPrice );

    item.fees = gasCost;
  }catch( err ){
    console.log( err );
    item.fees = null;
  }
}

const mintActive = ref( false );

/* Select item to mint */
async function beginMintItem() {
  // const signer = ( await getProvider() )?.getSigner();
  const inkContract = await getInkContract();

  if( !activeItem.value?.tokenId ){
    console.log( "Invalid token" );
    
    return;
  }

  if( !state.mintForAddress ){
    state.mintForAddress = selectedAddress.value;
  }

  // if( !inkContract )  {
  //   console.log( "No ink contract" );
    
  //   return;
  // }


  await updateOption( activeItem.value );
  mintActive.value = true;
  
  try {
    /* Mint Begins */
    const txn = await inkContract.mintMany(
      state.mintForAddress || selectedAddress.value,
      [
        activeItem.value.tokenId,
      ],
      [
        state.qty,
      ],
      {
        value : activeItem.value.unitPrice?.mul( state.qty ),
      }
    );

    await txn.wait( 1 );
    state.final = {
      done : false,
      txn,
    };
  } catch ( err:any ) {
    mintActive.value = false;
    activeItem.value.ready = false;
    state.final = null;

    const error = parseErrorMessage( err );

    if( error ){
      openErrorModal( "Problem", error );
    }

    return;
  }
  
  state.final = {
    ...state.final,
    done : true,
  };
  await updateStats();
  await loadToken( activeItem.value );

  // signer.provider.once( "block", async ( block: any ) => {
  //   await updateStats();
  //   await loadToken( activeItem.value! );
  //   await userStore.loadInkBalances();
  //   // mintActive.value = false;

  //   // const receipt = await signer.getTransactionReceipt( state.final.txn.transactionHash );

  //   state.final.receipt = receipt;
  //   state.final.done = true;
  // } );
  // // state.final = {
  //   ...state.final,
  //   txn : receipt,
  // };
}


const isSoldOut = computed( () => {
  try{
    if ( !( activeItem.value?.maxSupply || activeItem.value?.totalSupply ) ) {
      return false;
    }

    if ( activeItem.value.totalSupply?.gte?.( activeItem.value.maxSupply || 0 ) ) {
      return true;
    }
  }catch( err ){
    // 
    console.log(
      err
    );
  }

  return false;
} );

const waitingForSignature = computed( () => {
  return activeItem.value && !state.final;
} );

const waitingForNetwork = computed( () => {
  return state.final && !state.final?.done;
} );

const txnComplete = computed( () => {
  return state.final?.done;
} );

function dismiss( close?: boolean ) {
  state.final = null;
  mintActive.value = false;
  activeItem.value.ready = false;

  if ( close ) {
    emit( "done" );
  }
}

async function setMax(){
  await updateOptionInverse( activeItem.value, state.ethBalance );
}

</script>
<template lang="pug">
  
.modal-body.border-top.bg-light
  .row.g-3
    .col-auto(v-if="!activeItem").appear.mx-auto
      .row.g-3.align-items-center
        .col-auto
          .spinner-border.mx-auto
        .col
          span Loading...

    .col-12(v-else)
      .row.g-2
        //- Payment
        .col-12
          .card.bg-light1.border-0
            .card-block
              .row.g-0.align-items-center.flex-nowrap
                .col-auto.p-3
                  .btn.p-1.btn-white.border.flex-center.rounded-pill
                    TokenIcon(name="eth")
                    
                .col.p-2
                  .row.g-0
                    .col-12.text-end
                      .btn.btn-outline-info.border-0.btn-sm.py-0(
                        @click="setMax()"
                      ) #[i.fab.fa-ethereum] {{ format(state.ethBalance, "ether", 3) }}
                    .col-12
                      input.form-control.form-control-plaintext.border-0.shadow-none(
                        @wheel.prevent="updateOptionInverse(activeItem, activeItem.subtotal?.sub( parseEther( (Math.sign($event.deltaY)*0.001).toFixed(4) ) ) || 0 )"
                        :value="format(activeItem.subtotal||0, 'ether')"
                        @change="updateOptionInverse( activeItem, BigNumber.from( parseEther($event.target.value) ) )"
                      ).text-end.px-2

        //- Recieve
        .col-12
          .card.bg-light1.border-0
            .card-block
              .row.g-0.align-items-center.flex-nowrap
                .col-auto.p-3.pos-rel
                  VDropdown.z-top(
                    :placement="'right-center'"
                  ).dropdown
                    template(
                      #default="{show}"
                    )
                      .btn.p-1.btn-white.border.dropdown-toggle.flex-center.rounded-pill
                        .square(
                          style="width: 2rem;"
                          @click="show"
                        )
                          button.btn-outline-dark.p-0.btn.rounded-circle(
                            v-if="activeItem"
                            :style="['backgroundColor:'+ activeItem.color]"
                          ).inner.flex-center

                          
                            
                    template(
                      #popper="{hide}"
                    )
                      .list-group(
                        style="max-height: 30rem; height: 100%; width: 20rem;"
                        @click="$nextTick(x=>hide())"
                      ).overflow-x-hidden
                        template(
                          v-for="(item,i) in Object.values(inkColors)",
                        )
                          .list-group-item.list-group-item-action.no-select(
                            @click="loadToken(item)",
                            v-if="item && item?.maxSupply?.gt(0)"
                            :class="{ 'active': item.tokenId === activeItem?.tokenId }"
                          )
                            .row.g-2.align-items-center.flex-nowrap
                              .col-auto
                                .square.p-2.border.rounded-pill.border-dark(
                                  style="width: 2rem;"
                                  :key="'token-'+activeItem.tokenId",
                                  :style="{ 'backgroundColor': item.color}"
                                )
                                  .inner

                              .col
                                strong.small.monospace {{item.color}}
                                div
                                small(v-if="item.unitPrice")
                                 | #[i.fab.fa-ethereum] #[span.monospace {{ format(item.unitPrice, "ether", 5) }}]#[sub /ea]

                              .col-auto.monospace.small.faded
                                .text-end(
                                  v-if="item.myBalance?.gt(0)"
                                )
                                  | {{  abbreviateNumber( (item.myBalance) || 0 )  }}
                                small.text-end
                                  | {{  abbreviateNumber( tokenRemain(item) || 0 )  }}

                .col-auto(
                  v-if="activeItem?.unitPrice"
                )
                  small #[i.fab.fa-ethereum] #[span.monospace {{ format(activeItem.unitPrice, "ether", 5) }}]#[sub /ea]

                .col.p-2
                  .row.g-0
                    .col-12.text-end
                      .btn.btn-outline-info.border-0.btn-sm.py-0(
                        @click="updateOption(activeItem, bigMin( mintMaxCount, supplyRemain ))"
                      ) {{ bigMin( mintMaxCount, supplyRemain ) }}
                    .col-12
                      input.form-control.form-control-plaintext.p-2.shadow-none.border-0(
                        type="number"
                        @wheel.prevent="updateOption(activeItem, bigClamp(state.qty.sub(Math.sign($event.deltaY)), 1, mintMaxCount ))"
                        @change="updateOption(activeItem, bigClamp(BigNumber.from($event.target.value||0), 1, mintMaxCount.toNumber() ))"
                        :value="Number(state.qty)"
                      ).text-end


        .col-12(
          v-if="activeItem"
        )
          .card.border-0
            .card-body
              .row.g-3.align-items-center
                .col-md-3(v-if="state.metadata?.image")
                  LoadImage(:src="state.metadata.image")

                .col
                  .row.g-2
                    .col-12
                      h5.m-0.monospace.text-uppercase {{activeItem?.color}}

                    .col-12.appear(
                      v-if="activeItem?.totalSupply && activeItem?.maxSupply"
                    )
                      .progress(
                        v-if="activeItem?.maxSupply?.gt(0)"
                      ).border
                        .progress-bar(
                          :style="[ \
                          `width: ${ ( (activeItem?.totalSupply.mul(-1000).div(activeItem.maxSupply).div(10).add(100) ).toString() ) }%`, \
                          `background-color: ${activeItem?.color}`]"
                        )
                          
                    .col-12
                      .row
                        .col
                          .badge.text-success.px-0
                            .badge.small {{ abbreviateNumber( supplyRemain ) }} Remain

                        .col-auto.text-end
                          .badge.text-muted.px-0
                            .badge.small {{ abbreviateNumber( activeItem?.maxSupply?.toNumber()||0) }} Max

        .col-12
          .card.border-0
            .card-body
              .row.g-3
                .col Gas
                .col-auto.monospace Ξ{{ format(activeItem?.fees, 'ether', 5) }}

        .col-12
          form(@submit.prevent="()=>false").card.border-0
            .card-body
              .card-title Receiver
              .row.align-items-center.g-2
                .col-auto
                  JazzIcon(
                    noLabel
                    :address="state.mintForAddress"
                    size="3rem"
                  ).me-n1

                .col
                  input.form-control.monospace(
                    v-model="state.mintForAddress"
                  )
                .col-auto(
                  v-if="!sameAddress(state.mintForAddress, selectedAddress)"
                )
                  .btn.btn-outline-success(
                    @click="state.mintForAddress = selectedAddress"
                  ) Myself #[i.fa.fa-undo]
        .col-12
          .btn.btn-primary.d-block.p-3(
            v-if="activeItem?.color"
            :class="{disabled: !isValid}"
            @click="previewOption(activeItem)"
          )
            span {{"Mint "}}
            strong {{ state.qty + " &times; " }}
            span #[i.fa.fa-eye-dropper.fa-fw]
            span.text-uppercase {{`${activeItem.color }`}}
            span {{" for "}}
            strong #[i.fab.fa-ethereum.fa-fw]{{ format(BigNumber.from(activeItem.subtotal||0), 'ether', 4) }}
            i.fa.fa-chevron-right.fa-fw


        
              //- .col-12
                hr.mt-0
                
                .row.justify-content-between
                  .col-auto
                    a.btn.appear(
                      :href="`https://opensea.io/assets/${dreamersInkAddress}/${state.activeItem?.tokenId}`",
                      target="_blank",
                      :style="`--delay:${1}`"
                    )
                      .square.bg-light(
                        style="width: 1.5em;"
                      )
                        img.inner(
                          src="https://opensea.io/static/images/logos/opensea.svg",
                        )

                  .col-auto
                    a.btn.appear(
                      :href="`https://etherscan.io/address/${dreamersInkAddress}`",
                      target="_blank",
                      :style="`--delay:${2}`"
                    )
                      .square.bg-light(
                        style="width: 1.5em;"
                      )
                        img.inner(
                          src="https://etherscan.com/images/favicon3.ico",
                          style="filter: contrast(2)"
                        )

                  .col-auto
                    AddTokenButton.appear(
                      :address="dreamersInkAddress",
                      :symbol="state.symbol",
                      :decimals="2",
                      :style="`--delay:${3}`"
                    )
                      .square.bg-light(
                        style="width: 1.5em;"
                      )
                        img.inner(
                          src="https://docs.metamask.io/metamask-fox.svg",
                          style="filter: contrast(2)"
                        )
 
      
  Teleport(to="#modals")
    ModalBox(v-if="activeItem?.ready" :value="activeItem" @close="activeItem.ready = false")
      template(#header)
        .row.align-items-center
          .col
            h5.m-0 Overview

      template(#default)
        .modal-body.bg-light1
          .row.g-4
            .col-12
              .card
                .card-body
                  .row.g-4.align-items-center
                    .col-auto
                      .square.rounded-circle(:style="{ width: '5em', 'backgroundColor': activeItem?.color }").shadow.border.border-2.border-white
                        .inner.d-flex
                          i.fa.fa-tint.fa-2x.text-white.align-self-center.text-center.w-100
                    .col
                      h5.m-0.monospace #[strong {{ activeItem?.color }}]
                      .monospace.m-0 TokenID: {{ BigNumber.from( activeItem?.tokenId ).toHexString() }}
                          
                    
            .col-12
              div(:class="(state.final?.txn || mintActive)? 'faded' : ''").px-0
                .list-group
                  .list-group-item
                    .row.align-items-center
                      .col INK Amount
                      .col.text-end.monospace {{ state?.qty }}
                    
                  .list-group-item
                    strong.row.align-items-center
                      .col Subtotal
                      .col.monospace.text-end Ξ{{ format(activeItem.subtotal, "ether", 4) }}

                  .list-group-item
                    .row.align-items-center
                      .col Gas
                      .col.monospace.text-end Ξ{{ format(activeItem.fees, "ether", 4) }}
                    

            template(
              v-if="!mintActive && !state.final"
            )
              .col-12
                .card
                  .card-body
                    .row.flex-nowrap.align-items-center
                      .col-auto
                        i.fa.fa-arrow-right.fa-lg
                      .col.text-truncate
                        JazzIcon(:address="state.mintForAddress")
                      .col-auto(v-if="sameAddress(state.mintForAddress, selectedAddress)")
                        .badge.bg-light Your own wallet



              .col-12
                .row
                  .col-auto
                    .btn.w-100.btn-light(
                      @click="activeItem.ready = false"
                    ).btn-lg
                      | #[i.fa.fa-chevron-left] Back

                  .col
                    .btn.w-100(
                      @click="beginMintItem()"
                      :class="[ utils.isAddress(state.mintForAddress) || 'disabled' ]"
                    ).btn-success.btn-lg
                      .lead Continue #[i.fa.fa-chevron-right]


            template(v-if="mintActive || state.final")
              .col-12
                .card
                  .card-body(
                    :class="{ \
                      'striped-dark animated': waitingForNetwork || waitingForSignature, \
                      'bg-success': txnComplete, \
                      'bg-info': waitingForNetwork, \
                      'bg-warning': waitingForSignature }"
                  )
                    .row.g-2.align-items-center.text-start
                      .col-2.text-center
                        Transition(mode="out-in", name="slide")
                          span(v-if="waitingForSignature")
                            |#[i.fa.fa-fw.fa-circle-notch.fa-spin.fa-xl]
                          span(v-else-if="waitingForNetwork")
                            |#[i.far.fa-fw.fa-clock.fa-spin.fa-xl]
                          span(v-else-if="txnComplete")
                            |#[i.fa.fa-fw.fa-check.fa-xl]

                      .col
                        Transition(mode="out-in", name="fade")
                          span(v-if="waitingForSignature")
                            | Waiting for your confirmation...
                          span(v-else-if="waitingForNetwork")
                            | Waiting for network confirmation...
                          strong(v-else-if="txnComplete")
                            | Transaction Completed

                      .col-auto(v-if="state.final?.txn").appear
                        a.btn.text-white(
                          :href="`https://etherscan.io/tx/${state.final.txn?.transactionHash}`",
                          target="_blank"
                        )
                          span View
                          i.fa.fa-fw: img(
                            src="https://etherscan.com/images/favicon3.ico",
                            style="width: 1rem; filter: brightness(10)"
                          )

            .col-12(v-if="txnComplete")
              .row.g-2
                .col
                  .btn.btn-outline-dark(@click="dismiss()")
                    | #[i.fa.fa-fw.fa-chevron-left] Back

                .col-auto
                  RouterLink.btn.btn-light(to="/artboard/" @click="dismiss(true)")
                    | #[i.fa.fa-fw.fa-paint-brush]
                    | Draw
                .col-auto
                  RouterLink.btn.btn-light(to="/account/" @click="dismiss(true)")
                    | #[i.fa.fa-fw.fa-wallet]
                    | Wallet

</template>
<style lang="scss" scoped>
table {
  td {
    vertical-align: middle;
  }
}
.bar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
}
.cursor-pointer {
  cursor: pointer;
}
// input {
//   font-size: 2rem;
//   text-align: center;
// }
table {
  td,
  th {
    text-align: center;
  }
  td {
    padding: 1rem 0.5rem;
  }
}
</style>
