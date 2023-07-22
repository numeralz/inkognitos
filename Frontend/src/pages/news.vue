<script lang="ts" setup>
import type { Article } from "$/env";
import userStore from "$/store/session";
import { useShare } from "@vueuse/core";

const {
  user,
} = userStore.getState();

interface State {
  isLoading: boolean;
}
const isLoading = ref<boolean>( false );

const state = reactive<State>( {
  isLoading : false,
} );


const currentPage = reactive<{
  items: Article[];
  skip    : number;
  total   : number;
  limit : number;
}>( {
  items : [],
  skip  : 0,
  total : 0,
  limit : 24,
} );


async function fetchAll(){
  isLoading.value = true;

  try {
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/news`,
      params : {
        skip  : currentPage.skip || 0,
        limit : currentPage.limit,
      },
    } );

    Object.assign( currentPage, data );

    // handle result
  } catch ( error: any ) {
    console.error( error );
  }

  isLoading.value = false;
}

const composerOpen = ref( false );
const composerTab = ref( 0 );

function permaLink( article: Article ) {
  return `/news/${ article?.slug }`;
}

const route = useRoute();
const router = useRouter();

onMounted( async () => {
  await fetchAll();

  const activeId = String( route.params?.id );

  if( !activeId && currentPage.items[0] ){
    router.push( `/news/${ currentPage.items[0]?.slug }` );
  }
} );

async function updateItem( article: Partial<Article> ) {
  try{
    const {
      data,
    } = await axios.request( {
      method : "post",
      url    : `/api/news`,
      data   : article,
    } );

    console.log( data );
    Object.assign( article, data );
  } catch( error:any ){
    console.error( error );
  }
}

const composeItem = reactive( {
  title    : "",
  content  : "",
  markdown : "",
  slug     : "",
  tags     : [],
  _id      : "",
} );



</script>
<template lang="pug">
.page-h.bg-light2
  .container-fluid.py-4
    .row.g-4
      .col-3.col-md-3
        .nav-list.nav-pills
          .nav-item(
            v-for="(item,i) in currentPage?.items"
            :key="item._id"
          ).my-1
            
            RouterLink.nav-link.pointer.position-relative(
              :to="permaLink(item)"
            ).p-2
              .row.g-2.align-items-center
                .col-2.d-none.d-md-block
                  JazzIcon(:address="item.userAddress" noLabel)
                .col.overflow-hidden
                  strong {{ item.title }}
                .col-12.col-lg-auto
                  small: RenderDate(:value="item.createdAt")

        template(
          v-if="user?.isAdmin"
        )
          .nav-list.nav-pills
            .nav-link
              .btn.btn-white.mt-4(
                @click="composerOpen = true"
              ) Compose

      .col
        RouterView(v-slot="{ Component, route }")

  Teleport(to="#modals")
    ModalBox(
      :value="composerOpen && user?.isAdmin"
      @close="composerOpen = false; composerTab=0"
      fullscreen
    )
      .p-3
        .modal-body.bg-light.rounded
          .row.flex-nowrap.h-100
            .col-md-6.h-100
              .pe-0.h-100.d-flex.flex-column
                .form-floating.mb-3
                  input(
                    v-model="composeItem.title",
                    placeholder="Title"
                  ).form-control.bg-white.border-light
                  label Title

                .form-floating.mb-3
                  textarea(
                    v-model="composeItem.markdown",
                    style="min-height: 50vh; max-height: unset; height:auto"
                    placeholder="Content"
                  ).form-control.align-self-stretch.bg-white.border-light
                  label Content

            .col-md-6.h-100.scroll-y
              .p-4.bg-light1.rounded.h-100
                h1 {{ composeItem.title }}
                RenderMarkdown(:value="composeItem.markdown")


        .modal-footer
          .btn.btn-primary(@click="updateItem(composeItem); composerOpen = false;")
            | Submit

</template>
<style lang="scss" scoped>
.scroll-y{
  height: calc(100vh - 300px) !important;
  overflow-y: auto;
}
.composer{
  z-index: 10000;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .inner{
    background-color: #FFF;
  }
}
textarea{
  height: auto;
}

.form-control-plaintext{
  outline: none;
}
</style>