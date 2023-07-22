

<script lang="ts" setup>

// Props
const props = withDefaults(
  defineProps<{
    src: any,
  }>(),
  {
    src : null,
  }
);

// State
const isLoading = ref( false );

// Emits
const emit = defineEmits<{
  // ( event: "update:value", val: any ): void;
}>();

// Expose
defineExpose<{
  value: any,
}>( {
  value : props.src,
} );

</script>
<template lang="pug">
  
div
  img(:src="props.src")

</template>
<style lang="scss" scoped>
img{
  margin:0;
}
</style>