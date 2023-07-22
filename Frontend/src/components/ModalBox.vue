<script lang="ts" setup>
import type { TinyEmitter } from "tiny-emitter";

interface ModalBoxProps {
  value?: boolean;
  text?: string;
  title?: string;
  fullscreen?: boolean;
  emitter?: TinyEmitter;
  noClose?: boolean,
  actions?: {
    text: string;
    action: ( ctx:{
      setOpen:()=>void,
    } ) => void;
    class?: string[]|string|Record<string, any>;
  }[];
}

// Props
const props = withDefaults(
  defineProps<ModalBoxProps>(),
  {
    value : true,
  }
);

// Data
const isOpen = ref( props.value );

// Watch
watch(
  ()=>props.value,
  ( v, v0 ) => {
    if( v !== v0 ) {
      setOpen( v );
    }
  }
);

// Methods
function setOpen( show: boolean ) {
  if( props.noClose ){
    return;
  }

  emit( "update:value", show );
  isOpen.value = show;

  if ( show ) {
    props.emitter?.emit( "open" );
    emit( "open" );
  } else {
    props.emitter?.emit( "close" );
    emit( "close" );
  }
}

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

function onKeyDown( e: KeyboardEvent ) {
  if ( e.code === "Escape" ) {
    setOpen( false );
    e.stopPropagation();
    e.preventDefault();
    removeEventListener( "keydown", onKeyDown );
  }
}

onMounted( async () => {
  if( typeof window !== "undefined" ) {
    window.removeEventListener( "keydown", onKeyDown );
    window.addEventListener( "keydown", onKeyDown );
  }
} );



</script>
<template lang="pug">

.modal(
  :class="isOpen?'d-block show':''"
  :tabindex="-1"
)
  
  .modal-backdrop(
    tabindex="-1"
    @click.stop="setOpen( false )"
  ).w-100.pos-rel
    
    slot(name="backdrop")
  
  .modal-dialog.modal-dialog-scrollable.modal-dialog-centered(
    :class="props.fullscreen ? 'modal-fullscreen' : ''"
  ).appear
    .modal-content(
      ref="wrapper"
    )
      .modal-header.w-100
        .row.g-3.align-items-center
          .col-auto(v-if="!noClose")
            .bg-light1.w3.rounded-circle(@click="setOpen(false)")
              .square
                .flex-center
                  | #[i.fa.fa-times.fa-xl]

          .col
            slot(name="header")
              h6.m-0 {{ props.title || props.text || "" }}

      template(v-if="props.text && props.title")
        .modal-body.appear
          | {{ props.text }}

        template(v-if="props.actions?.length")
          .modal-footer
            .row
              .col-auto(v-for="({ text, action, clas },i) in props.actions")
                .btn(
                  :class="clas"
                  @click="action?.( { setOpen } )"
                ) {{ text }}

      template(v-else)
        slot(v-bind="{ setOpen }")

        

</template>
<style lang="scss" scoped>
.modal{
  .modal-dialog.modal-dialog-scrollable{
  }
  overflow: visible;
  overflow-y: auto;
}

.modal-content {
  overflow: visible;
  // overflow-x: hidden;
}
.modal-header{
  display: block;
}
.modal-fullscreen {
  height: 100vh;
  overflow-y: auto;
  // .modal-header {
  //   display: none;
  // }
  & > .modal-content {
    // width: 100%;
    border-radius: 0;
    height: 100%;
  }
}
</style>
