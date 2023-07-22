<script lang="ts" setup>
const props = defineProps( {
  isActive : {
    type    : Boolean,
    default : false,
  },
  isDone : {
    type    : Boolean,
    default : false,
  },
} );
</script>
<template lang="pug">
Transition(
  name="horiz",
  mode="out-in",
  :style="`--delay:${2}`"
  )
  span(key="1" v-if="props.isDone")
    i.fa-stack
      i.fa.fa-circle.fa-stack-2x
      slot(name="done")
        i.fa.fa-stack-1x.fa-check.fa-inverse
  span(key="3" v-else-if="props.isActive")
    i.fa-stack
      i.fa.fa-circle.fa-stack-2x
      i.fa.fa-stack-1x.fa-inverse
        slot(name="active")
          slot
  span(key="4" v-else)
    i.fa-stack
      i.fas.fa-circle.fa-stack-2x.fa-inverse
      i.far.fa-stack-2x.fa-circle
      i.fa.fa-stack-1x
        slot
</template>
<style lang="scss" scoped></style>
