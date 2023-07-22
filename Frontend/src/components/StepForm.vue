<script lang="ts" setup>
const slots = useSlots();
const scroller = ref<HTMLElement>();
const inner = ref<HTMLElement>();

// Props
const props = withDefaults( defineProps<{
  page: number;
}>(), {
  page : 0,
} );

const currPage = ref( props.page || 0 );

// Events
const emit = defineEmits<{
  ( event: "update:page", val: any ): void;
}>();



async function nextPage( n:number ){
  emit( "update:page", currPage.value );
}

watchEffect( async () => {
  props.page;
  currPage.value = Number(  props.page || 0 );

  try{
    inner.value!.style.transform = `translateX(${-currPage.value * 100}%)`;
  }catch( err ){
    // 
  }
}, {
  flush : "sync",
} );
// Expose
defineExpose( {} );


</script>
<template lang="pug">

.wrapper
  .slider(
    ref="scroller"
  )
    .row.g-3.flex-nowrap(
      ref="inner"
    ).slide.h-100
      .col-12(
        v-for="(slot, i) in Object.values(slots)"
        :key="i"
      )
        component(
          :is="slot",
          :nextPage="nextPage",
          :currPage="currPage"
        )
      
      

</template>
<style lang="scss" scoped>

.slide{
  transition: transform 0.5s ease;
}
.wrapper{
  overflow: hidden;
}
.slider{
  transition: all 0.5s ease;
  scroll-snap-type: x mandatory;
  .card{
    scroll-snap-align: start;
  }
  overflow:hidden;
}

</style>
