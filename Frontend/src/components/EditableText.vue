<script lang="ts" setup>
import type { Field } from "$/lib/utils";


// Props
const props = withDefaults( defineProps<{
  value: Field,
  editable: boolean,
}>(), {
  editable : false,
} );

// Data
const isEditing = ref( false );

// Emits
const emit = defineEmits<{
  // ( event: "update:value", val: Field ): void,
  ( event: "change", val: Field ): void
  ( event: "cancel" ): void
}>();


async function startEdit(){
  await nextTick();
  input.value.focus();
  input.value.select();
  isEditing.value = true;
}

const input = ref();

</script>
<template lang="pug">

div(
  @keydown.escape="()=>{if(isEditing) { $emit('cancel'); isEditing=false; }}"
  tabindex="-1"
).row.g-0
  .pos-abs.left.top.bottom(
    v-if="value.isLoading"
  ) #[span.spinner-border]

  .col-auto(v-show="isEditing").field
    slot(name="edit")
      form(
        @submit.prevent="$emit('change', value); isEditing=false;"
      ).row.align-items-center.g-2
        .col
          input.form-control(
            ref="input"
            v-model="value.value"
            :class="{'is-invalid': ( value.isInvalid || (value.value.length) < 5 || (value.value.length) > 16 )}"
            tabindex="1"
          ).bg-white.border-0
        .col-auto.btn-toolbar
            button.px-3.btn.btn-success(
              @click.stop="$emit('change', value); "
            ) #[i.fa.fa-check]
            button.px-3.btn.btn-danger(
              @click.stop="$emit('cancel'); "
            ) #[i.fa.fa-times]


  .col-auto(
    :class="{faded: value.isLoading}"
    v-show="!isEditing"
    tabindex="-1"
    @focusin="()=>startEdit()"
  )
    slot
    | #[.btn.btn-outline-dark.ms-4(v-if="editable") Change Name]

</template>

<style lang="scss" scoped>
// .field{
//   margin-top: calc( -1 * ( $input-border-width + $input-padding-y ) );
//   margin-left: calc( -1 * ( $input-border-width + $input-padding-x ) );
//   display: inline-block;
// }
// sup{
//   font-size: initial;
//   margin: 0.5em;
// }
button{
  height: 100%;
  display: block;
}
input.form-control{
  height: 100%;
  font-size: inherit;
  background-color: transparent;
  max-width: 20rem;
  display: block;
}
</style>
