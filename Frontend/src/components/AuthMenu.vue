<script lang="ts" setup>
import { navUser } from "$/lib/nav";

</script>
<template lang="pug">
VDropdown(:placement="'bottom-end'")
  AuthStatus

  template(#popper)
    .card
      .list-group.list-group-flush
        template(v-for="item in navUser()")
          component(
            :is="item.path ? 'RouterLink' : 'div'",
            :to="item.path || null",
            @click="item.onClick"
          ).list-group-item.list-group-item-action.nowrap
            i.fa-fw(:class="item.icon")
            span(v-html="item.label")
</template>
<style lang="scss" scoped>
.menu {
  width: 10rem;
}
</style>
