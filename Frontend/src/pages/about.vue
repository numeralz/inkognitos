<script lang="ts" setup>

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
  isLoading.value = false;
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );


</script>
<template lang="pug">


.bg-light
  .row.g-5.py-5(style="max-width: 50em;").mx-auto
    .col-12
      .container
      
        SVG(src="/img/logoink.svg" style="width:30rem;" ).p-2.rounded
        h1: SocialIcons
        hr

  
    .col-12
      .container
        h1 Sustainable, meritocratic co-creation via transparent tokenization.

        p Web3 is new and it's interesting. We know that it has potential, but also that it is not the answer to every problem.
        p The blockchain provides a way for strangers across the web to maintain a reliable record of events. Decentralized virtual machines provide a way for people to trustlessly interact with strangers, knowing that everyone will follow the rules.
        p This is an experimental art platform for testing crazy ideas for how Web3 might improve the way people collaborate in meta-spaces.
      
    .col-12
      .container
        h4 Parts
        .list-group.mx-n3
          .list-group-item
              h5 Ink
              p Ink is an ERC-1155 collection with tokenId #[code 0x000000] to #[code 0xFFFFFF], which map to its 24-bit #[code #RRGGBB] color code. The only exception is #[code 0xFFFFFF] (pure white) which we consider free and unlimited.
              p Every color has its own maximum supply and price. Some colors are more rare than others.
              p Only a few colors are available at the start, more colors will become available soon.

          .list-group-item
            h5 Factory
            p The NFT Factory is where NFT tokens are minted. When you begin publishing your drawing from the studio, our off-chain service counts the INK you used (calculating the area of every path and shape), and provides you with a signed permit that indicates:
            ul
              li INK ids and counts
              li the image hash
              li your address
              li a timestamp
            p This all happens automatically in the background, of course &mdash; but mixing on-chain and off-chain computation allows us to provide a seamless user-experience at a low cost.

          .list-group-item
            h5 Royalties
            p As a platform that runs on community-generated content, one of the most exciting features of Inkognitos is that creators earn 2/3 of the royalties from the sale of their creations.
            p Every creator gets their very own RoyaltySplitter contract, which is where token royalties get sent via the #[a(href="https://eips.ethereum.org/EIPS/eip-2981") EIP-2981 Royalty Standard].
            p Marketplaces that support this open standard (such as #[a(target="_blank" href="https://looksrare.org") looksrare.org ]). Will deposit royalties here. You can withdraw at any time from your #[a(target="_blank" href="/account") /account] page.

          .list-group-item
            h5 Reactions
            p Right now, reactions are completely off-chain, but we're working on interesting ways to give them on-chain utility within the platform.

    
    .col-12
      .container
        h3 Contracts
        
        .scroll-x.w-100.pb-2.mx-n3
          .row.g-2.flex-nowrap
            .col-lg-5
              .card.h-100
                .card-header.name InkgnitosINK
                .card-header.standards
                  ul
                    li ERC1155
                .card-body
                  ul
                    li Tracks the INK assets, which are needed to create InkgnitosNFT tokens.
            .col-lg-5
              .card.h-100
                .card-header.name InkLock
                .card-header.standards
                  ul
                    li ERC1155Holder
                .card-body
                  ul
                    li INK is sent here to be locked away.
                    li In the event that a token is burned, the INK is redistributed to the owner and creator of the token.
            //- .col
              .card.h-100
                .card-header Airdrop
                .card-body
                  ul
                    li
                  
            .col-lg-5
              .card.h-100
                .card-header.name InkgnitosNFT
                .card-header.standards
                  ul
                    li ERC721
                    li Enumerable
                    li Burnable
                .card-body
                  ul
                    li Tracks the Inkognitos NFT metadata.
                    li Minting via ERC271 signature.
                  

            .col-lg-5
              .card.h-100
                .card-header.name RoyaltySplitter
                .card-header.standards
                  ul
                    li PaymentSplitter
                .card-body
                  ul
                    li Created for every publisher on first mint.
                    li User can withdraw their share (66%) of incoming royalties.


    .col-12
      .container
        h3 FAQ
        FaqSection.mx-n3

    .col-12
        .alert.alert-white
          h5 This page is incomplete
          p More content is on its way!


</template>
<style lang="scss" scoped>

.card{
  font-size: $font-size-sm;
  ul{
    padding-left: 1rem;
  }
  .name{
    font-size: 1.1rem;
    font-weight: bold;
  }
  .standards{
    background-color: $light2;
    ul{
      padding: 0;
      list-style: none;
      margin: 0;
      font-weight: $font-weight-bold;
    }
  }
}

</style>
