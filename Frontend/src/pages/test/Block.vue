<template>
  <div class="root">
    <div
      v-for="(schema, index) in typeSchema"
      :key="index"
    >
      <component
        :is="schema.type"
        :key="index"
        :value="data[schema.state]"
        v-bind="schema"
        :data="data"
        @input="updateData(schema.state, $event)"
      />
    </div>
  </div>
</template>

<script>
import Input from "./Blocks/Input.vue";
import Render from "./Blocks/Render.vue";
export default {
  components : {
    Input,
    Render,
  },
  props : {
    typeSchema : {
      type : Array,
    },
    data : {
      type : Object,
    },
  },
  emits : [
    "input",
  ],
  methods : {
    updateData( state, event ) {
      this.$emit( "input", {
        state, value : event.target.value,
      } );
    },
  },
};
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
}
</style>