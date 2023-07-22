
<script lang="ts" setup>

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

const canvas = ref<HTMLCanvasElement>();
let ctx: CanvasRenderingContext2D;

async function initCanvas(){
  const cnv = canvas.value!;

  ctx =   cnv.getContext( "2d" ) as CanvasRenderingContext2D;
}


// Data
const isLoading = ref( false );
interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}
interface HSB {
  H: number;
  S: number;
  B: number;
  a?: number;
}

function hslToHex( h: number, s: number, l: number ) {
  const a = s * Math.min( l, 1 - l );

  const f = n => {
    const k = ( n + h / 30 ) % 12;
    const color = l - a * Math.max( Math.min( k - 3, 9 - k, 1 ), -1 );
    return Math.round( 255 * color ).toString( 16 ).padStart( 2, "0" );
  };

  return `0x${ f( 0 ) }${ f( 8 ) }${ f( 4 ) }`.toUpperCase();
}


const hexToRGB = ( hex:string ) => {
  let alpha = false;
  let h = hex.slice( hex.startsWith( "#" ) ? 1 : ( hex.startsWith( "0x" ) ? 1 : 0 ) );

  if ( h.length === 3 ) {
    h = [
      ...h,
    ].map( x => x + x ).join( "" );
  } else if ( h.length === 8 ) {
    alpha = true;
  }

  const X = parseInt( h, 16 );
  return {
    r : X >>> ( alpha ? 24 : 16 ),
    g : ( X & ( alpha ? 0x00ff0000 : 0x00ff00 ) ) >>> ( alpha ? 16 : 8 ),
    b : ( X & ( alpha ? 0x0000ff00 : 0x0000ff ) ) >>> ( alpha ? 8 : 0 ),
    a : alpha ? X & 0x000000ff : 1,
  };
};

function HSBToRGB( {
  H, S, B, a,
}: HSB ) {
  S /= 100;
  B /= 100;

  const k = ( n: number ): number => ( n + H / 60 ) % 6;
  const f = ( n: number ): number => B * ( 1 - S * Math.max( 0, Math.min( k( n ), 4 - k( n ), 1 ) ) );

  const [
    r, g, b,
  ] = [
    255 * f( 5 ), 255 * f( 3 ), 255 * f( 1 ),
  ];

  return {
    r, g, b, a,
  } as RGB;
}

function RGBToHSB( {
  r, g, b, a,
}: RGB ) {
  r /= 255;
  g /= 255;
  b /= 255;

  const v = Math.max( r, g, b ), n = v - Math.min( r, g, b );
  const h = n === 0 ? 0 : n && v === r ? ( g - b ) / n : v === g ? 2 + ( b - r ) / n : 4 + ( r - g ) / n;

  const [
    H, S, B,
  ] = [
    60 * ( h < 0 ? h + 6 : h ), v && ( n / v ) * 100, v * 100,
  ];

  return {
    H, S, B, a,
  } as HSB;
}


const colors = ref( [
  // "0xFFFFFF",
  "0xBFBFBF",
  "0x808080",
  "0x404040",
  "0x000000",
  "0x081CD3",
  "0x92BEFF",
  "0x07C8CF",
  "0x09C473",
  "0x34D585",
  "0xB7ED7D",
  "0xE3C815",
  "0xFD6041",
  "0xD62D0E",
  "0xA5321F",
  "0xE11552",
  "0x6A2DD2",
  "0xFFCC70",
  "0xC9F7EC",
  "0x6AFAD6",
  "0xD5FCAB",
  "0xD2FB47",
  "0xFCF14A",
  "0xD6E6FF",
  "0xFCE5EF",
].map( x=>{
  const hex = x.replace( "0x", "#" );
  const rgb = hexToRGB( hex );
  const hsb = RGBToHSB( rgb );

  const value = getValue( {
    hsb,
  } );

  const price = getPrice( {
    hsb,
  } );

  return {
    hex,
    rgb,
    hsb,
    value,
    price,
  };
} ).sort( ( a:any, b:any ) => {
  if( a.value > b.value ) {
    return -1;
  }

  if( a.value < b.value ) {
    return 1;
  }

  return 0;
} ) );

// Mounted
onMounted( async () => {
  // makeColors();
  await initCanvas();

  const center = {
    x : ctx.canvas.width,
  };
  
  const COLORS = [];
} );

const items = ref<any[]>( [] );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();



function makeColors(){
  let numColors = 8;
  let hue = 0;
  let sat = 0;
  let lum = 0;
  let amt = 0.01;
  let num = 1000000;

  items.value[0] = {
    id    : 0,
    hue   : 0,
    sat   : 0,
    lum   : 0,
    amt,
    num,
    color : hslToHex( 0, 0, 0 ),
  };

  for( let i = 0; i < numColors; i++ ){
    hue =  3 * 360 * ( 0.2 + ( Math.pow( i / numColors, 1 ) * ( 1 ) ) ) % 360 ;
    sat = 0.25 + 0.5 * Math.pow( i / numColors, 2 );
    lum = 0.75 - 0.25 * Math.pow( i / numColors, 1  );
    amt = 0.01 * ( Math.pow( 1.5, i + 1 ) );
    num = 1000000 / Math.pow( 2, i + 1 );
    items.value[i + 1] = {
      id    : i,
      hue,
      sat,
      lum,
      amt,
      num,
      color : hslToHex( hue, sat, lum ),
    };
  }
}

function formatValue( x:any ){
  if( typeof x === "number" ){
    return x.toFixed( 4 );
  }

  if( typeof x === "string" ){
    return x;
  }
}

function formatObject( x ){
  return Object.entries( x ).map( ( [
    k, v,
  ] )=>`${ k }: ${ formatValue( v ) }` ).join( "\n" );
}

function getValue( item:any ){
  if( !item.hsb ) {
    return 0;
  }

  return  (  ( 0.5 * 1 + Math.pow( 1 + Math.cos( Math.PI * item.hsb.H / 180 ), 1 + ( item.hsb.S ) / 100 * ( item.hsb.B / 100 ) ) ) ) * ( item.hsb.B / 100 ) * ( item.hsb.S ) / 100 ;
}

function getPrice( item:any ){
  const val = getValue( item );
  return 0.001 + 0.05 * Math.pow( val, 3 );
}



</script>
<template lang="pug">

.container
  canvas(ref="canvas").square

  RenderTable(
    :value="colors",
    :headings="['', /*  'hue sat bri', 'val',  */'price']",
  )
    template(#col-0="{item}")
      i.fa.fa-circle(:style="{ color: item.hex }")

    //- template(#col-1="{item}")
    //-   .row(v-if="item")
    //-     code.col {{ formatValue(item.hsb.H) }}
    //-     code.col {{ formatValue(item.hsb.S) }}
    //-     code.col {{ formatValue(item.hsb.B) }}

    //- template(#col-2="{item}")
      code {{ formatValue( item.value ) }}

    template(#col-1="{item}")
      code {{ formatValue( item.price ) }}



  //- table.table.table-sm.text-center
    thead
      tr
        td ID
        td Color
        td Hue
        td Sat
        td Lum
        td ETH
        td QTY
    tbody
      tr(v-for="(item, index) in colors")
        td {{index}}
        td(:style=`{backgroundColor: item.hex }`)
          | {{item.hex}}
          
        td {{ item.hsb }}
        td {{ item.hex }}
        td {{ item.hex }}
        td {{ item.hex }}
        td {{ item.hex }}


</template>
<style lang="scss" scoped>
code {
  text-align: right;
  display: block;
}
</style>
