<script lang="ts" setup>

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


</script>
<template lang="pug">

.container
  .align-items-center.justify-content-center.d-flex
    .alert
      h1 Not Found
      div(@click="$router.back()").btn Back
      RouterLink(to="/").btn Home

</template>
<style lang="scss" scoped>
.h-100{
  height: 100vh;
}
</style>
