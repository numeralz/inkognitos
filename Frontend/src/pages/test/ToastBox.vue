<script lang="ts" setup>
const isOpen = ref( false );

/*
-------------------------------------
Props
-------------------------------------
*/
const props = defineProps( {
  show : {
    type     : Boolean,
    default  : false,
    required : false,
  },
  text : {
    type     : String,
    default  : "",
    required : false,
  },
  title : {
    type     : String,
    default  : "",
    required : false,
  },
} );

/*
-------------------------------------
Events
-------------------------------------
*/
const emit = defineEmits<{
  ( event: "close" ): void;
  ( event: "open" ): void;
}>();

/*
-------------------------------------
Methods
-------------------------------------
*/
function setOpen( show: boolean ) {
  if ( show ) {
    // document.body.classList.add( "modal-open" );
    emit( "open" );
  } else {
    // document.body.classList.remove( "modal-open" );
    emit( "close" );
  }

  isOpen.value = show;
}

/*
-------------------------------------
Mounted
-------------------------------------
*/

let stopWatcher = watchEffect( () => {
  setOpen( props.show );
} );

onMounted( () => {
  isOpen.value = props.show;
} );
onBeforeUnmount( async () => {
  stopWatcher?.();
} );
/*
-------------------------------------
Expose
-------------------------------------
*/
defineExpose( {
  setOpen,
} );
</script>
<template lang="pug">
TransitionGroup(name="slide", mode="out-in")
  .toast(role="alert", aria-live="assertive", aria-atomic="true")
    .toast-header
      slot(name="image")
      strong.me-auto: slot(name="title")
      small: slot(name="time")
      button.btn-close(
        type="button",
        aria-label="Close",
        @click="setOpen(false)"
      )
    .toast-body
      slot
</template>
<style lang="scss" scoped>
.modal {
  z-index: 1000;
}
</style>
