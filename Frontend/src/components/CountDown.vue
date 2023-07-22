<script lang="ts" setup>


const props = defineProps( {
  to : {
    type     : Date,
    required : true,
  },
  labels : {
    type : Boolean,
  },
} );

const state = reactive( {
  years        : 0,
  weeks        : 0,
  days         : 0,
  _days        : 0,
  hours        : 0,
  minutes      : 0,
  seconds      : 0,
  milliseconds : 0,
  diff         : 0,
  active       : false,
} );

let interval: NodeJS.Timer;

onMounted( async () => {
  await tick();
  setTimeout( async () => {
    await tick();
    interval = setInterval( async () => {
      await tick();
    }, 1000 );
  }, 1000 - ( Date.now() % 1000 ) + 500 );
} );
onBeforeUnmount( async () => {
  if ( interval ) {
    clearInterval( interval );
  }
} );

const emit = defineEmits<{
  ( event: "done" ): void;
}>();

async function tick() {
  const now = new Date();
  const diff = new Date( props.to ).getTime() - now.getTime();

  if ( diff <= 0 ) {
    clearInterval( interval );
    state.active = false;
    emit( "done" );

    return;
  }

  const years = Math.floor( diff / ( 1000 * 60 * 60 * 24 * 7 * 52 ) );
  const weeks = Math.floor( diff / ( 1000 * 60 * 60 * 24 * 7 ) ) ;
  const days = Math.floor( diff / ( 1000 * 60 * 60 * 24 ) );
  const hours = Math.floor( diff / ( 1000 * 60 * 60 ) );
  const minutes = Math.floor( diff / ( 1000 * 60 ) );
  const seconds = Math.floor( diff / 1000 ) ;
  // const milliseconds = Math.floor( diff % 1000 );

  state.diff = diff;
  state.years = years;
  state.weeks = weeks % 52;
  state.days = days;
  state.hours = hours;
  state.minutes = minutes;
  state.seconds = seconds;
  // state.milliseconds = milliseconds;
  await nextTick();
  state.active = true;
}


</script>
<template lang="pug">

div.w-100
  .c-countdown(
    :class="{ showLabels: props.labels }",
    v-if="state.diff"
  )
    slot(name="default")

    //- pre {{ state }}
    
    .row(v-if="state.active").flex-nowrap.justify-content-around
      .col-auto.num(v-if="state.years>0")
        NumberTicker(
          :value="state.years"
          )
        .label years
      .col-auto.num(v-if="state.weeks>0")
        NumberTicker(
          :value="(state.weeks)"
          :mod="52"
          )
        .label weeks
      .col-auto.num(v-if="state.days>0")
        NumberTicker(
          :value="(state.days)"
          :mod="7"
          )
        .label days

      .col-auto.num(v-if="state.hours>0")
        NumberTicker(
          :value="(state.hours)"
          :mod="24"
          :padLeft="2"
          )
        .label hours

      .col-auto.num(v-if="state.minutes>0")
        NumberTicker(
          :value="(state.minutes)",
          :mod="60"
          :padLeft="2"
          )
        .label minutes

      .col-auto.num(v-if="state.seconds")
        NumberTicker(
          :value="(state.seconds)",
          :mod="60"
          :padLeft="2"
          )
        .label seconds

  div(v-else)
    slot(name="done")

</template>
<style lang="scss" scoped>
// @import "$/assets/theme";

.card-body {
  // line-height: 1 !important;
}

.row{
  .col-auto{
    padding-left: 0.1em;
    padding-right: 0.1em;
  }
}

.c-countdown {
  .label {
    display: none;
    font-size: 0.9rem !important;
    align-self: center;
    text-align: center;
    padding: $spacer * 0.1 $spacer * 0.4;
    letter-spacing: -0.1em;
  }
  &.showLabels {
    .label {
      display: block;
    }
  }
}
.sep {
  font-size: 3rem;
  vertical-align: middle;
  align-self: center;
  line-height: 0;
  opacity: 0.2;
  &::after {
    content: "";
  }
}
.num {
  text-align: center;
  display: flex;
  flex-direction: column;
  // align-items: center;
  justify-content: center;
}

</style>
