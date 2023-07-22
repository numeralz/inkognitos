<script lang="ts" setup>

const props = defineProps( {
  value : {
    type    : Boolean,
    default : false,
  },
} );

const emit = defineEmits<{
  ( event: "update:value", val: boolean ): void;
}>();

</script>
<template lang="pug">

span
  i.fa-stack(@click="emit('update:value', !props.value)")
    i.far.fa-circle.fa-stack-2x.faded
    Transition(name="slide", mode="out-in")
      i.fa.fa-times.fa-stack-1x(key="1" v-if="props.value")
      i.fa.fa-bars.fa-stack-1x(key="0" v-else)
      
</template>
<style lang="scss" scoped></style>
