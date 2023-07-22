<script lang="ts" setup>
import { onMounted } from "vue";
import { isClient, usePointer } from "@vueuse/core";
import * as paper from "paper";
    

// Props

let PAPER: paper.PaperScope;
// Data
const isLoading = ref( false );
const layers: Record<string, paper.Layer> = {};
let pointerDown = false;
const brushWidth = 4;
const route = useRoute();
const canvasWrapper = ref<HTMLDivElement>();
let circle: paper.Shape.Circle;
let mouse1;
let mouse0;
let rect:paper.Rectangle;

function getRect(){
  const r = canvasWrapper.value?.getBoundingClientRect();

  rect.set( r );
}

const hideChild = ref( false );

function onPointerDown( e:PointerEvent ){
  if( pointerDown ) {
    return;
  }

  if( circle ){
    circle.visible = pointerDown;
  }

  pointerDown = true;
  startDraw();
  update();
  path?.add( mouse1 );
}

function onPointerUp( e:PointerEvent ){
  pointerDown = false;

  if( circle ){
    circle.visible = pointerDown;
  }

  endDraw();
}

let path : paper.Path|null;

const lineStyle = {
  insert      : false,
  strokeWidth : brushWidth,
  strokeColor : "#000",
  strokeJoin  : "round",
  strokeCap   : "round",
  miterLimit  : 0,
} ;

function startDraw(){
  circle.visible = true;
  path = new paper.Path( lineStyle );
  path.opacity = 0.5;
  path.add(
    mouse1
  );
}


function endDraw(){
  if( path ){
    path.add(
      mouse1
    );

    const buf = new Float32Array(
      path.segments.flatMap( o=>[
        o.point.x, o.point.y,
      ] )
    );

    path.removeSegments();

    try{
      ws.send( buf );
    }catch( err ){
      //
    }
  }
}

let ws:WebSocket;

function connectToRoom( onMessage: ( d:any )=>void ):Promise<WebSocket>{
  return new Promise<WebSocket>( ( resolve, reject ) => {
    console.info( "Connect..." );

    if( ws ){
      ws.close();
    }

    console.log( import.meta.env );
    

    const WSURL =  `${ document.location.protocol === "https:" ? "wss:" : "ws:" }//${  document.location.host  }/ws`;
    // const WSURL = `ws://${ document.location.hostname }:30003/ws`;
    
    ws = new WebSocket( WSURL );
    ws.binaryType = "arraybuffer";
    ws.onerror = ( e  )=>{
      console.log( "ws.error", e );
    };
    ws.onopen = () => {
      console.log( "ws.open" );
      resolve( ws );
      ws.onclose = () => {
        console.log( "ws.close" );
        setTimeout( () => {
          connectToRoom( onMessage );
        } );
      };
      ws.onmessage = ( evt ) => {
        onMessage( evt.data );
      };
    };
  } );
}

const mPos = usePointer();

function update(){
  if( pointerDown ){
    requestAnimationFrame( update );
  }

  getRect();

  if( !rect ) {
    return;
  }
  
  
  const scale = PAPER.view.viewSize.width / rect.width;

  mouse1.x = ( mPos.x.value - rect.x ) * scale;
  mouse1.y = ( mPos.y.value - rect.y ) * scale;
  

  if( path ){
    path.lastSegment?.point?.set(
      mouse1
    );
  }

  const dist = Math.max(
    Math.abs( mouse0.x - mouse1.x ),
    Math.abs( mouse0.y - mouse1.y )
  );
  
  circle.position.set( mouse1 );

  if( dist < 8 ){
    return;
  }
  
  // const px = mouse1.divide( gridSize ).floor();
  
  // const dist1 = Math.max(
  //   Math.abs( px.x - lastPixel.x ),
  //   Math.abs( px.y - lastPixel.y )
  // );

  // if( dist1 > 2 ){
  //   const px1 = lastPixel.add(
  //     px.subtract( lastPixel ).normalize()
  //   );

  //   const pixel = pixels[px1.y]?.[px1.x];

  //   if( pixel ){
  //     pixel.item!.opacity = ( pixel.value = 1 );
  //   }
  // }

  // lastPixel.set( px );
  mouse0.set( mouse1 );

  if( path ){
    if( path.segments.length > 10 ){
      endDraw();
      startDraw();
    }

    path.add( mouse1 );
  }
}

function onResize(){
  getRect();
}

if( isClient ){
  onBeforeUnmount( () => {
    console.log( "unmount" );
    canvasWrapper.value?.removeEventListener( "pointerdown", onPointerDown );
    canvasWrapper.value?.removeEventListener( "pointerup", onPointerUp );
    ws?.close();
  } );
}

// Mounted
onMounted( async () => {
  if( !isClient ){
    return;
  }

  isLoading.value = true;
  await connectToRoom( ( data:ArrayBuffer ) => {
    const pixels = new Float32Array( data.slice(
      0,
      Math.floor( data.byteLength / 4 ) * 4
    ) );

    const len = pixels.length;
    const p = new paper.Path( lineStyle );

    for( let i = 0; i < len; i += 2 ){
      const x = pixels[i];
      const y = pixels[i + 1];

      p.add( new paper.Segment(
        new paper.Point( x, y )
      ) );
    }

    p.addTo( PAPER.project.activeLayer );
  } );

  if( !ws ){
    return;
  }
  
  if( !PAPER ){
    PAPER = new paper.PaperScope();
    PAPER.setup( new paper.Size( 1024, 1024 ) );
    canvasWrapper.value?.appendChild( PAPER.view.element );
    PAPER.view.element.style.width = "100%";
    PAPER.view.element.style.height = "auto";
    layers.grid = new paper.Layer( {
      insert  : true,
      visible : true,
    } );
    layers.raster = new paper.Layer( {
      insert  : true,
      visible : true,
    } );
    layers.active = new paper.Layer( {
      insert  : true,
      visible : true,
    } );
    PAPER.view.autoUpdate = true;
  }
  
  layers.active.activate();
  circle = new paper.Shape.Circle( {
    position    : new paper.Point( 0, 0 ),
    radius      : 8,
    strokeColor : "#000000",
    strokeWidth : 2,
    insert      : true,
  } );
  mouse0 = new paper.Point( 0, 0 );
  mouse1 = new paper.Point( 0, 0 );
  rect = new paper.Rectangle( {} );
  canvasWrapper.value?.addEventListener( "pointerdown", () => {
    hideChild.value = true;
  }, {
    once : true,
  }  );
  canvasWrapper.value?.addEventListener( "pointerdown", onPointerDown );
  canvasWrapper.value?.addEventListener( "pointerup", onPointerUp );
  onResize();
  canvasWrapper.value?.addEventListener( "resize", onResize, {
    passive : true,
    capture : false,
  } );
  isLoading.value = false;
} );

</script>
<template lang="pug">

.main(
  ref="canvasWrapper"
)
  slot(
    v-if="!hideChild"
  )


</template>
<style lang="scss" scoped>
.side{
  min-width: 10rem;
}
.main{
  position: absolute;
  top:0;
  left:0;
  bottom:0;
  right:0;
}
</style>
