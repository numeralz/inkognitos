<script lang="ts" setup>

import bjork from "$/lib/bjorklund";
import * as Tone from "tone";
import { getPhi } from "$/lib/utils";
import random from "random";

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

function rotateArray( a:any[], num: number ){
  return [
    ...a.slice( Math.round( num ) ),
    ...a.slice( 0, -Math.round( num ) ),
  ];
}

const rings = 6;
const loopTime = 8;
const pattens : number[][] = [];

// Mounted
onMounted( async () => {
  isLoading.value = true;
  window.addEventListener( "mousedown", async () => {
    await Tone.start();

    const synth = new Tone.PolySynth( Tone.Synth, {
      volume     : 0.4,
      oscillator : {
        type : "amtriangle12",
      },
      // detune     : 0.1,
      portamento : 0.01,
      envelope   : {
        attack : 0.01,
        decay  : 0.5,
      },
    } ).toDestination();

    // synth.triggerAttackRelease( "C4", "8n" );

    const t = ref( 0 );
    const rando = random.normal( 0.5, 1 );

    for( let i = 0; i < rings; i++ ){
      const Os = 8 * Math.round( Math.log( 1 + 20 * i * Math.random() ) );
      const Xs = Math.round( Os * rando() );
      const tickTime = loopTime / ( Os );
      const pattern = rotateArray( bjork(  Xs, Os ), Math.random() * Os );

      pattens[i] = pattern;
      items.value.push( pattern );

      let t = 0;

      const loop = new Tone.Sequence( ( time, val ) => {
        if( val ){
          synth.triggerAttackRelease( 440 * Math.pow( 2, ( ( 5 * i ) / 12 ) - 3 ), tickTime, time, 1.5 * ( 1 - Xs / Os ) );
        }
      }, pattern, tickTime ).start( Tone.now() );

      loop.loopEnd = loopTime;
    }
    
    Tone.Transport.start();
  }, {
    once : true,
  } );
  //
  isLoading.value = false;
} );



// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );

const items = ref<number[][]>( [] );

</script>
<template lang="pug">

.container.py-4
  div.h-100.pos-abs.border(
    style="`left: ${100*Tone.Transport.progress  }%`"
  )
  table.table.table-bordered(
    v-for="item in items"
  ).w-1000
    tbody
      tr
        td(
          v-for="slot in item"
          :class="[slot?'bg-light':'', 'border-dark']"
        ).p-1
          .square(
            :class="['border-dark']"
          )
            .inner
              //- span {{ slot}}


</template>
<style lang="scss" scoped>

</style>
