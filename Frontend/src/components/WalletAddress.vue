<script lang="ts" setup>
import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "ethers";

const props = withDefaults(
  defineProps<{
    address: string;
    me?: string;
    noLabel?: boolean;
    size?: string;
  }>(),
  {
    address : "",
    me      : "",
    noLabel : false,
    size    : "",
  }
);

const isMyAccount = computed( () => {
  return (
    props.me &&  props.address  &&
    BigNumber.from( props.me ).eq( BigNumber.from( props.address ) )
  );
} );

</script>
<template lang="pug">
div
  JazzIcon(
    :address="address"
    :noLabel="noLabel"
    :size="size"
  )
    //- template(#suffix)
      .btn-group(v-if="!noLabel")
        a.btn.btn-link(
          :href="`https://etherscan.io/address/${BigNumber.from(props.address).toHexString()}`",
          target="_blank",
        )
          i.fa.fa-fw.fa-external-link
          

</template>
<!--  -->
<style lang="scss" scoped></style>
