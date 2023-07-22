<script lang="ts" setup>

interface State {
  isLoading: boolean;
}

const state = reactive<State>( {
  isLoading : false,
} );

const route = useRoute();

onMounted( async () => {
  const id = route.params.id;
} );

</script>
<template lang="pug">
.page
  TokenItem(:tokenId="route.params.id")

</template>
<style lang="scss" scoped>
</style>