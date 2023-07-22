<script lang="ts" setup>
import userStore, { getFactoryContract, REACTIONS } from "$/store/session";
import type { FactoryItem } from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value?: FactoryItem;
  active?: boolean;
}>(), {
  active : false,
} );

// Data
const isLoading = ref( false );
const value = toRef( props, "value" );

onMounted( async () => {
  watch(
    ()=>value.value,
    async ( $, $$ ) => {
      if( !$ || $ === $$ ) {
        return;
      }

      await openItem( $ );
    },
    {
      immediate : true,
    }
  );
} );

async function openItem( item: FactoryItem ) {
  isLoading.value = true;

  if( typeof window === "undefined" ) {
    return;
  }

  const fCtx = await getFactoryContract();

  try{
    const {
      data,
    } = await axios.request( {
      method : "get",
      url    : `/api/tokens/${ item._id }`,
    } );

    console.log( data );
    // emit( "update:value", value.value );
    ( async () => {
      try{
        if( !item.ownerAddress && item.tokenId ) {
          item.ownerAddress = ( await fCtx.callStatic.ownerOf( item.tokenId ) )?.toString();
        }

        if( item.tokenId ){
          const tokenUri =  await fCtx!.callStatic.tokenURI( item.tokenId );
        
          console.log( {
            tokenUri,
          } );

          const base64String = tokenUri.slice( 29 );
          const jsonString = window.atob( base64String );
          const metadata = JSON.parse( jsonString );

          console.log( {
            base64String,
            jsonString,
            metadata,
          } );
        }
      }catch( er ){
        //
      }
      
      if( !item.ownerAddress ){
        item.ownerAddress = item.userAddress;
      }
    } )().then();
  } catch( error:any ){
    // console.error( error );
  }

  isLoading.value = false;
}


// Mounted

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
  ( event: "open", item: FactoryItem ): void;
  ( event: "delete", item: FactoryItem ): void;
}>();

const {
  user,
} = userStore.getState();

// Expose
defineExpose( {} );

const deleteActive = ref();

function startDelete(){
  if( deleteActive.value ){
    emit( "delete", value );

    return;
  }

  deleteActive.value = true;
}

function cancelDelete(){
  deleteActive.value = false;
}


</script>
<template lang="pug">
.square(v-if="value")
  .card(
    :class="{'border border-primary': active, 'border-danger shadow faded': deleteActive }"
  ).h-100.bg-light2.pos-rel
    //- .card-block.pos-rel.hover-reveal
    //-   pre {{ value }}
    .card-block.pos-rel.hover-reveal
      small.pos-abs.top.left.px-1.z-top.bg-white.rounded.border.m-n1(
        v-if="value.tokenId"
      ).reveal {{ value.tokenId }}

      .p-2(
        v-if="!value.tokenId"
        @click.stop="startDelete()"
        @focusout="cancelDelete"
        tabindex="-1"
      ).flex-center.m-n2.p-0.badge.bg-danger.text-white.pointer.reveal.pos-abs.right.top.z-top
        Transition(
          name="horiz"
          mode="out-in"
        )
          small(
            v-if="deleteActive"
          ) Confirm
          .i.fa.fa-times(
            v-else
          )
          
      .square.w-100
        .inner
          LoadImage(
            tabindex="0",
            @click.stop="emit('open', value)",
            :src="`/api/tokens/${ value.tokenId || value._id }/image`",
          ).card-img

      .pos-abs.top.right.p-1(
         title="Owner"
      ).strong.m-n2.rounded-pill.reveal.z-top
        JazzIcon(
          v-if="value.ownerAddress"
          :address="value.ownerAddress"
          :me="user?.address"
          size="2em" noLabel
        )

      .pos-abs.bottom.left.w-100.p-0(
        style="height: 2rem; --delay:1s;"
      ).no-mouse.reveal.z-top
        .row.g-3.align-items-center
          .col
            ul.avatar-group.list-unstyled.align-items-center.m-0(
              v-if="value.reactionCounts"
            )
              li.avatar.avatar-md(
                v-for="([name, count],i) in Object.entries(value.reactionCounts).sort( (a,b)=> (b[1] - a[1]) )"
              )
                .avatar-img.rounded-circle.d-flex
                  .icon {{ REACTIONS[ name ]?.emoji }}

                .monospace.mb-n3.pos-abs.bottom.right.p-0.left.text-center(
                  v-if="value.reactionCounts?.[ name ] && count > 1"
                )
                  small.strong.px-1 {{ count }}
                  
          .col-auto(v-if="value.numComments")
            .badge.px-1.bg-white.border-light
              i.fa.fa-message.fa-fw
              span {{ value.numComments }}

</template>
<style lang="scss" scoped>
.card{
  transition: all 0.2s ease-in-out;
  // border-color: transparent;
  &:hover{
    border-color: initial;
  }
}
</style>
