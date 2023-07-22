<script lang="ts" setup>

import * as qr from "qrcode";

const showModal = ref( false );
const showCode = ref( false );
const qrUrl = ref( "" );
const qrCode = ref( "" );
const isLoading = ref( false );


async function genCode( force ){
  if( qrCode.value && !force ){
    return;
  }
  
  if( typeof window === "undefined" ) {
    return;
  }

  isLoading.value = true;

  try{
    const {
      data:path,
    } = await axios.request( {
      method : "post",
      url    : `/api/mobile-code${ force ? `?force=1` : "" }`,
    } );

    qrCode.value = await qr.toDataURL( `${ window.location.protocol }//${ window.location.host }${ path }`, {
      margin       : 0,
      scale        : 1,
      type         : "image/png",
      rendererOpts : {
        quality : 100,
      },
    } );
  } catch( error:any ){
    console.error( error );
  }
  
  setTimeout( () => {
    isLoading.value = false;
  }, 2000 );
}

</script>
<template lang="pug">


.btn(@click="showModal=!showModal").btn-outline-info
  i.fa-stack.fa-xs
    i.fa.fa-stack-2x.fa-tablet
    i.fa.fa-stack-1x.fa-pencil.fa-inverse

  Teleport(to="#modals")
    ModalBox(
      v-model:value="showModal"
      @close="showModal=false"
    )
      template(#header)
        h4.p-0 Tablet QR Code
      template(#default)
        template(
          v-if="showCode"
        )
          .modal-body.px-5
            .square.bg-light
              .inner
                img( :src="qrCode" )


        .modal-body(
          v-else
        ).flex-center
          .row.g-2
            .col-12
              .alert.alert-info.w-100.text-start.py-4
                .lead Continue drawing on your tablet
                hr
                ol
                  li Open camera or QR scanner on tablet
                  li Scan the QR code shown
                  li Tap the URL detected

            .col-12
              .alert.alert-warning.w-100.text-start.py-4
                ul.small
                  li It grants access to your draft library.
                  li Don't share with untrusted parties.
                  li It will #[strong not] give access to your wallet.
                  li It #[strong cannot] be used to publish.
                  li It #[strong cannot] be used to sign transactions.
                  li #[u.strong Reset Code] will disable previously generated codes.

        .modal-footer.justify-content-center.bg-light1
          .btn.btn-primary(
            @click="genCode(false);showCode=!showCode;"
          )
            span(v-if="showCode") #[i.fa.fa-eye-slash] Hide Code
            span(v-else) #[i.fa.fa-eye] Show Code
          .btn.btn-light(
            @click="genCode(true)"
            :class="{ disabled: (isLoading) }"
          ) #[i.fa.fa-sync] Reset Code



</template>
<style lang="scss" scoped>
.modal-body{
  white-space: normal;
}
img{
  image-rendering: pixelated;
  width: 100%;
}
</style>
