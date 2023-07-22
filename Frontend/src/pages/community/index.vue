<script lang="ts" setup>
import { timeAgo } from "$/lib/utils";
import userStore, { sameAddress } from "$/store/session";
import type { Ref } from "vue";

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  //
  await getTopics();
  isLoading.value = false;
} );

type ForumMessage = Partial<{
  _id: string,
  userAddress: string,
  headline: string,
  content: string,
  createdAt: Date,
  replies: ForumMessage[],
  _newReply?: string,
  _expand: boolean,
  category: "ASK" | "SUGGEST" | "ISSUE" | "OTHER",
}>

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

const messages = ref<ForumMessage[]>( [] );

const pagination = reactive<{
  skip: number,
  limit: number,
  total: number,
}>( {
  skip  : 0,
  limit : 24,
  total : 0,
} );

async function getReplies( topic:ForumMessage ){
  try{
    const {
      data,
    } = await axios.request( {
      method : "GET",
      url    : `/api/forum/${ topic._id }/replies?t=${ Date.now() }`,
    } );

    topic.replies = data.items;
  } catch( error:any ){
    console.error( error );
  }
}

async function getTopics(){
  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/forum/`,
      params : {
        ...pagination,
      },
    } );
    // handle result

    const {
      items, ...paging
    } = data;

    messages.value = items.map( ( item ) => {
      const _item = reactive( {
        ...item,
        _expand   : false,
        _newReply : "",
      } );

      watch( ()=>_item._expand, async ( val, val0 ) => {
        if( val && !val0 ){
          await getReplies( _item );
        }
      } );
      
      return _item;
    } );
    Object.assign( pagination, paging );
  } catch( error:any ){
    console.error( error );
  }
}

async function createTopic( message: ForumMessage ){
  if( !message.headline || !message.content ){
    return;
  }

  try{
    const {
      data,
    } = await axios.request( {
      method : "post",
      url    : `/api/forum/`,
      data   : {
        ...message,
      },
    } );

    // handle result
    newTopic._show = false;
  } catch( error:any ){
    console.error( error );
  }
}

async function createReply( message: ForumMessage ){
  const content = message._newReply;

  message._newReply = "";

  if( !message.replies ){
    message.replies = [];
  }

  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/forum/${ message._id }/replies`,
      data   : {
        content,
      },
    } );

    // handle result
    const reply = data;

    message.replies.unshift( reply );
  } catch( error:any ){
    console.error( error );
    message._newReply = content;
  }
}

const newTopic = reactive<{
  _show: boolean,
  headline: string
  content: string
  category: "ASK" | "SUGGEST" | "ISSUE" | "OTHER"
}>( {
  _show    : false,
  headline : "",
  content  : "",
  category : "OTHER",
} );

async function deleteItem( item: ForumMessage, list:ForumMessage[] ){
  try{
    const {
      data,
    } = await axios.request( {
      method : "delete",
      url    : `/api/forum/${ item._id }`,
    } );

    // handle result
    list.splice(
      list.indexOf( item ),
      1
    );
  } catch( error:any ){
    console.error( error );
  }
}

// Expose
defineExpose( {} );

const router = useRouter();
const searchText = ref( router.query?.search || "" );

function startNewTopic( cat:"ASK" | "SUGGEST" | "ISSUE" | "OTHER" ){
  newTopic.category = cat;
  newTopic._show = true;
}

const {
  user,
} = userStore.getState();

</script>
<template lang="pug">
div
  .py-3.bg-light.sticky-top.border-bottom
    .container
      .row.g-3.align-items-center
        .col
          h4.m-0 Community
        .col-auto
          .btn-group
            .btn.btn-danger(
              @click="startNewTopic('ISSUE')"
            )
              span #[i.far.fa-fw.fa-comments] Report Issue

            .btn.btn-info(
              @click="startNewTopic('ASK')"
            )
              span #[i.far.fa-circle-question] Ask Question
              
            .btn.btn-warning(
              @click="startNewTopic('SUGGEST')"
            )
              span #[i.far.fa-lightbulb] Suggest


        //- .col-auto.faded
          form.pos-rel(
            @submit.prevent="router.push( { path: 'community', query: { search: searchText } } )"
          )
            input.form-control(
              type="text"
              placeholder="Search..."
              v-model="searchText"
            ).bg-white.ps-4
            .pos-abs.top.left.bottom.flex-center.px-2
              i.fa.fa-search.fa-fw
              
            .pos-abs.top.right.bottom.flex-center.px-2
              i.fa.fa-times.fa-fw


  .vh-100.bg-light2.py-4
    .container
      .row.g-3
        .col-12(
          v-for="(item, m) in messages"
          :key="item._id"
        )
          .card.shadow.shadow-sm(
            :class="{ 'shadow shadow-lg z-top border-dark': item._expand }"
          )
            .card-body.p-3(
              @click="item._expand=!item._expand"
            )
              .row.align-items-center.g-2
                .col-auto: JazzIcon(:address="item.userAddress" noLabel size="2rem")
                .col: h6 {{item.headline}}
                .col-auto
                  small: RenderDate(:value="item.createdAt" time)
                .col-auto(v-if="item._expand && sameAddress(item.userAddress, user?.address ) ").appear
                  .btn.btn-sm.btn-danger.w2.p-0(
                    @click.stop="deleteItem(item, messages)"
                  )
                    .square
                      .inner.flex-center #[i.fa.fa-times]
              
              .py-3 {{ item.content }}

            .card-footer(v-if="item._expand || item._newReply")
            
              form(
                @submit.prevent=""
              ).row.row.align-items-center.g-3
                .col-auto
                  JazzIcon(:address="item.userAddress" noLabel size="1.5rem")
                .col
                  .form-floating
                    textarea.form-control(
                      placeholder="Reply"
                      v-model="item._newReply"
                      @keydown.enter="(e)=>{ if(!e.shiftKey){ e.preventDefault(); createReply( item ); } }"
                    ).h-100
                    label Reply
                .col-auto
                  button.btn.h-100
                    i.fa.fa-paper-plane
                    
              //- FetchData(
              //-   method="get"
              //-   :url="`/api/forum/${ item._id }/replies`"
              //-   @update="(data)=>{ messages[m].replies = data.items }"
              //- )

              .list-group.my-3
                .list-group-item(
                  v-for="reply in item.replies"
                  :key="reply._id"
                ).appear
                  .row.g-3
                    .col-auto: JazzIcon(:address="reply.userAddress" noLabel size="1.5rem")
                    .col {{ reply.content }}
                    .col-auto
                      small.faded {{ timeAgo(reply.createdAt) }}
                    .col-auto
                      .btn.btn-sm.btn-danger.w2.p-0(
                        @click.stop="deleteItem(reply,item.replies)"
                      )
                        .square
                          .inner.flex-center #[i.fa.fa-times]
                  
              

  Teleport(to="#modals")
    ModalBox(
      :value="newTopic._show"
      @close="newTopic._show = false"
    )
      template(#header)
        h4 {{ newTopic.category }}

      form(
        @submit.prevent="createTopic( newTopic );"
      )
        .modal-body
          .row.g-3
            .col-12
              .form-floating
                input.form-control(
                  v-model="newTopic.headline"
                  placeholder="Headline"
                ).bg-light2
                label Headline
                
            .col-12
              .form-floating
                textarea.form-control(
                  v-model="newTopic.content"
                  placeholder="Message"
                  style="min-height: 20rem"
                ).bg-light2
                label Message
        .modal-footer.p-3.bg-light1
          button.btn.btn-lg.btn-primary
            | #[i.fa.fa-check] Create

</template>
<style lang="scss" scoped>

textarea{
  height: 3rem !important;
  resize: none;
  overflow: hidden;
  opacity: 0.5;

  &:focus{
    min-height: 6rem;
    opacity: 1;
    overflow: auto;
  }
}
</style>
