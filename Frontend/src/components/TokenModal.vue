<script lang="ts" setup>
import { etherscanURL } from "$/lib/nav";
import userStore, { REACTIONS, CONTRACTS, sameAddress } from "$/store/session";
import type { FactoryItem } from "$/store/session";
import { BigNumber } from "ethers";


// Props
const props = withDefaults( defineProps<{
  activeItem: FactoryItem;
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  isLoading.value = true;
  //
  isLoading.value = false;
} );


// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
  ( event: "close" ): void;
  ( event: "open" ): void;
  ( event: "remix" ): void;
  ( event: "send" ): void;
  ( event: "burn" ): void;
  ( event: "delete" ): void;
}>();

const {
  selectedAddress,
  user,
} = userStore.getState();

</script>
<template lang="pug">
ModalBox(
  :value="Boolean(activeItem)"
  @close="emit('close')"
  @open="emit('open')"
  v-if="activeItem"
)
  template(#header)
    .row.flex-nowrap.align-items-center.g-3
      .col
        h4.monospace.m-0(v-if="activeItem?.hash")
          | N:{{ String(activeItem.tokenId).padStart(5,'0') }}

      .col-auto(v-if="activeItem.tokenId")
        .btn-toolbar
          .btn.btn-outline-secondary(
            @click="$emit('remix')"
          ).h-100.d-flex.align-items-center
            span #[i.fa.fa-fw.fa-shuffle] Remix
          RouterLink.btn.btn-outline-primary(
            :to="`/tokens/${(activeItem._id || activeItem.tokenId)}`"
          )
            span #[i.fa.fa-external-link] Token Page

      .col-auto(v-else-if="selectedAddress && sameAddress(activeItem.userAddress, selectedAddress)")
        .btn-toolbar
          .btn-group
            .btn.btn-outline-danger(
              @click="$emit('delete')"
            ).h-100.d-flex.align-items-center
              span(v-if="activeItem._delete") #[i.fa.fa-fw.fa-exclamation-triangle] Confirm Delete?
              span(v-else) #[i.far.fa-fw.fa-trash-alt]
              
          .btn-group
            RouterLink.btn.btn-outline-primary(
              :to="`/artboard?id=${(activeItem._id)}`"
            ).h-100.d-flex.align-items-center
              span Studio #[i.fa.fa-fw.fa-chevron-right]

        

  template(#backdrop)
    //- .w-100.h-100.pos-abs
      .row.flex-nowrap.g-3.align-items-center.h-100
        .col-2(@click.stop="nextItem(-1)").h-100.flex-center.btn-outline-white.faded.rounded-3
          i.fa.fa-arrow-left
        .col
        .col-2(@click.stop="nextItem(1)").h-100.flex-center.btn-outline-white.faded.rounded-3
          i.fa.fa-arrow-right

  template(#default)
    .modal-body.px-0
      .card-header.p-3(
        v-if="activeItem.tokenId"
      )
        .row.align-items-center.g-2
          .col.text-overflow.appear(
            v-if="activeItem.userAddress" title="Creator"
          )
            JazzIcon(
              :address="activeItem?.userAddress"
              :me="user?.address"
              size="3em"
            )
              template(#prefix)
                i.fa.fa-paint-brush.faded


          .col.text-overflow.appear(
            v-if="activeItem.ownerAddress" title="Owner"
          )
            JazzIcon(
              :address="activeItem.ownerAddress"
              :me="user?.address"
              size="3em"
            )
              template(#prefix)
                i.fa.fa-hat-wizard.faded

          template(
            v-if="selectedAddress && sameAddress(selectedAddress, activeItem.ownerAddress)"
          )
            .col-auto.text-center
              .btn.w2.p-0.btn-outline-info.rounded-circle(
                @click.stop="$emit('send')"
              ).square: .inner.flex-center
                | #[i.fa.fa-paper-plane]

            .col-auto.text-center
              .btn.w2.p-0.btn-outline-danger.rounded-circle(
                @click.stop="$emit('burn')"
              ).square: .inner.flex-center
                | #[i.fa.fa-fire]


      .hover-reveal
        RouterLink(
          :to="activeItem.tokenId?`/tokens/${(activeItem._id || activeItem.tokenId)}`:`/artboard?id=${(activeItem._id)}`"
        ).bg-light1.square
              
          .bg-light.p-3(
            v-if="!activeItem.tokenId"
          ).striped-dark.text-center
            strong.text-black Unpublished Draft

          LoadImage(:src="`/api/tokens/${ activeItem._id || activeItem.tokenId }/image`").inner
          
          .p-2(
            v-if="activeItem.parent"
          ).appear
            RouterLink.card(
              :to="`/tokens/${activeItem.parent}`"
              style="width: 6rem"
            ).square.shadow.pos-rel
              LoadImage(
                :src="`/api/tokens/${ activeItem.parent }/image`"
              )
              .pos-abs.p-1.bg-light1.text-black.bottom.right.rounded-1
                | #[i.fa.fa-shuffle.fa-fw] From

          .reveal.inner.flex-center(v-if="!activeItem.tokenId")
            .p-2.rounded-circle.bg-dark.shadow-lg
              .p-3.bg-white.rounded-circle #[i.fa.fa-pencil.fa-2x]

      .card-block(
        v-if="activeItem.reactionCounts && Object.keys(activeItem.reactionCounts)?.length"
      ).p-2.bg-light1
        .row.align-items-center.g-1
          .col
            ul.avatar-group.list-unstyled.align-items-center.mb-0
              li.avatar.avatar-xl(
                v-for="([name, count], i) in Object.entries(activeItem.reactionCounts).sort( (a,b)=> (b[1] - a[1]) )"
              )
                .avatar-img.rounded-circle.d-flex
                  .icon {{ REACTIONS[ name ]?.emoji }}

                .monospace.mb-n2.pos-abs.bottom.right.p-0.left.text-center(
                  v-if="activeItem.reactionCounts?.[ name ] && count > 1"
                )
                  strong.badge.bg-white.p-0 {{ count }}
          .col-auto(v-if="activeItem.numComments")
            .badge.px-1.bg-white
              i.fa.fa-message.fa-fw.text-light
              span {{ activeItem.numComments }}

      .card-block(v-if="activeItem?.inkTokensUsed").p-2
        TokenMaterials(:value="activeItem")
                      
      .modal-footer(v-if="activeItem.tokenId").d-block
        .row.align-items-center
          .col
            RenderDate(
              :value="activeItem.timeSaved"
            ).faded

          .col-auto
            .btn-toolbar
              a.btn(
                :href="etherscanURL('token', { tokenId: activeItem.tokenId, contract: CONTRACTS.InkognitosNFT?.address + '' })",
                target="_blank"
              )
                img(
                  src="https://etherscan.com/images/favicon3.ico",
                  style="width: 1.5em; filter: contrast(2)"
                )

              a.btn(
                :href="`https://opensea.io/assets/ethereum/${ CONTRACTS.InkognitosNFT?.address }/${ activeItem?.tokenId }`",
                target="_blank",
              )
                img(
                  src="https://opensea.io/static/images/logos/opensea.svg",
                  style="width: 1.5em; filter: contrast(2)"
                )
        

              a.btn(
                :href="`https://looksrare.org/collections/${ CONTRACTS.InkognitosNFT?.address }/${ activeItem?.tokenId }`",
                target="_blank",
              )
                img(
                  src="https://etherscan.io/images/svg/brands/looksrare-black.svg",
                  style="width: 1.5em; filter: contrast(2)"
                )

</template>
<style lang="scss" scoped>

</style>
