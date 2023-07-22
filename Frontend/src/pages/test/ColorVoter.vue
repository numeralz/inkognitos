<script lang="ts" setup>

const props = withDefaults( defineProps<{
    value?: boolean
  }>(), {
  value : true,
} );

const colorValue = ref<string>( "#000000" );


</script>
<template lang="pug">

.card-body.bg-light1
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
