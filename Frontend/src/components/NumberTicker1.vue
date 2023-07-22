<script lang="ts" setup>
import { BigNumber } from "@ethersproject/bignumber";

const frameRate = 8;
let stepRate = 0;
let lastTick = 0;

const props = defineProps( {
  value : {
    type    : Number,
    default : 0,
  },
  padLeft : {
    type    : Number,
    default : 1,
  },
  dir : {
    type    : Number,
    default : 0,
  },
} );

const state = reactive( {
  dispVal   : BigNumber.from( props.value ).toNumber(),
  targetVal : BigNumber.from( props.value ).toNumber(),
} );

let stopWatcher = watch(
  ()=>props.value,
  () => {
    state.targetVal = BigNumber.from( props.value ).toNumber();

    if ( state.targetVal === state.dispVal ) {
      return;
    }

    step();
  }
);

onMounted( async () => {
  step();
} );
onBeforeUnmount( async () => {
  stopWatcher?.();
} );

function clamp( val: number, min: number, max: number ) {
  return Math.min( Math.max( val, min ), max );
}

function step() {
  let diff = state.targetVal - state.dispVal;

  if ( Math.abs( diff ) < 0.5 ) {
    state.dispVal = state.targetVal;

    return;
  }

  if ( props.dir > 0 && diff < 0 ) {
    stepRate = diff;
  } else if ( props.dir < 0 && diff > 0 ) {
    stepRate = diff;
  } else {
    stepRate = diff * 0.05;
  }

  state.dispVal =
    state.dispVal + Math.sign( stepRate ) * Math.max( 1, Math.abs( stepRate ) );

  if ( Math.abs( stepRate ) > 1 ) {
    setTimeout( step, 1000 / frameRate );
  } else {
    setTimeout( step, ( stepRate * 1000 ) / frameRate );
  }
}

const digits = computed( () => {
  const num = Math.round( state.dispVal ).toString().padStart( props.padLeft, "0" );
  return num.split( "" );
} );
</script>
<template lang="pug">
.d-inline-block
  .row.g-0.flex-nowrap
    .col-auto(v-for="(digit, d) in digits")
      .position-relative
        span &nbsp;
        Transition(
          name="flickDown",
          type="transition",
          mode="out-in",
          v-for="(I, i) in 10",
          :key="`${i}`"
        )
          .digit.position-absolute.top-0.left-0(v-if="Number(digit) === i") {{ i }}
</template>
<style lang="scss" scoped>
.col-auto {
  text-align: center;
  width: 0.6em;
}
.digit {
  width: 0.5em;
  // transition: all 0.5s ease-out;
}
</style>
