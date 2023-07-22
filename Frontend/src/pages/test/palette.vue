<script lang="ts" setup>
import { abbreviateNumber } from "$/lib/utils";


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

async function createPalette() {
  try{
    const {
      data,
    } = await axios.request( {
      method : "POST",
      url    : `/api/palettes`,
      data   : {
        name : "New Palette",
      },
    } );
  } catch( error:any ){
    console.error( error );
  }
}


// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );

interface ColorItem {
  color: string;
  name: string;
  _logSupply: number;
  supply: number;
}
const colors = ref<ColorItem[]>( [] );

function addColor(){
  colors.value.push(
    {
      color      : "#000000",
      name       : "",
      _logSupply : 1,
      supply     : 100,
    }
  );
}


</script>
<template lang="pug">

.py-3.bg-light
  .container
    .row
      .col
        h4 Palette Creator

.page-h.py-5.bg-light1
  .container
    .row
      .col
        .list-group
          .list-group-item(v-for="(color, i) in colors")
            .row.align-items-center
              .col-auto
                input.form-control.color-picker(
                  type="color"
                  v-model="colors[i].color"
                )
              .col
                label HEX Code
                input.form-control(
                  v-model="colors[i].color"
                )
              .col
                label Name
                input.form-control(
                  v-model="colors[i].name"
                )
              .col
                label Supply
                div
                  h5.m-0.monospace {{ abbreviateNumber(colors[i].supply) }}
                  input(
                    v-model="colors[i]._logSupply"
                    @input="colors[i].supply = Math.pow(10,color._logSupply)"
                    type="range"
                    min="1"
                    step="1"
                    max="10"
                  ).w-100

        
        .my-3
          .btn.btn-primary(
            @click="addColor"
          ) Add Color


      .col-4
        .card
          .card-body
          .card-footer
            .btn.btn-primary Checkout #[i.fa.fa-chevron-right]

</template>
<style lang="scss" scoped>
.color-picker{
  width: 4rem;
  height: 4rem;
  padding: 0;
  overflow:hidden;
}
</style>
