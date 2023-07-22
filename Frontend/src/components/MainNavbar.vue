<script lang="ts" setup>
import userStore, { sameAddress } from "$/store/session";
import { navMain, navGeneral, navUser } from "$/lib/nav";

// Data
const sidebarOpen = ref( false );

const {
  user,
  selectedAddress,
  hasSession,
} = userStore.getState();
</script>

<template lang="pug">
.sticky-top
  nav.navbar.navbar-expand.navbar-dark.py-0.bg-dark.border-bottom
    .container.d-flex.align-items-center
      .me-2.nav-item.py-2
        SocialIcons
      .nav.navbar-nav.ms-auto.flex-wrap
        template(
          v-for="item in navGeneral()"
        )
          .nav-item
            component.nav-link(
              :to="item.path"
              aria-current="page"
              @click="item.onClick"
              :is="(!!item.path)?'RouterLink':'a'"
            )
              span(v-html="item.label")

  div.bg-white.shadow
    .container-fluid
      .row.g-1.align-items-center.py-2.justify-content-between
        .col-auto.me-3.nav-item
          RouterLink.nav-item(
            to="/"
          )
            AppLogo

        .col-auto.d-md-none
          .btn(
            @click="sidebarOpen=true"
          ): i.fa.fa-hamburger

        .col.d-none.d-md-block
          .row.g-2
            .col.d-flex
              template(
                v-for="item in navMain()"
              )
                .nav-item.mx-1
                  component.btn.btn-light(
                    :is="item.path?'RouterLink':'a'"
                    :to="item.path"
                    @click="item.onClick"
                  )
                    span(v-html="item.label").d-none.d-md-inline
                    i.fa(:class="item.icon").d-md-none

            .col-auto.nav.ms-auto
              template(
                v-for="item in navUser()"
              )
                .nav-item
                  component.nav-link(
                    :to="item.path"
                    @click="item.onClick"
                    :is="item.path?'RouterLink':'a'"
                  )
                    span(v-html="item.label")

              .nav-item.ms-2
                AuthStatus(
                  label
                  @click-account="$router.push('/account')"
                )
  


    Teleport(to="#modals")
      SideBar(
        v-model:value="sidebarOpen"
        side="right"
      ).d-md-none
        template(#header)
          AppLogo

        .card
          .card-body
            ul.nav.flex-column.nav-pills
              li.nav-item(
                v-for="item in navMain()"
              )
                component(
                  v-if="item"
                  :is="item.path?'RouterLink':'a'"
                  :to="item.path"
                  @click="item.onClick"
                ).nav-link.d-flex
                  .me-2
                    i.fa-fw(:class="item.icon")
                  span(v-html="item.label")

            hr.mx-3
            ul.nav.nav-pills.flex-column.mb-auto
              li.nav-item(
                v-for="item in navGeneral()"
              )
                component(
                  v-if="item"
                  :is="item.path?'RouterLink':'a'"
                  :to="item.path"
                  @click="item.onClick"
                ).nav-link.d-flex
                  .me-2
                    i.fa-fw(:class="item.icon")
                  span(v-html="item.label")

                  
        template(#footer)
          .row.g-3
            .col-12(@click.stop="")
              AuthStatus(label).border.rounded-3.bg-light

            template(v-if="user?.address && hasSession && sameAddress(user?.address, selectedAddress)")
              .col-12
                small Account
              .col-12
                .nav.flex-column.nav-pills
                  .nav-item(
                    v-for="item in navUser()"
                  )
                    component(
                      v-if="item"
                      :is="item.path?'RouterLink':'a'"
                      :to="item.path"
                      @click="item.onClick"
                    ).nav-link
                      .row.g-2
                        .col-auto: i.fa-fw(:class="item.icon")
                        .col: span(v-html="item.label")

              .col-12(v-if="user?.isAdmin")
                hr
                RouterLink.btn(
                  to="/admin"
                )
                  i.fa.fa-fw.fa-bolt
                  span Admin



</template>
<style lang="scss" scoped>
.menu{
  z-index: 100000;
  top: 0;
  left: 0;
  right: 0;
  width: auto;
  height: auto;
}
</style>
