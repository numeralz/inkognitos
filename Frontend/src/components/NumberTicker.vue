<script lang="ts" setup>
import { gsap } from "gsap";

// Props
const props = withDefaults( defineProps<{
  value: any;
  padLeft?: number;
  mod?: number;
}>(), {
  padLeft : 0,
} );

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

const tweened = reactive( {
  number : 0,
} );

watch(
  ()=>props.value,
  ( v, v0 ) => {
    if( v === v0 ) {
      return;
    }

    tweened.number = v;
    gsap.to( tweened, {
      duration : 1, number : Number( tweened.number ) || 0,
    } );
  },
  {
    immediate : true,
  }
);

const disp0 = ref( "0" );

const disp = computed( () => {
  return String(
    Math.round(
      props.mod ? ( tweened.number % props.mod ) : tweened.number
    )
  ).padStart( props.padLeft, "0" );
} );

watch(
  () => disp.value,
  ( curr: string, prev: string ) => {
    disp0.value = prev;
  }
);

const bank = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
];
</script>
<template lang="pug">

.row.g-0.flex-nowrap.mx-auto.overflow-hidden
  .col-auto(
    v-for="(I,i) in Math.max(disp0.length, disp.length)"
  ).stack
    .layer.digit(
      v-for="(D,d) in 10"
      :class="[ \
        (d === Number(disp.charAt(i))) ? 'current' :  \
        ( ( 10 + d - Number(disp.charAt(i)) )%10) > 5 ? 'next' : 'prev' \
      ]"
      :key="i"
    ) {{ String(d) }}


</template>
<style lang="scss" scoped>
.digit.layer {
  // align-self: center;
  // transform: translateY( 0 ) scale(1, 0);
  &.next {
    animation: none;
    transform-origin: top center;
    transform: translateY( 1em );
  }
  &.current {
    opacity: 1;
    transform-origin: center center;
    animation: elastic 0.5s linear forwards;
    transition: opacity 0.2s linear;
  
  }
  
  &.prev {
    opacity: 0;
    transition: opacity 0.2s linear;
    transform-origin: center bottom;
    // animation: none;
    transform: translateY( -1em );
  }
}
</style>
