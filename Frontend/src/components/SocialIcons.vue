<script lang="ts" setup>
</script>
<template lang="pug">

.row.g-2.justify-content-between
  a.col-auto(
    target="_blank"
    href="https://twitter.com/InkognitosWorld"
  ): i.fab.fa-twitter.fa-fw

  a.col-auto(
    target="_blank",
    :href="`https://discord.gg/gcgXKQGxQ3`",
  ): i.fab.fa-discord.fa-fw

  //- a.col-auto(
  //-   target="_blank"
  //-   href="https://t.me/+m0J5iwhG3dgwMWYx"
  //- ): i.fab.fa-telegram.fa-fw
  
  a.col-auto(
    target="_blank"
    href="https://www.instagram.com/inkognitosworld/"
  ): i.fab.fa-instagram.fa-fw
  
  a.col-auto(
    target="_blank"
    href="/whitepaper"
  ): i.far.fa-bookmark.fa-fw
  
  a.col-auto(
    target="_blank"
    href="https://opensea.io/collection/inkognitos-world"
  )
    i.fa.fa-fw
      img(
        src="https://opensea.io/static/images/logos/opensea.svg",
        style="width: 1em; filter: contrast(2); margin:0;"
      )
  //- a.col-auto(
  //-   target="_blank"
  //-   href="https://etherscan.io/address/0x3902dd34e20d911bd5304cfc167dd5c45be06857"
  //- )
  //-   i.fa.fa-fw
  //-     img(
  //-       src="https://etherscan.com/images/favicon3.ico",
  //-       style="width: 1em; filter: contrast(2); margin:0;"
  //-     )
  a.col-auto(
    target="_blank",
    :href="`https://looksrare.org/collections/0x3902dd34e20d911bd5304cfc167dd5c45be06857`",
  )
    i.fa.fa-fw
      img(
        src="https://etherscan.io/images/svg/brands/looksrare-black.svg",
        style="width: 1em; filter: contrast(2); margin:0;"
      )

</template>
<style lang="scss" scoped>
a{
  color: unset;
  // font-size: max( 4vw, 4vh );
  &:hover{
    color: unset;
  }
}
</style>
