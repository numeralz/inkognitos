<script lang="ts" setup>


</script>
<template lang="pug">


RouterView(v-slot="{ Component, route }")
  component(:is="Component" :key="route.fullPath")

</template>
<style lang="scss" scoped>

.left-menu{
  min-width: 4rem;
  width: 20%;
}


//responsive
@include media-breakpoint-down(md){
  .nav-link{
    text-align: center !important;
    span{
      display: none;
    }
  }
}

.flex-column-lg{
  width: 100%;
}

</style>