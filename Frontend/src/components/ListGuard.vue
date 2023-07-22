<script lang="ts" setup>

// Props
const props = withDefaults( defineProps<{
  justOne?: boolean,
  items?: any[];
  item?: any;
  loading?: boolean;
}>(), {
  items   : ()=>[],
  item    : null,
  justOne : false,
  loading : false,
} );

</script>
<template lang="pug">

slot(v-if="(justOne && item) || (!justOne && items?.length)")

template(v-else-if="loading")
  slot(name="loading")
  .striped-dark.animated.py-3.rounded.text-center(
    v-if="!$slots.loading"
  ).text-center
    .spinner-border.spinner-border-sm
      
template(v-else)
  slot(name="empty")

  template(
    v-if="!$slots.empty"
  )
    slot(name="emptyText")
      .striped-dark.py-3.rounded.text-center
        small.faded {{ justOne? "" : "Nothing to show." }}


</template>
<style lang="scss" scoped>

</style>
