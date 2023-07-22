<script lang="ts" setup>

/*  */
const props = withDefaults( defineProps<{
    value: boolean
   }>(), {} );

const emit = defineEmits<{
  ( event: "update:value", val: boolean ): void
}>();

const colorValue = ref<string>( "#000000" );
const colors = ref<string[]>( [] );

</script>
<template lang="pug">
ModalBox(
  :value="value"
)
  template(#header): h4.m-0 OG Colors
  .modal-body.bg-light
    p Airdrop opportunity! Help us pick the colors of the INK that will be available at launch.
    p If your color ends up one of the top colors, We'll airdrop an ink-pack to your wallet, when we launch!
    .row.g-3
      .col-12
        .card
          .card-body
            h5 New Color
            .row
              .col
                .input-group
                  input(type="color" v-model="colorValue").form-control.form-control-color.p-1.rounded-lg
                  .input-group-append.input-group-text
                    strong.monospace {{ colorValue}}

              .col-auto
                button.btn.btn-primary
                  | #[i.fa.fa-lock.faded.fa-fw] Submit

              

      .col-12.scroll-y
        .row.g-3
          .col-2
            .card.shadow
              .square.bg-light
                .inner(:style="`background-color: ${ colorValue }`").card-body


</template>
<style lang="scss" scoped>

</style>
