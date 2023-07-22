<script lang="ts" setup>
const slots = useSlots();

const props = withDefaults(
  defineProps<{
    step?: number;
  }>(),
  {
    step : 0,
  }
);

function isActive( s: string | number ) {
  return props.step === Number( s );
}

function isDone( s: string | number ) {
  return props.step > Number( s );
}

function isAfter( s: string | number ) {
  return props.step < Number( s );
}


</script>
<script lang="ts">
export default {
  inheritAttrs : true,
};
</script>
<template lang="pug">
.list-group
  .list-group-item.py-3(
    v-for="(slot, s) in slots",
    :class="[  isDone( s )?'text-gray alert-success':  isActive( s )?'z-top text-success shadow-lg':  'text-black' ]"
  )
    div(v-if="slot && slot()[0]")
      .row.g-3.align-items-center
        .col-auto
          StepIcon(:isActive="isActive(s)", :isDone="isDone(s)")
            | {{ s }}

        .col
          slot(:name="s", :active="isActive(s)")
</template>
<style lang="scss" scoped></style>
