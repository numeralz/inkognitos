<script lang="ts" setup>
import userStore from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  //
  isLoading.value = false;
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );

const errorMessage = ref( "" );
const currPage = ref( 0 );

const socialFields = reactive( {
  discordName : "",
  twitterName : "",
} );


async function stepNext(){
  switch( currPage.value ){
  case  0:{
    currPage.value = 1;

    break;
  }

  case  1:{
    if( !socialFields.discordName ){
      return;
    }

    try{
      currPage.value = 2;

      const {
        signature,
        address,
        message,
      } = await userStore.signData( [
        [
          "discordName",
          "string",
          socialFields.discordName,
        ],
        [
          "time",
          "uint256",
          new Date().getTime(),
        ],
      ] );

      try{
        const {
          data,
        } = await axios.request( {
          method : "post",
          url    : `/api/me/social`,
          data   : {
            signature,
            message,
          },
        } );
      } catch( error:any ){
        errorMessage.value = error.response.data.message;
      }
    }catch( err: any ){
      errorMessage.value = err.message;
    }

   
    break;
  }
  }
}

const  {
  selectedAddress,
} = userStore.getState();



</script>
<template lang="pug">


form(@submit.prevent="stepNext()").form.w-100
  .row.align-items-center.g-2
    .col-12.appear(:style="`--delay:${1*0.5}`")
      .form-floating
        .form-control.text-muted.overflow-hidden.nowrap {{ selectedAddress }}
        label Wallet Address

    .col-12.appear(:style="`--delay:${2*0.5}`")
      .form-floating
        input.form-control.input-group-prepend(
          placeholder="Discord Username"
          v-model="socialFields.discordName"
        )
        label Discord Username

    .col-12
      button.btn.btn-white(
        :class="{disabled: !socialFields.discordName}"
      ) Sign Up #[i.fa.fa-fw.fa-chevron-right]


//-
  StepForm(
    v-model:page="currPage"
    tabindex="-1"
    @focusin="()=>currPage = Math.max(currPage, 1)"
  ).rounded-2
    template(#intro)
      div.h-100.bg-white
        .row.h-100.flex-nowrap
          .col.h-100
            .p-3
              h2 Follow Us

              ul
                li Giveaways
                li Added to our early private mint

              ul
                li Beta-testing upcoming releases
                li Promote community engagement
                li Suggest improvements
        .d-flex.w-100
          .btn.btn-white.align-self-end Sign Up #[i.fa.fa-fw.fa-chevron-right]

    template(#c)
      div.h-100.bg-white
        .row.g.flex-center
          .col.flex-center
            .p-3.w-100
              form(@submit.prevent="stepNext()").form.w-100.overflow-hidden
                .row.align-items-center.g-2
                  .col-12.appear(:style="`--delay:${1*0.5}`")
                    .form-floating
                      .form-control.text-muted.overflow-hidden.nowrap {{ selectedAddress }}
                      label Wallet Address

                  .col-12.appear(:style="`--delay:${2*0.5}`")
                    .form-floating
                      input.form-control.input-group-prepend(
                        placeholder="Discord Username"
                        v-model="socialFields.discordName"
                      )
                      label Discord Username

                .row.align-items-end
                  .col-auto
                    button.btn.btn-white(
                      :class="{disabled: !socialFields.discordName}"
                    ) Sign Up #[i.fa.fa-fw.fa-chevron-right]

    template(#d)
      .card.h-100(
        @click="errorMessage=''; currPage=1"
        :class="[errorMessage? 'bg-danger': 'alert-info striped-dark animated']"
      ).align-items-center.justify-content-center.h-100.text-white
        div(v-if="errorMessage")
          h2 Error
          div {{ errorMessage }}
          hr.border-white
          .btn.btn-white(
            @click="errorMessage = ''; currPage=1"
          ): i.fa.fa-chevron-left

        div(v-else)
          i.fa.fa-spinner.fa-spin.fa-4x

        
    template(#last)
      .card.h-100.bg-success
        .card-body
          h1 Thanks!
          hr
          p We're sending you some testnet coins you can use to interact with the testnet contracts.

</template>
<style lang="scss" scoped>

</style>
