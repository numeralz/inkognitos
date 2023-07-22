<script lang="ts" setup>
import { openErrorModal, parseErrorMessage } from "$/lib/utils";
import userStore, { getAirContract } from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

const isEligible = reactive<{
  ready: boolean,
  loading: boolean,
  value: any,
}>( {
  ready   : false,
  loading : false,
  value   : false,
} );

const hasPermit = reactive<{
  ready: boolean,
  loading: boolean,
  value: any,
}>( {
  ready   : false,
  loading : false,
  value   : null,
} );

const hasAirdrop = reactive<{
  ready: boolean,
  loading: boolean,
  value: any,
}>( {
  ready   : false,
  loading : false,
  value   : false,
} );

const showAirdrop = ref( false );

const {
  user,
} = userStore.getState();

// Mounted
onMounted( async () => {
//
} );

async function begin(){
  showAirdrop.value = true;
  hasPermit.value = null;
  await checkEligible();

  if( isEligible.value ){
    await getPermit();
  }
}

async function checkEligible(){
  if( !user.value?.address ){
    return;
  }

  const air = await getAirContract();
  
  isEligible.loading = true;
  isEligible.ready = true;

  try{
    const claimed = await air.callStatic.hasClaimed( user.value?.address || "" );

    if( claimed ){
      throw new Error( "Already claimed" );
    }

    isEligible.value = true;
  } catch( error:any ){
    isEligible.value = false;
    console.error( error );
  }

  isEligible.loading = false;
}

async function getPermit(){
  if( !isEligible.value ){
    return;
  }

  hasPermit.loading = true;
  hasPermit.ready = true;

  try{
    const {
      data: {
        permit,
        signature,
      },
    } = await axios.request( {
      method : "POST",
      url    : `/api/drop/mystery`,
    } );

    hasPermit.value = {
      permit, signature,
    };
  } catch( error:any ){
    console.error( error );
    await openErrorModal( "Error", error );
    hasPermit.value = null;
  }

  hasPermit.loading = false;
}

async function getAirdrop(){
  const air = await getAirContract();


  if( !hasPermit?.value?.permit ){
    return;
  }

  if( Math.floor( Date.now() / 1000 - 600 ) > Number( hasPermit.value.permit.timestamp ) ){
    await getPermit();

    return;
  }

  hasAirdrop.loading = true;
  hasAirdrop.ready = true;
  console.log( {
    permit    : hasPermit.value?.permit,
    signature : hasPermit.value?.signature,
  } );
  

  try{
    await air.claimAirdrop( hasPermit.value?.permit, hasPermit.value?.signature );
    hasAirdrop.value = true;
  }catch( err: any ){
    await openErrorModal( "Error", parseErrorMessage( err ) );
    hasAirdrop.value = false;
    console.log( err );
  }

  hasAirdrop.loading = false;
}

// interface Step {
//   isDone: boolean,
//   isStarted: boolean,
//   hasFailed: boolean,
//   errors: any[],
//   execTask: ()=>Promise<void>,
//   next?: Step,
//   prev?: Step,
// }
// class Stepper {
//   steps: Step[] = [];
//   currentStep: Step;
  
//   get lastStep(){
//     return this.steps.at( -1 );
//   }

//   addStep( step:Step ){
//     if( this.lastStep ){
//       this.lastStep.next = step;
//       step.prev = this.lastStep;
//     }

//     this.steps.push( step );
//   }
// }

const airdrop = reactive( {
  items     : [],
  isLoading : false,
  isError   : false,
} );

</script>

<route lang="yaml">
meta:
  layout: default
  # hideFooter: true
  # hideNavbar: true
</route>

<template lang="pug">

.vh-100.scroll-y
  .section
    .container(style="max-width: 30rem;")
      .card
        .card-body.text-center
          strong INK Airdrop has ended.


  .section
    .container
      .row.justify-content-center
        .col-auto
          RouterLink.btn.btn-outline-secondary(
            to="/tokens"
          ) Browse #[i.fa.fa-images]

        .col-auto
          RouterLink.btn.btn-secondary(
            to="/artboard"
          ) Create #[i.fa.fa-chevron-right]



  //- ModalBox(
  //-   v-model:value="showAirdrop"
  //- )
  //-   template(#header): h4.m-0 Airdrop

  //-   .modal-body
  //-     .square

  //-   .modal-footer.flex-center
  //-     .btn.btn-primary.btn-lg


  //- ModalBox(
  //-   v-model:value="showAirdrop"
  //- )
  //-   template(#header): h4.m-0 Airdrop

  //-   .modal-body
  //-     AuthGuard
  //-       .list-group
  //-         template(
  //-           v-if="user?.address"
  //-         )
  //-           .list-group-item.list-group-item-action(
  //-             :class="[ isEligible.value? 'list-group-item-success':'' ]"
  //-             @click="checkEligible"
  //-           ).d-flex.align-items-center
            
  //-             template(
  //-               v-if="isEligible.loading"
  //-             )
  //-               .me-2
  //-                 .spinner-border.spinner-border-sm
  //-               .flex-fill Checking if you're eligible...
                
  //-             template(
  //-               v-else-if="!isEligible.ready"
  //-             )
  //-               .flex-fill Check


  //-             template(
  //-               v-else-if="!isEligible.value"
  //-             )
  //-               i.fa.fa-fw.fa-times.text-danger.me-2
  //-               .flex-fill You've already claimed your airdrop.
  //-             template(
  //-               v-else
  //-             )
  //-               i.fa.fa-fw.fa-check.text-success.me-2
  //-               .flex-fill You're eligible to participate in the airdrop!

          
  //-           .list-group-item.list-group-item-action(
  //-             v-if="isEligible.value"
  //-             :class="[ hasPermit.value? 'list-group-item-success':'' ]"
  //-             @click="getPermit"
  //-           ).d-flex.align-items-center
  //-             template(
  //-               v-if="hasPermit.loading"
  //-             )
  //-               .me-2
  //-                 .spinner-border.spinner-border-sm
  //-               .flex-fill Getting your permit...

  //-             template(
  //-               v-else-if="!hasPermit.ready || !hasPermit.value"
  //-             )
  //-               .flex-fill Get permit

  //-             template(
  //-               v-else-if="hasPermit.value"
  //-             )
  //-               i.fa.fa-fw.fa-check.text-success.me-2
  //-               .flex-fill You have a permit to claim the airdrop.


  //-           .list-group-item(
  //-             v-if="isEligible.value && hasPermit.value"
  //-             :class="{ 'list-group-item-success': hasAirdrop.value }"
  //-             @click="getAirdrop()"
  //-           ).d-flex.align-items-center
  //-             template(
  //-               v-if="hasAirdrop.loading"
  //-             )
  //-               .me-2
  //-                 .spinner-border.spinner-border-sm
  //-               .flex-fill Waiting for your confirmation...
  //-             template(
  //-               v-else-if="hasAirdrop.value"
  //-             )
  //-               i.fa.fa-fw.fa-check.text-success.me-2
  //-               .flex-fill Airdrop sent!

  //-             template(
  //-               v-else
  //-             )
  //-               i.fa.fa-fw.fa-arrow-right.text-success.me-2
  //-               a.flex-fill
  //-                 strong Begin Claim


</template>
<style lang="scss" scoped>

</style>
