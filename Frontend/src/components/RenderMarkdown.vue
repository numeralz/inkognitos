<script lang="ts" setup>

import MarkdownIt from "markdown-it";

var md = MarkdownIt( {
  html        : true,
  linkify     : true,
  typographer : true,
  breaks      : true,
  xhtmlOut    : true,
} );

// Props
const props = withDefaults( defineProps<{
  value: string;
  caretPos: number;
}>(), {
  caretPos : 0,
  value    : "",
} );

// Data
const isLoading = ref( false );
const html = ref( "" );

// Watch
watchEffect( async () => {
  const pos = props.caretPos;

  if( !pos ){
    html.value = md.render(
      props.value
    );

    return;
  }

  try{
    const before = props.value.slice( 0, pos );
    const after = props.value.slice( pos, props.value.length - 1 );

    html.value = md.render(
      `${before} | ${after}`
    );
  }catch( err ){
    html.value = "";
  }
}, {
  flush : "post",
} );
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


</script>
<template lang="pug">
div.article(
  v-html="html"
)


</template>
<style lang="scss" scoped>

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

:deep(mark){
  // animation: blink 1s infinite !important;
  opacity: 0.5;
  color: orange;
  transition: 0.1s;
  width: 0;
  display: inline-block;
  padding:0;
  margin-left: -0.5rem;
  margin-right: 0.5rem;
}

</style>
