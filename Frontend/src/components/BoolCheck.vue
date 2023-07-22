<script lang="ts" setup>
const props = defineProps( {
  value : {
    type    : Boolean,
    default : false,
  },
  loading : {
    type    : Boolean,
    default : false,
  },
  radio : {
    type    : Boolean,
    default : false,
  },
} );
</script>
<template lang="pug">
.align-middle.d-inline-block.overflow-hidden
  Transition(
    name="slide",
    mode="out-in"
    )
    div(key="loading" v-if="props.loading")
      i.fa.fa-spinner.fa-pulse.text-secondary.fa-fw
    div(key="active" v-else-if="props.value").active
      i.fa.fa-arrow-right(v-if="props.radio")
      i.fa.fa-check(v-else)
    div(key="inactive" v-else)
      i.fa.fa-circle.inactive

</template>
<style lang="scss" scoped>
.active {
  opacity: 1;
}
.inactive {
  opacity: 0.3;
}
</style>
