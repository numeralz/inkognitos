<script lang="ts" setup>

import type { BigNumberish } from "ethers";

const props = withDefaults( defineProps<{
  name: string,
}>(), {} );

const ICONS = {
  eth : "/img/eth.svg",
};

// Data
const isLoading = ref( false );
const src = ref( "" );


// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

function imageError() {
  hasError.value = true;
}

const hasError = ref( false );
</script>
<template lang="pug">
.square.rounded-circle
  img.inner.rounded-circle(
    @error.native="imageError"
    :src="ICONS[props.name]"
    :alt="name"
    v-if="!hasError"
  )
  .inner.rounded-circle.bg-light(v-else)

</template>
<style lang="scss" scoped>
.square{
  width: 2rem;
}
img{
  margin:0;
}
.rounded-circle{
  border-radius: 50% !important;
}
</style>
