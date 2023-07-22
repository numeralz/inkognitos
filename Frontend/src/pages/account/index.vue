<script lang="ts" setup>
import { format, openErrorModal } from "$/lib/utils";
import type { FactoryItem, InkToken } from "$/store/session";
import userStore, { CONTRACTS, getFactoryContract, getInkContract, getProvider, getRxContract, getSigner, sameAddress } from "$/store/session";
import type { BigNumberish, EventFilter } from "ethers";
import { BigNumber, utils, ethers } from "ethers";
import type { InkognitosInk } from "typechain";

interface State {
  isLoading: boolean;
  inkBalance: BigNumber;
  ethBalance: BigNumber;
  isApproved: boolean;
  dreamersMinted: BigNumber;
  dreamersOwned: BigNumber;
}


const state = reactive<State>( {
  isApproved     : false,
  isLoading      : false,
  inkBalance     : BigNumber.from( 0 ),
  ethBalance     : BigNumber.from( 0 ),
  dreamersMinted : BigNumber.from( 0 ),
  dreamersOwned  : BigNumber.from( 0 ),
} );

const {
  user,
  mintFormOpen,
  inkColors,
  selectedAddress,
} = userStore.getState();

const logs = ref<any[]>( [] );
// const router = useRouter();
interface Account {
  name: string,
  icon: string,
  color: string,
  getBalance: ()=> string,
  click?: ()=> void,
  actions?: {
    name?: string,
    click: ()=> void,
  }[],
  parts?: any,
  _open?: boolean,
}
const accounts = ref<Account[]>( [] );
let inkContract: InkognitosInk;
const drafts = ref<FactoryItem[]>( [] );
const WETH_TOKEN = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";
const activeItem = ref<any>( null );
let newName = $ref( user.value?.name || "" );

const filters: {
  name: string,
  abi: string[],
  filter: EventFilter,
  callback: any
}[] = [
  {
    name : "TransferSingle",
    abi  : [
      "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
    ],
    filter : {
      address : "",
      topics  : [
        utils.id( "TransferSingle(address,address,address,uint256,uint256)" ),
      ],
    },
    // emit TransferSingle(operator, from, to, id, amount);
    callback : ( args )=>{
      console.log( "TransferSingle", args );

      const [
        operator,
        from,
        to,
        id,
        value,
        raw,
      ] = args;

      logs.value.unshift( {
        from  : BigNumber.from( from ).isZero() ? null : from,
        to    : BigNumber.from( to ).isZero() ? null : to,
        id    : BigNumber.from( id ),
        value : BigNumber.from( value ),
      } );
    },
  },
  {
    name : "TransferBatch",
    abi  : [
      "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
    ],
    filter : {
      address : "",
      topics  : [
        utils.id( "TransferBatch(address,address,address,uint256[],uint256[])" ),
      ],
    },
    // emit TransferBatch(operator, from, to, ids, amounts);
    callback : ( args )=>{
      const [
        operator,
        from,
        to,
        ids,
        values,
      ] = args;

      console.log( {
        operator,
        from,
        to,
        ids,
        values,
      } );

      // if( sameAddress( selectedAddress.value, to ) || sameAddress( selectedAddress.value, from ) ){
      for( let i = 0; i < ids.length; i++ ){
        logs.value.unshift( {
          from  : BigNumber.from( from ).isZero() ? null : from,
          to    : BigNumber.from( to ).isZero() ? null : to,
          id    : BigNumber.from( ids[ i ] ),
          value : BigNumber.from( values[ i ] ),
        } );
      }
    },
  },
];


onMounted( async () => {
  await userStore.start();
  drafts.value = await fetchDrafts();
  await userStore.loadInkBalances();
  await updateRoyalties();
  newName = user.value?.name;
  // await updateBalance();
} );
// onActivated( async () => {
//   console.log( "Activated" );
//   drafts.value = await fetchDrafts();
// } );

const myInkTokens = computed( () => {
  return Object.values( inkColors.value ).filter( ( token ) => ( token.myBalance?.gt( 0 ) && token.maxSupply?.gt( 0 ) ) );
} );


const myRoyalties = reactive<{
  balance: BigNumber,
  balanceWeth: BigNumber,
  released: BigNumber,
  address: string,
  _exists : boolean,
  _loading: boolean,
}>( {
  balance     : BigNumber.from( 0 ),
  balanceWeth : BigNumber.from( 0 ),
  released    : BigNumber.from( 0 ),
  address     : "",
  _exists     : false,
  _loading    : true,
} );

async function deleteDraft( item: FactoryItem ) {
  activeItem.value = null;
  drafts.value = drafts.value.filter( ( i ) => i._id !== item._id );

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
    drafts.value.push( item );

    return;
  }
}

async function updateBalance() {
  if( !selectedAddress.value ) {
    return;
  }

  logs.value = [];
  inkContract = await getInkContract();
  filters.forEach( ( {
    filter, callback, name, abi,
  } ) => {
    filter.address =  inkContract.address;

    if( selectedAddress.value && filter.topics ){
      filter.topics[1] = "";
      filter.topics[2] = [
        utils.hexZeroPad( selectedAddress.value, 32 ),
        utils.hexZeroPad( ethers.constants.AddressZero, 32 ),
      ];
      filter.topics[3] = [
        utils.hexZeroPad( selectedAddress.value, 32 ),
        utils.hexZeroPad( ethers.constants.AddressZero, 32 ),
      ];
    }

    ( inkContract.provider ).getLogs( {
      ...filter,
      fromBlock : 0,
    } )
    .then( ( logs ) => {
      let iface = new ethers.utils.Interface( abi );
      let events = logs.map( ( log ) => iface.parseLog( log ) );

      events.forEach( ( event ) => {
        callback( event.args );
      } );
    } ).catch( ( err ) => {
      console.log( err );
    } );
  } );
}


async function updateRoyalties(){
  const signer = await getSigner();

  if( !signer ) {
    return;
  }

  const nftContract = await getFactoryContract();

  state.ethBalance = await signer.getBalance();
  myRoyalties._loading = true;

  try{
    myRoyalties.address = await nftContract.callStatic.royaltyAddress( selectedAddress.value );
    myRoyalties._exists = true;
  }catch( err:any ){
    console.log( err );
    myRoyalties._exists = false;
  }

  myRoyalties._loading = false;

  if( myRoyalties._exists ){
    try{
      myRoyalties.balance = await ( await getRxContract() )?.attach( myRoyalties.address )["releasable(address)"]( selectedAddress.value  );
    }catch( err ){
      console.log( err );
    }

    try{
      myRoyalties.balanceWeth = await ( await getRxContract() )?.attach( myRoyalties.address )["releasable(address,address)"]( WETH_TOKEN, selectedAddress.value  );
    }catch( err ){
      console.log( err );
    }
  }
}


async function fetchDrafts() {
  const {
    data,
  } = await axios.request( {
    method : "GET",
    url    : `/api/tokens/drafts`,
  } );

  // console.log( data );
  
  return data.items;
}


function openItem( item: InkToken ){
  activeItem.value = item;
}

const sendTokenForm = reactive< {
  toAddr  : string,
  qty     : BigNumberish,
}>( {
  toAddr : "",
  qty    : "",
} );

async function takeRoyalties(){
  if( myRoyalties.balance.gt( 0 ) ) {
    try{
      await ( await getRxContract() )?.attach( myRoyalties.address ).callStatic["release(address,address)"]( WETH_TOKEN, selectedAddress.value );
      await ( await getRxContract() )?.attach( myRoyalties.address )["release(address,address)"]( WETH_TOKEN, selectedAddress.value );
    }catch( err ){
      console.log( err );
    }
 
    try{
      await ( await getRxContract() )?.attach( myRoyalties.address ).callStatic["release(address)"]( selectedAddress.value );
      await ( await getRxContract() )?.attach( myRoyalties.address )["release(address)"]( selectedAddress.value );
    }catch( err ){
      console.log( err );
    }
  }
}

async function sendTokens( {
  toAddr,
  tokenId,
  qty,
}:{
  toAddr  : string,
  tokenId : BigNumberish,
  qty     : BigNumberish,
} ){
  try{
    const txn = await CONTRACTS.InkognitosInk?.safeTransferFrom(
      selectedAddress.value,
      toAddr,
      tokenId,
      qty,
      "0x"
    );

    await txn?.wait( 1 );
    activeItem.value = null;
  }catch( err:any ){
    await openErrorModal( "Error", err.message );
  }
}

async function syncTransfers(){
  await updateBalance();
}


async function updateName(){
  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/me/name`,
      data   : {
        name : newName,
      },
    } );

    user.value!.name = newName = data;
  } catch( error:any ){
    console.error( error );
    alert( error );
  }
}

</script>
<template lang="pug">
div
  //- .bg-light.py-2.striped-dark.shadow-inset
  //-   .container
  //-     .row.g-2.align-items-center
  //-       .col.text-center
  //-         h1 Account

  Teleport(to="#modals")
    ModalBox(
      :value="!!activeItem?.color"
      @close="activeItem = null"
    )
      template(#header)
        h4.m-0 #[i.fa.fa-fw.fa-paper-plane] Send INK
      template(#default)
        form.form(@submit.prevent="sendTokens({...sendTokenForm, tokenId: activeItem.tokenId})")
          .modal-body(v-if="activeItem").bg-light1
            .my-3
              .card
                .card-body
                  .row.g-2.align-items-center
                    .col-auto
                      .square.rounded-circle(:style="{ width: '3em', 'backgroundColor': activeItem?.color }").shadow.border.border-2.border-white
                        .inner.d-flex
                          i.fa.fa-tint.fa-1x.text-white.align-self-center.text-center.w-100
                    .col
                      h5.m-0.monospace #[strong {{ activeItem?.color }}]
                      .monospace.m-0 TokenID: {{ BigNumber.from( activeItem?.tokenId ).toHexString() }}
                    .col-4.text-end
                      small.text-muted Balance
                      h4.m-0.monospace {{ activeItem.myBalance }}

            .my-3
              .form-floating
                input.form-control(
                  type="text"
                  :value="sendTokenForm.toAddr"
                  @change="sendTokenForm.toAddr= \
                    utils.isAddress($event.target.value) ? $event.target.value : '' "
                  :class="[ !utils.isAddress(sendTokenForm.toAddr)?'is-invalid':'']"
                  placeholder="Wallet"
                )
                label Transfer To Address
                
            .my-3
              .form-floating
                input.form-control(
                  type="number"
                  v-model="sendTokenForm.qty"
                  min="0"
                  :max="activeItem.myBalance.toString()"
                  placeholder="Amount"
                )
                label Transfer Amount
          .modal-footer
            button.btn.btn-primary(
              :class="{ 'disabled': !sendTokenForm.qty || !sendTokenForm.toAddr || !utils.isAddress(sendTokenForm.toAddr) }"
            ) Send #[i.fa.fa-fw.fa-paper-plane]



  .section
    .container
      .row
        .col-md-8.mx-auto
          .row.g-5
            .col-12(
              v-if="user?.inviteCodes?.length"
            )
              .row.align-items-center
                .col: h5 Invite friends, earn INK

              .p-1.m-n1.striped-dark.rounded
                input.form-control(
                  readonly
                ).bg-white
                //- .list-group
                  .list-group-item
                    .row
                      .col

                      //- .col-auto
                        .btn.btn-light Revoke #[i.fa.fa-fw.fa-trash-alt]
            .col-12
              .row.align-items-center.my-2
                .col: h5 Public Profile
                .col-auto
                  RouterLink.btn.btn-white.mx-n2(
                    :to="`/users/${user?.address}`"
                  ) Open Public Profile #[i.fa.fa-fw.fa-user]

            
              .card.striped-dark
                .card-body.p-3
                  .row.align-items-center.g-3
                    .col-auto
                      JazzIcon(
                        :address="selectedAddress"
                        noLabel
                        size="12em"
                      )
                    .col
                      .row.g-2
                        .col-auto
                          RouterLink.btn.btn-light.border.w-100(
                            :to="user?.picture?`/artboard/?id=${user.picture}`:'/artboard'"
                          ) Draw Persona
                        .col-12
                          form(@submit.prevent="updateName()").input-group
                            input.form-control(v-model="newName").bg-white
                            button.btn.btn-light.border(type="submit" :class="{'disabled': (user?.name === newName)}") Change Name

            .col-12
              .row.g-2.my-2
                .col: h5 Unpublished Drafts
                .col-auto
                  RouterLink.btn.btn-white.mx-n2(
                    to="/artboard"
                  ) New Drawing #[i.fa.fa-fw.fa-pen-fancy]

              ListGuard(:items="drafts")
                .scroll-y.p-3.m-n3
                  .row.g-2
                    template(v-for="(item, i) in drafts" :key="item._id")
                      .col-4.col-md-3.col-lg-2
                        .pos-rel
                          i.fa.fa-eye-slash.pos-abs.top.left.p-2(v-if="!item.isPublic")
                        TokenCard(
                          :value="item"
                          @open="$router.push({path: `/artboard`, query: { id: item._id }})"
                          @delete="deleteDraft(item)"
                        )
                        
            .col-12
              .row.align-items-center.my-2
                .col: h5 Royalties
                .col-auto.btn-toolbar
                  .btn.btn-white.mx-n2(
                    :class="{disabled: !myRoyalties?.balance?.gt( 0 )}"
                    @click="takeRoyalties"
                  ) Withdraw #[i.fa.fa-fw.fa-rocket]
                  
                  a.btn.btn-white.mx-n2(v-if="myRoyalties.address" target="_blank" :href="`https://etherscan.io/address/${myRoyalties.address}`")
                    | Etherscan #[i.fa.fa-fw.fa-external-link]

              ListGuard(
                justOne
                :loading="myRoyalties._loading"
                :item="myRoyalties._exists"
              )
                template(#emptyText)
                  .alert.alert-dark.text-start
                    h4 How Royalties Work
                    p Published illustrations are minted as tokens within the Inkognitos ERC721 Collection
                    p When you publish your first illustration, a lightweight Royalty Splitter account is created on your behalf.
                    p Each time your work is sold on marketplaces that support royalties, your account will be credited 66% of the royalties.

                .row.g-3.align-items-center
                  .col.overflow-hidden
                    div.flex-center(
                      v-if="myRoyalties._loading"
                    )
                      .spinner-border
                    div(
                      v-else
                    )
                      .list-group
                        .list-group-item
                          .row.align-items-center
                            .col
                              | #[i.fa.fa-xl.fa-stack #[i.fa-stack-1x.fab.fa-ethereum]]
                              | ETH
                            .col.text-end.monospace.text-truncate
                              | {{ format( myRoyalties.balance, "ether" ) }}
                        .list-group-item
                          .row.align-items-center
                            .col
                              | #[i.fa.fa-xl.fa-stack.text-danger #[i.fa-stack-1x.fas.fa-circle] #[i.fa-stack-1x.fab.fa-ethereum.fa-inverse] ]
                              | WETH
                            .col.text-end.monospace.text-truncate
                              | {{ format( myRoyalties.balanceWeth, "ether" ) }}

                        .list-group-item.py-2.bg-light
                          .row.text-muted.align-items-center.flex-nowrap
                            .col #[i.fa-stack: i.fa.fa-stack-1x.fa-wallet] Royalty Wallet
                            .col.overflow-hidden
                              .monospace.text-truncate {{ myRoyalties.address }}



            .col-12
              .row.align-items-center.my-2
                .col: h5 INK Stash
                .col-auto
                  .btn.btn-white.mx-n2(
                    @click="mintFormOpen = true"
                  ) INK Shop #[i.fa.fa-fw.fa-tint]

              ListGuard(
                :items="myInkTokens "
              )
                template(#emptyText)
                  .alert.alert-dark.text-start
                    h4 How INK Works
                    p Publishing illustrations consumes INK tokens. To publish an illustration, obtain INK tokens to use in your drawing.
                    p INK can be minted from the INK Shop, and on secondary marketplaces (#[a(href="https://opensea.io") OpenSea], #[a(href="https://looksrare.org") LooksRare]).
                    p Holders of the Inkognitos Studio Pass don't need to worry about gathering the INK to publish.

                .row.align-items-center.g-2.text-white
                  .col-auto(
                    v-for="item in myInkTokens"
                    style="width: 4rem"
                  ).pos-rel
                    .square.rounded-circle.shadow.border.border-2.border-black(
                      :style="{'background-color':  item?.color }"
                      @click="openItem(item)"
                    )
                      .inner.d-flex
                        .w-100.text-center.align-self-center
                          i.fa.fa-tint.text-white.text-center

                    h5.m-0.pos-abs.bottom.right.badge.bg-black.text-white {{ item.myBalance.toString() }}

    
            .col-12
              .row.align-items-center.my-2
                .col: h5 INK Transactions
                .col-auto
                  .btn.btn-white.mx-n2(
                    @click="syncTransfers"
                  ) Fetch Transactions #[i.fa.fa-fw.fa-sync]

              ListGuard(
                :items="logs"
              )
                template(#emptyText)

                .row.g-2
                  .col-12(
                    v-for="item in logs"
                    :key="item.raw"
                  )
                    .row.flex-nowrap.g-2
                      .col-auto.d-flex.align-items-center
                        .square.rounded-circle(
                          :style="['background-color:'+ inkColors[item.id].color, 'width:2em' ]"
                        )
                          .inner.d-flex
                            .w-100.text-center.align-self-center.nowrap
                              i.fa.fa-tint.fa-xs.text-white.text-center

                      .col-2.monospace(
                        v-if="item.value"
                      ).d-flex.align-items-center
                        strong
                          span.mx-1 &times;
                          span(title="Quantity") {{ item.value }}

                      .col.h-100.text-truncate
                        .card
                          .bg-light1.rounded.card-body
                            .row
                              .col.overflow-hidden(v-if="item.from")
                                JazzIcon(:address="item.from" :me="user?.address" size="1.5em")
                              .col-1(v-if="item.from && item.to")
                                | #[i.fa.fa-arrow-right]
                              .col-auto(v-else-if="!item.from").strong
                                .badge.bg-success Mint
                              .col-auto(v-else-if="!item.to").strong
                                .badge.bg-danger Burn
                              .col.overflow-hidden(v-if="item.to")
                                JazzIcon(:address="item.to" :me="user?.address" size="1.5em")

                      .col-auto
                        a(
                          :href="`https://etherscan.io/tx/${item?.raw?.transactionHash}`"
                          target="_blank"
                        ).card.h-100.btn-light
                          .card-body.align-items-center.d-flex
                            i.fa.fa-external-link-alt

</template>
<style lang="scss" scoped>
.table{
  td, th{
    padding: 0.5rem;
    vertical-align: middle;
    &:first-child{
      text-align: left;
    }
    &:last-child{
      text-align: right;
    }
  }
}
</style>