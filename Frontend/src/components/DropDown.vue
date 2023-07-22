<script lang="ts" setup>

interface MenuItem {
  text: string;
  action: ( ctx:{
    setOpen:()=>void,
  } ) => void;
  href?: string;
  class?: string[]|string|Record<string, any>;
}
interface Divider {
  divider: true;
}

const props = withDefaults( defineProps<{
  items?: ( MenuItem|Divider )[]
}>(), {
  items : ()=>[],
} );

</script>
<template lang="pug">
VDropdown
  slot

  template(#popper)
    slot(name="menu" :scope="{items}" )
      .list-group
        .list-group-item.list-group-item(
          v-for="(item, index) in items",
        )
          slot(name="item" :scope="{item, items}")


</template>
<style lang="scss" scoped>

</style>
