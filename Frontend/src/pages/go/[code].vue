<script lang="ts" setup>
import Index from "../index.vue";

const router = useRouter();
const code = router.currentRoute.value.params.code;


onMounted( () => {
  // router.push( {
  //   path   : "/",
  //   params : {
  //     code,
  //   },
  //   replace : true,
  // } );
} );


</script>
<template lang="pug">
Index(:code="code")

</template>
<style lang="scss" scoped>

</style>
