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

.container.py-4

  .card: .card-body.p-4
    h2  Decent Factory: Inkognitos
    p Inkognitos is a social storytelling and art platform. It links on-chain tokens to user-submitted content (sketches, comments, reactions) so that, at a later time, those micro-tokens may be used to reimburse, reward everyone proportionately to the value they helped bring.
    p When a token is published, it is assigned a new serial number (token id) within the collection. Its verifiable fingerprint (hash) is saved on-chain, its image is saved off-chain. The artist’s wallet is associated with the token (creator), so that 2/3 of royalties can be sent to their royalty account.
    p For instance, as of this writing, there is no widely adopted standard for automatically sending royalties to multiple addresses on-chain. The widely adopted EIP-2981 Royalty Standard enables the specification of just one (1) destination wallet and associated payment amount. To split royalties between the treasury and the content contributors, Inkognitos deploys a one-time lightweight royalty account contract the first time a user publishes. We are actively experimenting for ways to back-propagate royalties and other rewards in a recursive way.
    
    h3  The Concept: Multiplayer Art Collection
    ul
      li As a holder of the INK Studio Pass, (or INK tokens) you are a storyteller.
      li As a storyteller, you can draw and publish (mint) a sketch, that becomes a token.
      li We recommend non-fictional, highly relatable anecdotes, aka, ‘memes’.
      li Your token can be the start of a new story, or extend an existing story.
      li When you extend a story chain, you’re rewarding the creative work that came before you. Likewise, you will be rewarded when your story is extended and liked.
      li Storytellers will earn tokens from the reactions and extensions that get derived from it.
      li The longest chain in a story which has received the most cumulative reactions becomes the default story.

    p We’re still working out the exact tokenomics (with input from community), but the general premise is simple: Recognize and reward value-adding actions as much as possible, whenever possible.
    h3 Big Picture: Tokenized Collaboration
    p There is a constant stream of creative content being created every single day by internet users from around the world. Evidently, people willingly spend their leisure creating things without any expectation of compensation. It seems there is a leak in the economy, excess value being produced, with no reward and no encouragement for their hard work. Clever companies have learned to harvest this value, process it, refine it, and sell it back to us, all without ever rewarding its creators. It’s not for a lack of them trying, either. Using traditional means to track, compensate, resolve disputes, and prevent fraud is an error-prone, expensive and time-consuming endeavor.

    h3 Why Blockchain?
    p NFTs have gotten a bad rep. Just because a token uses the NFT standard, does not mean its sole purpose is to sell it for a quick profit. Smart contracts may be thought of as games with a set of rules which are automatically enforced by computers on the network acting as one machine. This enables strangers to interact with one other fairly without needing to trust each other. A collectible contract manages a list of serial numbers (tokens), tracks who the current owner is, and who can do what (send, receive, burn, exchange) under what conditions (owner, creator, delegatee).
    p Consider the risk of entering an agreement with thousands or millions of strangers from around the world. The cost of fraud prevention, audits and resolving legal disputes is so high, that selling JPEGs would not be a feasible operation. It starts to become clear why something as useless as JPEGs became the first widely adopted digital asset format.

    p To be continued...

</template>
<style lang="scss" scoped>

</style>
