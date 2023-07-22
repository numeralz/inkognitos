<script lang="ts" setup>
import userStore, { getFactoryContract, sameAddress } from "$/store/session";
import type { User } from "$/store/session";
import { useAsyncQueue } from "@vueuse/core";
import ListGuard from "$/components/ListGuard.vue";
import { changeDisplayName } from "$/lib/user";
import { useField } from "$/lib/utils";

const {
  user: me,
} = userStore.getState();

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );
const route = useRoute();
const userId = route.params.id;
const user = reactive<User>( {} );

const created = ref<{
  _id: string
  tokenId: string
}[]>( [] );

const comments = ref<{
  _id: string
  targetRef: {
    id: string,
    type: "FactoryToken"|"Comment"
  },
  message: string
  createdAt: string,
}[]>( [] );

const reactions = ref<{
  _id: string,
  targetRef: {
    id: string,
    type: "FactoryToken"|"Comment"
  },
  createdAt: string,
  name: string
}[]>( [] );

const owned = ref<{
  tokenId: string,
}[]>( [] );

const createdIds:string[] = [];

const tasks = [
  {
    name  : "Created",
    fetch : async () => {
      try {
        const {
          data,
        } = await axios.request( {
          method : "get",
          url    : `/api/users/${ userId }/created`,
        } );

        data.items?.forEach( ( item ) => {
          if( item.tokenId ){
            createdIds.push( item.tokenId );
          }
        } );
        created.value = data.items;

        return data.items;
      } catch ( error: any ) {
        console.log( error );

        return [];
      }
    },
  },
  {
    name  : "Owned",
    fetch : async () => {
      if( !user.address ){
        return;
      }

      try {
        const tokenIds = await (
          await getFactoryContract()
        )?.tokensOfOwner( user.address );

        owned.value = tokenIds?.filter( ( tokenId ) => {
          return !createdIds.includes( tokenId.toString() );
        } ).map(
          ( tokenId ) => ( {
            tokenId : tokenId.toString(),
          } )
        ) || [];
      } catch ( error: any ) {
        console.log( error );

        return [];
      }
    },
  },
  {
    name  : "Comments",
    fetch : async () => {
      try {
        const {
          data,
        } = await axios.request( {
          method : "get",
          url    : `/api/users/${ userId }/comments`,
        } );

        comments.value = data.items;

        return data.items;
      } catch ( error: any ) {
        console.log( error );

        return [];
      }
    },
  },
  {
    name  : "Reactions",
    fetch : async () => {
      try {
        const {
          data,
        } = await axios.request( {
          method : "get",
          url    : `/api/users/${ userId }/reactions`,
        } );

        reactions.value = data.items;

        return data.items;
      } catch ( error: any ) {
        console.log( error );

        return [];
      }
    },
  },
];

const nameField = useField();

// Mounted
onMounted( async () => {
  isLoading.value = true;


  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/users/${ userId }`,
    } );

    Object.assign( user, data );
    useAsyncQueue( tasks.map( x=>x.fetch ) );
    nameField.value = user.name || "";
  } catch( error:any ){
    console.error( error );
  }

  isLoading.value = false;
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

const isMe = computed( ()=>sameAddress( user?.address, me.value?.address ) );

// Expose
defineExpose( {} );

</script>
<template lang="pug">
div
  .bg-light.pt-4.mb-n4
    .container(
      v-if="user.address"
    )
      h2.row.g-3.align-items-center
        .col-auto
          JazzIcon(
            :address="user.address"
            size="6rem"
            noLabel
          ).h-100
              
        .col.h-100 {{ user?.name || user.address.slice(0,10) }}

                

  .py-5.bg-white.border-top
    .container
      .row.g-5
        .col-12.col-lg-6.col-lg-6
          h5 Collected
          
          ListGuard(:items="owned")
            template(#emptyText)
              h6.text-muted Nothing collected
            .row.g-3
              template(
                v-for="item in owned"
                :key="item.tokenId"
              )
                .col-2
                  RouterLink(
                    :to="`/tokens/${item.tokenId}`"
                  ).square.card.shadow.bg-light1
                    LoadImage.inner(
                      :src="`/api/tokens/${item.tokenId}/image`"
                    ).card-image-top


        .col-12.col-lg-6.col-lg-6
          h5 Created
          
          ListGuard(:items="created")
            template(#emptyText)
              h6.text-muted Nothing created.
            .row.g-3
              template(
                v-for="item in created"
                :key="item._id"
              )
                .col-2
                  RouterLink(
                    :to="`/tokens/${item._id}`"
                  ).square.card.shadow.bg-light1
                    LoadImage.inner(
                      :src="`/api/tokens/${item._id}/image`"
                    )

        .col-12.col-lg-6.col-lg-6
          h5 Comments
          
          ListGuard(:items="comments")
            template(#emptyText)
              h6.text-muted No comments
            .row.g-2
              .col-12(
                v-for="item in comments"
                :key="item._id"
              )
                .row.g-2.flex-nowrap
                  .col-auto
                    RouterLink(
                      :to="`/tokens/${item.targetRef?.id}`"
                      style="width: 4rem"
                    ).square.card.pos-rel.bg-light1
                      LoadImage.inner(
                        :src="`/api/tokens/${item.targetRef?.id}/image`"
                      )
                      pre.d-none {{item}}

                  .col
                    .card.h-100
                      .card-body.bg-light2
                        .row.g-2
                          .col
                            div {{ item.message }}
                          .col-auto
                            small.faded
                              RenderDate(:value="item.createdAt")
                
        .col-12.col-lg-6.col-lg-6
          h5 Reactions
          
          ListGuard(:items="reactions")
            template(#emptyText)
              h6.text-muted No reactions
            .row.g-4
              template(
                v-for="item in reactions"
                :key="item._id"
              )
                .flex-fill(
                  style="min-width: 5rem; max-width: 10rem;"
                ).d-flex
                  RouterLink(
                    :to="`/tokens/${item.targetRef?.id}`"
                  ).square.card.pos-rel.bg-light1.me-3.mb-3
                    LoadImage.inner(
                      :src="`/api/tokens/${item.targetRef?.id}/image`"
                    )
                    ul.avatars.pos-abs.bottom.right.m-n2(
                      style="z-index: 2;"
                    )
                      .avatar.avatar-lg
                        .avatar-img
                          | {{ item.name }}

                
</template>
<style lang="scss" scoped>

</style>
