<script lang="ts" setup>


const FAQS = [
  {
    topic : [
      "nft",
    ],
    q : `How do I mint an Inkognito NFT?`,
    a : `
    First, obtain INK (using GET INK page, or secondary market), then draw a character using the Artboard, and hit publish. Our system will automatically count the ink you have used, and will prepare a transaction for you to publish your character, spending the INK tokens you have used.
    `,
  },
  {
    topic : [
      "ink",
    ],
    q : "What is INK?",
    a : `
    INK is an ERC-1155 collection that represents drops of ink that are used to create lines and shapes for your NFT drawing. It comes in different colors, some more rare than others. You need to obtain INK in order to publish your Inkognito.
    `,
  },
  {
    topic : [
      "ink",
    ],
    q : "How do I obtain INK?",
    a : `
    INK is sold in drops. You can purchase INK from the Ink Shop, or right before you publish. If the shop sells out, you can buy INK from others on NFT marketplaces like OpenSea, LooksRare, etc.
    `,
  },
  {
    topic : [
      "ink",
    ],
    q : "How do I collect royalties?",
    a : `
    When you publish your first character, a royalty wallet contract is deployed automatically, where 6.6% (2/3 of 10%) of secondary market sales will be deposited to by marketplaces that honor the ERC-2981 Royalty Standard.`,
  },
  {
    topic : [
      "ink", "drawing",
    ],
    q : "How much INK do I need?",
    a : `
    A square spanning the entire canvas area uses about 420 INK drops. Your total INK consumption is equivalent to the area of the color that is filled, plus any black outline. Pure white INK (#FFFFFF) is not counted, and is not limited.
    `,
  },
  {
    topic : [
      "ink",
    ],
    q : "Does INK come in different colors?",
    a : `
    INK comes in a variety of colors. Some INK is more precious than others, check the maximum supply of the color at the store. White INK is not counted (free to use). (Be aware that you cannot mint an NFT with only white INK.)
    `,
  },
  {
    topic : [
      "drawing",
    ],
    q : "How are overlapping or hidden lines counted?",
    a : `
    All lines and shapes are counted regardless if they obstructed by other shapes or not. To reduce over-spending INK, try to avoid drawing over top of prior INK layers, especially when they are the same color.
    `,
  },
];

</script>
<template lang="pug">

.list-group
  .list-group-item(
    v-for="item in FAQS"
  ).py-4
    .row.g-4.align-items-start
      .col-lg-5.text-lg-end
        h5 {{item.q}}
      .col
        div {{item.a}}


</template>
<style lang="scss" scoped>

</style>
