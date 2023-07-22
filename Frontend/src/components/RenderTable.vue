<script lang="ts" setup>

// Props
const props = withDefaults( defineProps<{
  value: Array<any>;
  headings: ( [key:string, options:any]|string )[]
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


function headingKey( heading:string|string[] ){
  return Array.isArray( heading ) ? ( heading[1] || heading[0] ) : heading;
}

</script>
<template lang="pug">

table.table.table-bordered
  thead.text-center
    tr
      //- th
        | #
      th(v-for="heading in headings" :key="headingKey(heading)")
        | {{ headingKey(heading) }}
  tbody
    tr(v-for="item in value")
      th(v-for="heading,h in headings" :key="headingKey(heading)")
        slot(:name="Object.keys($slots)[h]" v-bind="{item}")
          | {{ item[headingKey(heading)] }}

</template>
<style lang="scss" scoped>

</style>
