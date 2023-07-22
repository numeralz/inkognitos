<script lang="ts" setup>

const props = defineProps( {
  value : {
    type : [
      String, Date,
    ],
    default : new Date(),
  },
  time : {
    type    : Boolean,
    default : false,
  },
  noDate : {
    type    : Boolean,
    default : false,
  },
} );

const now = computed( () => {
  return new Date( props.value );
} );

const year = computed( () => {
  return now.value.getFullYear();
} );

const month = computed( () => {
  return now.value.getMonth();
} );

const date = computed( () => {
  return now.value.getDate();
} );

const hours = computed( () => {
  return now.value.getHours();
} );

const minutes = computed( () => {
  return now.value.getMinutes();
} );
</script>
<template lang="pug">
span
  span.mx-1(v-if="!props.noDate" :title="now.toDateString()")
    | #[i.fa-xs.fa-fw.far.fa-calendar.d-none.d-md-inline-block] {{ now.toLocaleDateString() }}
  span.mx-1(v-if="props.time" :title="now.toTimeString()")
    | #[i.fa-xs.fa-fw.far.fa-clock.d-none.d-md-inline-block] {{ now.toLocaleTimeString() }}
</template>
<style lang="scss" scoped>
em {
  margin: 0 0.1rem;
  opacity: 0.5;
  font-style: normal;
  vertical-align: middle;
  line-height: 1em;
}
</style>
