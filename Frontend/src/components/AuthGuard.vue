<script lang="ts" setup>
import userStore, { sameAddress } from "$/store/session";

const {
  user,
  selectedAddress,
  hasSession,
} = userStore.getState();

</script>

<script lang="ts">
export default {
  inheritAttrs : true,
};
</script>
<template lang="pug">

div
  template(v-if="selectedAddress && sameAddress(user?.address, selectedAddress) ")
    slot
  template(v-else)
    slot(name="blocked")
      ModalBox(:value="true")
        template(#header)
          h5.m-0 Connect your wallet to continue.

        template(#default)
          .modal-body.flex-center.bg-light1
            AuthStatus.shake

</template>
<style lang="scss" scoped>

</style>
