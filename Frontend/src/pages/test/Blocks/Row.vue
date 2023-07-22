<script lang="ts" setup>

// Props
const props = withDefaults( defineProps<{
  widths: number[];
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  //
  isLoading.value = false;
} );
// Expose
defineExpose( {} );


</script>
<template lang="pug">

.row
  .col(v-for)

</template>
<style lang="scss" scoped>

</style>
