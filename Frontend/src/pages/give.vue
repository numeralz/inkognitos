<script lang="ts" setup>
import { getPassContract } from "$/store/session";


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

const to = ref( "" );
const qty = ref( "" );

async function give(){
  const pass = await getPassContract();

  try{
    await ( await pass.giveTo( to.value, qty.value ) ).wait();
  }catch( err ){
    console.log( err );
  }
}

</script>
<template lang="pug">

.container
  .row.g-4.my-3
    .col-6
      .card
        .card-body
          h6 Airdrop Pass
          form(@submit.prevent="give()").row.g-3
            .col
              input.form-control(
                v-model="to"
                placeholder="To"
              )
            .col-3
              input.form-control(
                v-model="qty"
                placeholder="Qty"
              )
            .col-auto
              button(type="submit").btn.btn-light Submit
      .card
        .card-body
          h6 Airdrop Pass
          form(@submit.prevent="give()").row.g-3
            .col
              input.form-control(
                v-model="to"
                placeholder="To"
              )
            .col-3
              input.form-control(
                v-model="qty"
                placeholder="Qty"
              )
            .col-auto
              button(type="submit").btn.btn-light Submit

            

</template>
<style lang="scss" scoped>

</style>
