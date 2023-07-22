<script lang="ts" setup>
import { clamp } from "$/lib/utils";


// Props
const props = withDefaults( defineProps<{
  itemCount : number
  pageSize: number;
  activePage: number;
}>(), {
  itemCount  : 1,
  pageSize   : 1,
  activePage : 1,
} );


// const pageCount = computed( () => {
//   return Math.ceil( props.itemCount / props.pageSize );
// } );

const pageCount = ref( 0 );

watch( () => props, ( {
  activePage, itemCount, pageSize,
} ) => {
  pageCount.value = Math.ceil( itemCount / pageSize );
}, {
  immediate : true,
  deep      : true,
} );

// Events
const emit = defineEmits<{
  ( event: "change", page: any ): void;
}>();



// Expose
defineExpose( {} );


</script>
<template lang="pug">

.row.g-2.flex-nowrap.align-items-center(
  v-if="pageCount > 1"
)
  .col-auto
    .btn.btn-outline-primary(
      @click="$emit('change', (activePage-1) )",
      :class="{ 'disabled': (activePage <= 1) }"
    ) #[i.fa.fa-chevron-left]

  .col-auto(
    style="max-width: 20rem;"
  )
    .btn-group
      .btn.btn-outline-primary(
        v-for="(page) in (pageCount)",
        @click="$emit('change', page )",
        :class="{'bg-light no-mouse': (activePage === page) }"
      )
        | {{page}}

  .col-auto
    .btn.btn-outline-primary(
      @click="$emit('change', (activePage+1) )",
      :class="{ 'disabled': (activePage > pageCount) }"
    ) #[i.fa.fa-chevron-right]

.row(v-else)
  .col

</template>
<style lang="scss" scoped>

</style>
