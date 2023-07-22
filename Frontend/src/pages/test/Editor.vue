<script lang="ts" setup>

import MonacoEditor from "vue-monaco-cdn";

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {
  value : "// javascript",
} );

onMounted( () => {
  // monaco.value.languages.registerCompletionItemProvider( "json", {
  //   provideCompletionItems ( model, position ) {
  //     // find out if we are completing a property in the 'dependencies' object.
  //     var textUntilPosition = model.getValueInRange( {
  //       startLineNumber : 1,
  //       startColumn     : 1,
  //       endLineNumber   : position.lineNumber,
  //       endColumn       : position.column,
  //     } );
  //     var match = textUntilPosition.match(
  //       /"dependencies"\s*:\s*\{\s*("[^"]*"\s*:\s*"[^"]*"\s*,\s*)*([^"]*)?$/
  //     );

  //     if ( !match ) {
  //       return {
  //         suggestions : [],
  //       };
  //     }

  //     var word = model.getWordUntilPosition( position );
  //     var range = {
  //       startLineNumber : position.lineNumber,
  //       endLineNumber   : position.lineNumber,
  //       startColumn     : word.startColumn,
  //       endColumn       : word.endColumn,
  //     };
  //     return {
  //       suggestions : createDependencyProposals( range ),
  //     };
  //   },
  // } );

  window.addEventListener( "resize", onResize );
} );

const monaco = ref<MonacoEditor>();

function onResize(){
  monaco.value?.layout();
}


function createDependencyProposals( range ) {
  // returning a static list of proposals, not even looking at the prefix (filtering is done by the Monaco editor),
  // here you could do a server side lookup
  return [
    {
      label         : "\"lodash\"",
      kind          : monaco.value.languages.CompletionItemKind.Function,
      documentation : "The Lodash library exported as Node.js modules.",
      insertText    : "\"lodash\": \"*\"",
      range,
    },
    {
      label         : "\"express\"",
      kind          : monaco.value.languages.CompletionItemKind.Function,
      documentation : "Fast, unopinionated, minimalist web framework",
      insertText    : "\"express\": \"*\"",
      range,
    },
    {
      label         : "\"mkdirp\"",
      kind          : monaco.value.languages.CompletionItemKind.Function,
      documentation : "Recursively mkdir, like <code>mkdir -p</code>",
      insertText    : "\"mkdirp\": \"*\"",
      range,
    },
    {
      label           : "\"my-third-party-library\"",
      kind            : monaco.value.languages.CompletionItemKind.Function,
      documentation   : "Describe your library here",
      insertText      : "\"${1:my-third-party-library}\": \"${2:1.2.3}\"",
      insertTextRules : monaco.value.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    },
  ];
}

const options = {

  scrollbar : {
    // Subtle shadows to the left & top. Defaults to true.
    useShadows : false,

    // Render vertical arrows. Defaults to false.
    verticalHasArrows   : false,
    // Render horizontal arrows. Defaults to false.
    horizontalHasArrows : false,

    // Render vertical scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    vertical   : "hidden",
    // Render horizontal scrollbar.
    // Accepted values: 'auto', 'visible', 'hidden'.
    // Defaults to 'auto'
    horizontal : "hidden",

    verticalScrollbarSize   : 2,
    horizontalScrollbarSize : 2,
    arrowSize               : 30,
  },
  
  minimap : {
    enabled : false,
  },
  // automaticLayout      : true,
  scrollBeyondLastLine : false,
  // lineNumbers          : "off",
  gutterWidth          : 2,
  glyphMargin          : false,
  folding              : false,
  // lineDecorationsWidth : 0,
  lineNumbersMinChars  : 3,
  renderLineHighlight  : "none",
};



</script>
<template lang="pug">

.container.py-4
  .card.border-dark
    .card-body.bg-light2
      .row
        .col
          code Typescript
          MonacoEditor(
            ref="monaco"
            v-model:value="value",
            language="typescript",
            :options="options"
          ).w-100.monaco
        .col
          code Template PUG
          MonacoEditor(
            v-model:value="value",
            language="pug",
            :options="options"
          ).w-100.monaco
        .col
          code Style SCSS
          MonacoEditor(
            v-model:value="value",
            language="scss"
            :options="options"
          ).w-100.monaco

</template>
<style lang="scss" scoped>
body{
  overflow: hidden;
}
.monaco{
  height: 400px;
  width: 100%;
  border-left: 1px solid;
}
</style>
