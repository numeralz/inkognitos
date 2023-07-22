<script lang="ts" setup>
import userStore, { sameAddress } from "$/store/session";
// import { useAxios } from "@/composables/useAxios";
import { BigNumber } from "@ethersproject/bignumber";


const {
  selectedAddress, user,
  isMobile, hasSession, wrongChain,
  provider, serverChain,
} = userStore.getState();

const isLoading = ref( false );
const isReady = ref( false );

onMounted( async () => {
  await signIn();
  isReady.value = true;
} );

const props = withDefaults(
  defineProps<{
    label?: boolean;
  }>(),
  {
    label : false,
  }
);

async function signIn( hard = false ) {
  console.log( "SIGNIN" );
  
  if ( hard ) {
    isLoading.value = true;
  }

  try {
    await userStore.start( hard );
  } catch ( error: any ) {
    console.log( error );
  }

  isLoading.value = false;
}

const isTestnet = computed( () => {
  if ( !serverChain.value?.chainId ) {
    return false;
  }

  return !BigNumber.from( serverChain.value?.chainId || 0 ).eq( 1 );
} );

const emit = defineEmits<{
  ( event: "clickAccount" ): void;
}>();

const needVerify = computed( () => {
  return !user.value?.address || !sameAddress( user.value?.address, selectedAddress.value );
} );

const errorMessage = ref<string>( "" );
</script>
<template lang="pug">
div.d-flex.align-items-center.justify-content-center
  Transition(name="slide", mode="out-in")
    .btn.btn-white(v-if="!isReady || isLoading", key="loading").flex-center.overflow-hidden
      | #[.spinner-border.spinner-border-sm.mx-2] Check wallet.
      
    .btn(
      v-else-if="wrongChain"
      key="wrongChain"
      @click.stop="userStore.useCorrectChain()"
    )
        span(v-if="errorMessage") {{ errorMessage }}
        span(v-else) #[i.fa.fa-fw.fa-exclamation-triangle] #[span.d-none.d-md-inline Change network]

    .btn.btn-primary(
      v-else-if="!selectedAddress"
      key="noAccount"
      @click.stop="signIn(true)"
    )
      strong #[i.fa.fa-fw.fa-wallet] #[span.d-none.d-md-inline Connect]


    .btn-toolbar.d-flex(
      v-else
      key="account"
    ).pointer.d-flex.rounded-3.flex-nowrap
      .btn(
        @click="emit('clickAccount')",
        style="max-width: 10rem"
      ).btn-light.overflow-hidden
        JazzIcon(
          noCopy,
          noProfile,
          :noLabel="!props.label",
          :address="selectedAddress",
          :class="{faded: needVerify }"
          size="1.5em"
        )

      .btn.btn-primary.shake(
        title="Verify your wallet",
        @click.stop="signIn(true)"
        v-if="needVerify"
      )
        strong Verify Wallet #[i.fa.fa-chevron-right]
      
      template(
        v-else
      )
        .btn.btn-light2.disabled(title="Admin", v-if="user?.isAdmin"): i.fa.fa-fw.fa-bolt.text-success
        .btn.btn-light2.disabled(title="Mobile", v-if="isMobile"): i.fa.fa-fw.fa-mobile.text-info
        .btn.btn-light2.disabled(title="Testnet", v-if="isTestnet"): i.fa.fa-fw.fa-exclamation-circle.text-info

              

</template>

<style lang="scss" scoped>
// .loading {
//   min-width: 13rem;
// }

// .card-body{
//   padding: 0.5rem;
// }
</style>
