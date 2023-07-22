<script lang="ts" setup>
import {  navGeneral, navMain, navUser, usePass } from "$/lib/nav";
import userStore from "$/store/session";
import { isClient } from "@vueuse/shared";

const router = useRouter();

const {
  mintFormOpen,
  studioPassOpen,
  user,
} = userStore.getState();


const {
  checkPass,
  hasPass,
  getPass,
} = usePass();

onMounted( async () => {
  await userStore.start();

  if( isClient ){
    await checkPass();
  }
} );

const hideNavbar = computed( () => {
  return router.currentRoute.value?.meta?.hideNavbar;
} );

const hideFooter = computed( () => {
  return router.currentRoute.value?.meta?.hideFooter;
} );

const feedbackFormOpen = ref( false );
const buyPassFormOpen = ref( false );
</script>
<template lang="pug">
#main
  MainNavbar(
    v-if="!hideNavbar"
  )
    
  main
    RouterView(v-slot="{ Component, route }")
      Suspense
        component(:is="Component" :key="route.fullPath")
        template(#fallback)
          .container
            .card
              .card-body
                .spinner-border(class="text-primary", role="status")
                  span.sr-only Loading...
                

  .footer(
    v-if="!hideFooter"
  ).bg-dark
    .container.py-5
      .row.g-4.h-100.align-items-start
        .col-lg.text-center.text-md-start
          h6 Learn More
          ul.list-unstyled
            template(
              v-for="item in navGeneral()"
              :key="item.label"
            )
              li
                Component(
                  v-if="item"
                  :is="item.path?'RouterLink':'a'"
                  :to="item.path"
                  @click="item.onClick"
                )
                  span(v-html="item.label")

        .col-lg.text-center.text-md-start
          h6 Community
          ul.list-unstyled
            template(
              v-for="item in navMain()"
              :key="item.label"
            )
              li
                component(
                  v-if="item"
                  :is="item.path?'RouterLink':'a'"
                  :to="item.path"
                  @click="item.onClick"
                )
                  span(v-html="item.label")

        .col-lg.text-center.text-md-start(
          v-if="user"
        )
          h6 Account
          ul.list-unstyled
            template(
              v-for="item in navUser()"
              :key="item.label"
            )
              li
                component(
                  v-if="item"
                  :is="item.path?'RouterLink':'a'"
                  :to="item.path"
                  @click="item.onClick"
                )
                  span(v-html="item.label")
        .col-md-auto
          .row.g-3
            .col-12
              .h4.my-0
                SocialIcons.justify-content-between
            .col-md
              p
                div &copy; 2022 Inkognitos World
                div &copy; 2022 Decent Factory
              a.btn.btn-black.w-100(@click="feedbackFormOpen=true")
                | #[i.fa.fa-message.fa-fw] Report Problem



  Teleport(to="#modals")
    ModalBox(
      v-model:value="studioPassOpen"
    )
      template(#header): h4.m-0 Studio Pass

      template(#default)
        template(v-if="hasPass")
          .modal-body.bg-light1
            .row.align-items-center
              .col-auto
                i.fa.fa-stack.fa-2x
                  .fa.fa-stack-2x.fa-certificate
                  .fa.fa-stack-1x.fa-check.fa-inverse
              .col
                h5 You are a Studio Pass holder!

        template(v-else)
          .modal-body.bg-light1
            h5 Features
            ul
              li Unlimited publishing
              li Unlimited INK
              li One per wallet
              li Priority support
            
            small Get yours before they are gone!

          .modal-footer
            .btn.btn-primary(@click="getPass") Get Studio Pass


    ModalBox(
      v-model:value="feedbackFormOpen"
    )
      template(#header): h4.m-0 Send Feedback

      template(#default)
        .modal-body.bg-light1
          FeedbackForm(@done="feedbackFormOpen=false")

    ModalBox(
      v-model:value="mintFormOpen"
    )
      template(#header)
        h3 #[i.fa.fa-fw.fa-eye-dropper] INK Shop

      template(#default)
        InkStore(
          @done="mintFormOpen=false"
        )
      
      
</template>
<style lang="scss" scoped>


// #main{
//   max-height:100vh;
// }

main{
  min-height: calc( 100vh - 12rem );
}

.footer{
  h6{
    opacity: 0.5;
  }
  li{
    padding: 0.25em 0;
  a{
    text-decoration: none;
      color: $light;
    }
  }
}

</style>