<script lang="ts" setup>
import userStore, { getProvider, getSigner } from "$/store/session";
import type { JsonFragment } from "@ethersproject/abi";
import  { FormatTypes } from "@ethersproject/abi";
import type { ContractInterface } from "ethers";
import { Contract, ContractFactory, VoidSigner } from "ethers";
import  { ERC721__factory } from "../../typechain";



const props = withDefaults( defineProps<{
  abi: ContractInterface,
  address: string,
  name: string,
}>(), {
  name   : "",
  addrss : "",
  abi    : ()=>[],
} );


interface MethodParam {
  name: string,
  type: string,
}
interface Method{
  name: string,
  iface: string,
  params: MethodParam[],
  ret: any,
}
interface Field{
  name: string,
  iface: string,
  params: MethodParam[],
  ret: any,
}

const state = reactive<{
  fields: any[],
  methods: any[],
  events: any[],
}>( {
  fields  : [],
  methods : [],
  events  : [],
} );

let contract: Contract;

const {
  selectedAddress,
} = userStore.getState();

onMounted( async () => {
  const signer = await getSigner();
  const abi = ContractFactory.getInterface( props.abi ).fragments;
  const iface = Object.values( ERC721__factory.createInterface().functions );

  contract = ContractFactory.getContract( props.address, props.abi, signer );
  console.log( iface );
  
  const write = [
    ...iface,
  ].filter( ( o )=>( o.stateMutability !== "view" ) );

  const read = [
    ...iface,
  ].filter( ( o )=>( o.stateMutability === "view" ) );


  await Promise.allSettled(
    read.map( async ( res, rej )=>{
      const response = await contract.callStatic[o.name]();
      
      ( Array.isArray( response ) ? response : [
        response,
      ] ).forEach( ( value, i ) => {
        /* @ts-ignore-next */
        item.outputs[i]._value = String( value );
      } );
    } )
  );
  console.log( {
    abi,
  } );
  state.methods = abi
  .filter( ( item ) => {
    return item.type === "function";
  } )
  .map( ( item:any ) => {
    const inputs = item.inputs.map( ( field ) => {
      return ( {
        ...field,
        _value : "",
      } );
    } );

    const outputs = item.outputs.map( ( field ) => {
      return ( {
        ...field,
        _value : "",
      } );
    } );

    return reactive( {
      ...item,
      inputs,
      outputs,
    } );
  } ).sort( ( a, b )=>{
    const _a = a.stateMutability + a.name;
    const _b = b.stateMutability + b.name;
    return -1 * ( _a < _b ? -1 : ( _a > _b ? 1 : 0 ) );
  } );
} );


function openItem( item ){
  activeItem.value = item;
}


const activeItem = ref();
const showItem = ref( false );
// const ink:InkognitosInk;

async function execMethod( item: JsonFragment ){
  const signer = await getSigner();
  const provider = await getProvider();
  const inputs = item.inputs!.map( x=>( <any>x )._value );

  console.log( item );

  if( [
    "view", "pure",
  ].includes( item.stateMutability! ) ){
    console.log( "static" );
    console.log( Object.keys( contract.callStatic ).join( "\n" ) );

    const funcSignature = item.name! + ( ( item.inputs?.length || 0 ) ? (
      `(${ item.inputs!.map( x=>x.type ).join( "," ) })`
    ) : "()" );
    
    console.log( funcSignature );

    const funcs = contract.callStatic;
    const func = funcs[funcSignature];

    if( !func ){
      return;
    }
    
    try{
      const response = await func( ...inputs );
      
      console.log( response );
      ( Array.isArray( response ) ? response : [
        response,
      ] ).forEach( ( value, i ) => {
        /* @ts-ignore-next */
        item.outputs[i]._value = String( value );
      } );
    }catch( err ){
      console.log( err );
    }

    return;
  }


  const funcs = contract.connect( signer );

  console.log( funcs );
    
    
  const funcSignature = item.name! + ( ( item.inputs?.length || 0 ) ? (
    `(${ item.inputs!.map( x=>x.type ).join( "," ) })`
  ) : "()" );

  const func = contract?.[funcSignature];

  if( !func ){
    return;
  }

  const txn = await contract.connect( signer ).populateTransaction[item.name!](
    ...inputs
  );

  const response = await signer.sendTransaction( txn );
  
  
  console.log( response, response.data );
  ( Array.isArray( response ) ? response : [
    response,
  ] ).forEach( ( value, i ) => {
    item.outputs[i]._value = String( value );
  } );
}

const search = $ref( "" );

function searchRegex( search ){
  return new RegExp( search.split( /[^\w]+/ ).map( x=>`(${ x })` ).join( ".+" ), "gmi" );
}

</script>
<template lang="pug">
.card.h-100
  .card-header(
    v-if="name"
  )
    .row.g-2
      .col-12
        h3.m-0 {{name}}
      .col-12
        .row
          .col-auto
            code.small {{address}}
          .col-auto
            a(:href="`https://etherscan.io/address/${address}`").badge Etherscan
            a(:href="`https://opensea.io/assets/ethereum/${address}`").badge OpenSea
            a(:href="`https://looksrare.org/collections/${address}`").badge LooksRare
        
      .col-12
        input.form-control(
          type="search"
          placeholder="Search..."
          v-model="search"
        )

  .card-footer.scroll-y.p-0.border-top-0
    .list-group.list-group-flush
      template(v-for="item in state.methods")
        .list-group-item.list-group-item-action(
          @click="openItem(item)"
          v-if="item.name && (item.name).match(searchRegex(search))"
        )
          .g-2.row.align-items-stretch
            .col.monospace.small
              strong(v-html="search?item.name.replace(searchRegex(search), (x)=>(`<mark>${x}</mark>`) ):item.name")
              pre.d-inline
                | (
                .row(v-for="x in item.inputs").ps-3
                  .col-2 {{x.type}}
                  .col.strong {{x.name}},
                | )
            .col-auto.overflow-hidden
              .small.text-muted.faded.text-truncate.w-100 {{item.stateMutability}}
              
            //- .g-2.row.align-items-stretch
              .col
                .list-group
                  .list-group-item.py-1(v-for="field in item.inputs")
                    span {{field.name}}
                    small.faded :{{field.type}}
      
              .col(v-if="item.outputs.length")
                .list-group
                  .list-group-item.py-1(v-for="field in item.outputs")
                    .btn.rounded-pill.btn-light.btn-sm.shadow-none.text-start
                      span {{field.name}}
                      small.faded :{{field.type}}


  Teleport(to="#modals")
    ModalBox(
      v-if="activeItem"
      :value="activeItem"
      @close="activeItem=null"
    )
      template(#header)
        .d-flex.justify-content-between
          h5.m-0 {{activeItem.name}}
          .small
            .badge.border-dark.border {{activeItem.stateMutability}}
        
      form(
        @submit.prevent="execMethod(activeItem)"
      )
        .modal-body.border-top
          template(v-if="activeItem.inputs.length")
            small Inputs
            .my-2(
              v-for="(field,f) in activeItem.inputs"
            ).form-floating.monospace
              input.form-control(
                :placeholder="field.name"
                v-model="activeItem.inputs[f]._value"
              ).monospace
              label #[span.faded {{field.type}}] #[strong {{field.name||activeItem.name}}]

          .d-flex.align-items-end
            button(type="submit").btn.btn-primary.d-block
              | #[i.fa.fa-play] Run

        .modal-footer.d-block.border-top.bg-light1(v-if="activeItem.outputs.length")
            small Outputs
            .my-2(
              v-for="(field, f) in activeItem.outputs"
            ).form-floating.monospace
              pre.m-0.form-control(
                :placeholder="field.name||activeItem.name"
                readonly
              ).h-auto
                | {{activeItem.outputs[f]._value||'\u0000'}}
              label #[span.faded {{field.type}}] #[strong {{field.name||activeItem.name}}]



</template>
<style lang="scss" scoped>
mark{
  // margin: 0 -0.5rem;
  display: inline;
  padding: 0;
  margin: -0.5rem -0.5em;
  // padding: 0;
  // display: inline-block;
}

.scroll-y{
  overflow-x: auto;
  scroll-snap-type: y mandatory;
  scroll-snap-stop: always;
  .list-group-item{
    scroll-snap-align: start;
  }
}
</style>
