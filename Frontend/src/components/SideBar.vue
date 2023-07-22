<script lang="ts" setup>
import { onClickOutside } from "@vueuse/core";


const props = defineProps( {
  value : {
    type    : Boolean,
    default : false,
  },
  side : {
    type    : String,
    default : "",
  },
  noOverlay : {
    type    : Boolean,
    default : false,
  },
} );

// Data
const isOpen = ref();

// Watch

onMounted( async () => {
  setOpen( false );
  watch(
    ()=>props.value,
    ( v, v0 ) => {
      if( v !== v0 ) {
        setOpen( v );
      }
    }
  );
} );

// Methods
function setOpen( show: boolean ) {
  if ( show ) {
    emit( "open" );
    document.addEventListener( "keydown", onKeyDown );
  } else {
    emit( "close" );
    document.removeEventListener( "keydown", onKeyDown );
  }

  emit( "update:value", show );
  isOpen.value = show;
}

function onKeyDown( e : KeyboardEvent ){
  console.log( e );
  
  if( e.code === "Escape" ){
    setOpen( false );
    e.stopPropagation();
    e.preventDefault();
  }
}

// Events
const emit = defineEmits<{
  ( event: "close" ): void;
  ( event: "open" ): void;
  ( event: "update:value", val: boolean ): void;
}>();

// Exposed
defineExpose( {
  setOpen,
} );

const wrapper = ref();

onClickOutside( wrapper, () => {
  if( !props.noOverlay ) {
    nextTick( () => {
      setOpen( false );
    } );
  }
} );

const slots = useSlots();
</script>
<template lang="pug">
.sidebar-wrapper(
  :class="[side, value&&'show']"
)
  .modal-backdrop(
    v-if="!noOverlay"
    tabindex="-1",
  )

  .d-flex.flex-column.flex-shrink-0.bg-light(
    ref="wrapper",
  ).sidebar

    //- .card.d-flex.flex-column.h-100(
    //-   @click.self.stop="setOpen(true)"
    //- ).scroll-y
    .p-3.border-bottom.bg-white(v-if="slots.header")
      .row.g-3
        .col-auto.flex-center
          .btn.btn-close(
            @click.passive="$nextTick(()=>setOpen(false))"
          )
        .col
          slot(name="header")

    .flex-grow-1.p-3(
      @click.passive="$nextTick(()=>setOpen(false))"
    )
      slot(v-bind="{ setOpen }")

    .flex-shrink-0.bg-white.border-top(
      v-if="slots.footer"
      @click.passive="$nextTick(()=>setOpen(false))"
    ).p-3
      slot(name="footer")

</template>
<style lang="scss" scoped>
$sidebarWidth: 25em;

.sidebar:focus {
  border: unset;
  outline: unset;
}

.sidebar{
  width: $sidebarWidth;
  height: 100vh;
  position: fixed;
  z-index: 1055;
  top: 0;
  transition: transform 0.25s ease-out;
}

.sidebar-wrapper {
  width: 100%;
  height: 100%;

  &.right {
    .sidebar{
      right: 0;
      left: unset;
      transform: translateX($sidebarWidth);
    }

    &.show{
      .sidebar{
        transform: translateX(0);
      }
    }
  }
  &.left {
    .sidebar{
      left: 0;
      right: unset;
      margin-left: -1 * $sidebarWidth;
    }

    &.show{
      .sidebar{
        transform: translateX($sidebarWidth);
      }
    }
  }
}
</style>
