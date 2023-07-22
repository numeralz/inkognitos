<script lang="ts" setup>

// https://github.com/mapbox/delaunator
import Delaunator from "delaunator";
// https://github.com/miguelmota/sobel
import Sobel from "sobel";

// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

function loadImage( url ) {
  return new Promise<HTMLImageElement>( r => {
    let i = new Image();

    i.onload = ( () => r( i ) );
    i.crossOrigin = "";
    i.src = url;
  } );
}

let ctx!: CanvasRenderingContext2D;
let rgba: Uint8ClampedArray;
let luma: Uint32Array;
let img: HTMLImageElement;

function getSobelPoints( imageData:ImageData, threshhold = 200 ){
  let res:number[][] = [];

  const {
    data, width,
  } = imageData;


  for ( let i = 0; i < data.length; i = i + 4 ) {
    if( data[i] ){
      const n = i / 4;

      res.push( [
        n % width, Math.floor( n / width ),
      ] );
    }
  }

  return res;
}

const drawOneTriangle = ( ctx, triangle, color ) => {
  ctx.beginPath();
  ctx.moveTo( ...triangle[0] );
  ctx.lineTo( ...triangle[1] );
  ctx.lineTo( ...triangle[2] );
  ctx.lineTo( ...triangle[0] );
  ctx.fillStyle = `rgb(${  color  })`;
  ctx.strokeStyle = `rgb(${  color  })`;
  ctx.fill();
  ctx.stroke();
};

const getColor = ( ctx, triangle ) => {
  const point = {
    x : ( triangle[0][0] + triangle[1][0] + triangle[2][0] ) / 3,
    y : ( triangle[0][1] + triangle[1][1] + triangle[2][1] ) / 3,
  };

  const color = ctx.getImageData( point.x, point.y, 1, 1 ).data;
  return color;
};

function getPx( imageData: ImageData, x:number, y:number ){
  return imageData.data[( y * imageData.width + x ) * 4];
}

function highestPowerOf2( n:number ) {
  return ( n & ( ~( n - 1 ) ) );
}

// Mounted
onMounted( async () => {
  const c1 = document.createElement( "canvas" );

  c1.width = 500;
  c1.height = 500;
  c1.style.imageRendering = "pixelated";
  ctx = c1!.getContext( "2d" )!;

  const c0 = canvas.value!;

  c0.width = 500;
  c0.height = 500;
  c0.style.imageRendering = "pixelated";
  ctx = c0!.getContext( "2d" )!;
  img = await loadImage( `https://thispersondoesnotexist.com/image` );
  ctx.drawImage( img, 0, 0, img.width, img.height, 0, 0, c0.width, c0.height  );
  
  var imageData = ctx.getImageData( 0, 0, c0.width, c0.height );

  rgba = imageData.data;

  var sobelData = Sobel( imageData );
  var sobelImageData = sobelData.toImageData() as ImageData;

  for( let i = 0; i < sobelImageData.data.length; i += 4 ){
    const wtx = highestPowerOf2( 256 * Math.floor( i % sobelImageData.width ) ) / 256;
    const wty = highestPowerOf2( 256 * Math.floor( i / sobelImageData.width ) ) / 256;
    const val = sobelImageData.data[i] * wtx * wty;

    sobelImageData.data[i] = val;
    sobelImageData.data[i + 1] = val;
    sobelImageData.data[i + 2] = val;
  }

  const bestPoints = getSobelPoints( sobelImageData );
  
  // let bestPoints = ( points.sort( ( a, b ) => {
  //   return Math.sign( getPx( sobelImageData, b[0], b[1] ) - getPx( sobelImageData, a[0], a[1] ) );
  // } ) ).slice( 0, Math.floor( points.length * 0.25 ) );
  
  
  // for( let i = 0; i <= 8; i++ ){
  //   bestPoints.push( [
  //     Math.floor( ( sobelImageData.width - 1 ) * i / 8 ), 0,
  //   ] );
  //   bestPoints.push( [
  //     Math.floor( ( sobelImageData.width - 1 ) * i / 8 ), ( sobelImageData.height - 1 ),
  //   ] );
  //   bestPoints.push( [
  //     0, Math.floor( ( sobelImageData.height - 1 ) * i / 8 ),
  //   ] );
  //   bestPoints.push( [
  //     ( sobelImageData.width - 1 ), Math.floor( ( sobelImageData.height - 1 ) * i / 8 ),
  //   ] );
  // }


  const delaunay = Delaunator.from( bestPoints );
  
  ctx.putImageData( sobelImageData, 0, 0 );

  const triangles = delaunay.triangles!;
  const n = triangles.length / 3;

  for ( let i = 0; i < n; i++ ) {
    const triangle = [
      bestPoints[triangles[i * 3]], bestPoints[triangles[i * 3 + 1]], bestPoints[triangles[i * 3 + 2]],
    ];

    let color = getColor( ctx, triangle );

    drawOneTriangle( ctx, triangle, color );
  }
} );

const lerp = ( x: number, y: number, a: number ) => x * ( 1 - a ) + y * a;

function interp( x:number, y:number ){
  const x1 = Math.floor( x );
  const x2 = Math.ceil( x );
  const y1 = Math.floor( y );
  const y2 = Math.ceil( y );
  const X1 = x - x1;
  const X2 = x2 - x;
  const Y1 = y - y1;
  const Y2 = y2 - y;
  return [
    ( X1 * Y1 ),
    ( X2 * Y1 ),
    ( X1 * Y2 ),
    ( X2 * Y2 ),
  ];
}

function corners( x:number, y:number ){
  const x1 = Math.floor( x );
  const x2 = Math.ceil( x );
  const y1 = Math.floor( y );
  const y2 = Math.ceil( y );
  return [
    px( x1, y1 ),
    px( x2, y1 ),
    px( x1, y2 ),
    px( x2, y2 ),
  ];
}

function px ( x: number, y: number ) {
  const c = canvas.value!;
  return luma[ ( y * c.width ) + x ];
}

function setpx ( x: number, y: number, val:number ) {
  const c = canvas.value!;

  rgba[ ( y * c.width ) + x + 0 ] = val;
  rgba[ ( y * c.width ) + x + 1 ] = val;
  rgba[ ( y * c.width ) + x + 2 ] = val;
}

function update(){
  const c = canvas.value!;

  for ( let i = 0; i < luma.length; i ++ ) {
    rgba[ i * 4 + 0 ] = luma[i];
    rgba[ i * 4 + 1 ] = luma[i];
    rgba[ i * 4 + 2 ] = luma[i];
  }

  ctx.putImageData(
    new ImageData( rgba, canvas.value!.width, canvas.value!.height ),
    0,
    0
  );
}



// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

let mouse = {
  x : 0, y : 0,
};

function onMouseMove( e: MouseEvent ) {
  mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown( e ) {
  console.log( "mouse down" );
}

// Expose
defineExpose( {} );

const canvas = ref<HTMLCanvasElement>();

</script>
<template lang="pug">

canvas(
  ref="canvas"
)
input(type="file")


</template>
<style lang="scss" scoped>
canvas{
  width: 100%;
}
</style>
