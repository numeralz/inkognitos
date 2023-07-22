<script lang="ts" setup>
import type { FactoryItem } from "$/store/session";
import userStore from "$/store/session";
import { BigNumber } from "ethers";

// Props
const props = withDefaults( defineProps<{
  value: FactoryItem;
  showWallet?: boolean;
}>(), {
  showWallet : false,
} );

const activeItem = toRef( props, "value" );

// Mounted
onMounted( async () => {
  if( !Object.values( inkColors.value ).length ) {
    await inkColors.value;
  }

  await userStore.loadInkColors();
  console.log( {
    inkColors : inkColors.value,
  } );
} );

const {
  inkColors, user, selectedAddress,
} = userStore.getState();

// Events
// const emit = defineEmits<{
//   ( event: "update:value", val: any ): void;
// }>();


// Expose
defineExpose( {} );

const materials = computed( () => {
  if( !activeItem.value.inkTokensUsed ){
    return [];
  }

  const inkTokensUsed =  activeItem.value.inkTokensUsed ||
  activeItem.value.permit?.inkIds?.reduce( ( inkTokensUsed, id ) => {
    inkTokensUsed[id] = activeItem.value.permit?.inkQtys[id];
  }, {} as any );

  const items = Object.entries( inkTokensUsed ).map( ( [
    tokenId, used,
  ] ) => {
    return {
      ...( inkColors.value?.[tokenId] ?? {} ),
      used,
      tokenId,
    };
  } ).filter( x=>x.maxSupply?.gt( 0 ) );

  console.log( items );
  
  return items;
} );



const isMyItem = computed( () => {
  return BigNumber.from( `${ selectedAddress.value || 0 }` ).eq( activeItem.value?.userAddress || 0 );
} );


</script>
<template lang="pug">
table.table.text-center.align-middle.m-0
  thead.small
    tr
      th Color
      th {{ (props.showWallet&&isMyItem)?'Used':'Qty' }}
      template(v-if="isMyItem && showWallet")
        th.striped In Wallet
  tbody
    template(
      v-for="(entry) in materials",
      :key="entry.color"
    )
      tr(
        :class="{ 'text-danger': showWallet && isMyItem && entry.myBalance?.lt(entry.used) }",
      ).monospace
        td
          i.fa-stack(:style="{ 'color': entry.color }")
            | #[i.fa-stack-2x.fas.fa-circle] #[i.fa-stack-1x.fa.fa-tint.fa-inverse]
          .ps-2.ms-n2.badge.text-dark.bg-white.border.shadow-sm {{ entry.color }}

        td.strong {{ entry.used }}

        template(v-if="isMyItem && showWallet")
          td(v-if="entry.myBalance") {{ entry.myBalance?.toString() }}
          td(v-else) #[i.fa.fa-spinner.fa-pulse]

</template>
<style lang="scss" scoped>
tr{
  transition: all 0.5s ease-in;
  td,th{
    text-align: start;
    &:last-child{
      text-align: end;
    }
  }
}
</style>
