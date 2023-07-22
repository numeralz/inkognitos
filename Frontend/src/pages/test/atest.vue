<script lang="ts" setup>
import paper from "paper";


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
  _init();
  isLoading.value = false;
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();


// Expose
defineExpose( {} );

let path0: paper.Path;
let path1: paper.Path;
let mouseIsDown = false;
const canvas = ref<HTMLCanvasElement>();
let p: paper.Project;

function _init(){
  // window.addEventListener( "pointerdown", onMouseDown );
  // window.addEventListener( "pointerup", onMouseUp );
  // window.addEventListener( "drag", onDrag );

  // p = new paper.PaperScope();
  paper.setup( canvas.value! );
  p = paper.project;
  paper.tool = new paper.Tool();
  paper.tool.onMouseDown = onMouseDown;
  paper.tool.fixedDistance = 1;
  paper.tool.onMouseUp = onMouseUp;
  paper.tool.onMouseDrag = onDrag;
  window.addEventListener( "resize", onResize );
  onResize();
}

function onResize(){
  p.view.viewSize.set(
    canvas.value?.clientWidth,
    canvas.value?.clientHeight
  );
}

function startPath( e: paper.MouseEvent ){
  time0 = Date.now();
  speed = 0;
  path0 = new paper.Path( {
    strokeColor : "#000",
    strokeWidth : 3,
    segments    : [
      e.point,
    ],
  } );
  path1 = new paper.Path( {
    fillColor : "#000000FF",
    segments  : [
      e.point,
    ],
  } );
}

function endPath( event: paper.MouseEvent ){
  const s = Math.ceil( path1.segments.length / 2 ) * 2;

  path1.insert(
    s / 2,
    event.point
  );
}

function onMouseDown( event:paper.MouseEvent ) {
  mouseIsDown = true;
  startPath( event );
}

function onMouseUp( event:paper.MouseEvent ) {
  mouseIsDown = false;
  endPath( event );
}

let mouseVel:paper.Point = new paper.Point( 0, 0 );
let mouse0:paper.Point = new paper.Point( 0, 0 );
let time0 = 0;
let speed = 0;


function onDrag( event:paper.MouseEvent ) {
  const now = Date.now();
  const dt = now - time0;


  mouseVel = event.point.subtract(
    mouse0
  );

  if( mouseVel.length < 6 ){
    return;
  }

  path0.add( event.point );

  const mouseSpeed = Math.min( 50, mouseVel.length / dt );

  speed = speed * 0.5 + mouseSpeed * 0.5;
  mouse0.set( event.point );
  time0 = now;

  if( path0.segments.length > 2 ){
    const nor = path0.getNormalAt( path0.length );
    const s = Math.round( path1.segments.length / 2 );

    path1.insert(
      s,
      event.point.add( nor.multiply( +6 * ( 1 / Math.log( 3 + speed ) ) ) )
    );
    path1.insert(
      s,
      event.point.add( nor.multiply( -6 * ( 1 / Math.log( 3 + speed ) ) ) )
    );
  }
}


</script>
<template lang="pug">

canvas(
  ref="canvas"
)

</template>
<style lang="scss" scoped>

canvas{
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background-color: #EEE;
}

</style>
