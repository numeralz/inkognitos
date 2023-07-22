<script lang="ts" setup>
import type abi from "@ethersproject/abi";
import type { ContractInterface } from "ethers";



const props = withDefaults( defineProps<{
  abi: ContractInterface,
  address: string,
  name: string,
  showSearch: boolean,
  showHeader: boolean,
  actions: boolean,
}>(), {} );


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

onMounted( async () => {
  const abi = props.abi as abi.JsonFragment[];

  state.methods = abi
  .filter( ( item ) => {
    return item.type === "function";
  } )
  .map( ( item:any ) => {
    const inputs = item.inputs.map( ( field ) => {
      return {
        ...field,
        _value : "",
      };
    } );

    const outputs = item.outputs.map( ( field ) => {
      return {
        ...field,
        _value : "",
      };
    } );

    return {
      ...item,
      inputs,
      outputs,
    };
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


function execMethod( item: any ){
//
}

</script>
<template lang="pug">
.card(v-if="props.showHeader || props.showSearch")
  .card-header.bg-white(v-if="(props.name && props.address) && props.showHeader")
    .row.g-3.align-items-center
      .col
        h3 {{props.name}}
      .col-auto
        code {{props.address}}

  .card-body(v-if="props.showSearch")
    input.form-control(
      placeholder="Search..."
    )

.scroll-y(style="max-height: 50vh")
  .list-group
    .list-group-item(
      v-for="item in state.methods"
      @click="props.actions && openItem(item)"
      :class="{'list-group-item-action':props.action,'list-group-item-light': (item.stateMutability==='view'), \
      'text-info': (item.stateMutability!=='view'), \
      }"
    ).p-0
      .g-1.row.align-items-center
        .col-1.small.faded.text-end
          .badge.bg-light {{item.stateMutability}}

        .col.p-2.border-end
          .row.g-2.align-items.align-items-center
            .col-auto
              strong {{item.name}}
            .col
              .row.g-1.flex-nowrap
                .col
                  .btn-group
                    .btn(v-for="field in item.inputs").btn-sm
                      span {{field.name}}
                      small.faded  :{{field.type}}
        
        .col-auto(v-if="item.outputs.length")
          .btn-group.btn-group-sm
            .btn(v-for="field in item.outputs").shadow-none.text-start
              span {{field.name}}
              small.faded  :{{field.type}}



  ModalBox(
    :value="activeItem"
    @close="activeItem=null"
  )
    template(#header)
      .justify-content-between.d-flex.py-1.align-items-center
        h5 {{activeItem.name}}
        div.small.text-end
          //- div: .badge.bg-white {{activeItem.type}}
          .badge.bg-dark {{activeItem.stateMutability}}
      

    .card-body
      label Inputs
      .my-2(
        v-for="field in activeItem.inputs"
      )
        .row
          .col
            .form-floating
              input.form-control(
                :placeholder="field.name"
                v-model="field._value"
              )
              label #[span.text-success {{field.name}}] #[i.faded :{{field.type}} ]


    .card-body(v-if="activeItem.outputs.length")
      label Returns
      .list-group.list-group-flush.my-2
        .list-group-item.bg-light(
          v-for="field in activeItem.outputs"
        )
          | #[i.text-success {{field.name}}]#[i.text-danger :{{field.type}} ]

    .card-body.text-center.bg-light(@click="execMethod(activeItem)")
      | #[i.fa.fa-play] Run

</template>
<style lang="scss" scoped>

</style>
