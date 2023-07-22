<script lang="ts" setup>
import { openErrorModal } from "$/lib/utils";
import userStore from "$/store/session";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  userStore.start();
  isLoading.value = true;
  //
  isLoading.value = false;
} );

// Events
const emit = defineEmits<{
  ( event: "done", val: any ): void;
}>();

/*
-------------------------------------
Feedback
-------------------------------------
*/
interface Feedback {
  // discordName: string,
  type: string,
  headline: string,
  body: string,
}

const form = reactive<Feedback>( {
  // discordName : "",
  type     : "",
  headline : "",
  body     : "",
} );

async function submitFeedback( message:Feedback ){
  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/feedback`,
      data   : {
        ...message,
      },
    } );
    // handle result

    await openErrorModal( "Thank You" );
    Object.keys( form ).forEach( ( key, index, object ) => {
      form[key] = "";
    } );
  } catch( error:any ){
    // console.error( error );
    await openErrorModal( error || "Something went wrong" );
  }
}


// Expose
defineExpose( {} );


</script>
<template lang="pug">

form(@submit.prevent="submitFeedback(form); $emit('done', null)").row.g-2
  .col-md-8
    .form-floating
      
      input.form-control(
        v-model="form.headline"
        type="text"
        placeholder="Headline"
      )
      label Headline
  .col-md
    .form-floating
      
      select.form-control(
        v-model="form.type"
      )
        option(value="Issue") Issue
        option(value="Suggestion") Suggestion
        option(value="Proposal") Proposal
        option(value="Question") Question

      label Category
  .col-12
    .form-floating
      
      textarea.form-control(
        v-model="form.body"
        placeholder="Body"
      )
      label Question, comment, suggestion, or concern:
  .col-12
    button.btn.btn-primary.btn-block Submit

</template>
<style lang="scss" scoped>
textarea.form-control{
  min-height: 10rem;
}
</style>

