<script lang="ts" setup>
import userStore from "$/store/session";


onMounted( async () => {
  try{
    await userStore.start();
  }catch( err: any ){
    console.log( err );
  }
} );
</script>
<template lang="pug">
.container-fluid
  RouterView(v-slot="{ Component, route }")
    Transition(name="horiz" mode="out-in")
      component(:is="Component" )
  
</template>
<style lang="scss" scoped>

</style>