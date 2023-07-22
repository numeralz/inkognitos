<template lang="pug">
div
  label
    span {{ label }}:
    | {{ value }}
</template>

<script>
export default {
  name  : "TextDisplay",
  props : [
    "label", "value",
  ],
};
</script>

<style scoped>
div {
  width: 20rem;
}
label {
  font-size: 30px;
  color: #007840;
}
label:deep(span) {
  font-size: 20px;
  font-weight: 800;
  color: black;
}
</style>