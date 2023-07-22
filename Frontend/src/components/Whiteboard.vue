<script setup lang="ts">
import { RingBuffer } from "$/lib/FastQueue";
import { TAO } from "$/lib/utils";
import type { PathExtended, PathType, Tool } from "$/lib/Whiteboard";
import { getMirrorPoint, StateManager } from "$/lib/Whiteboard";
import paper from "paper";

/*
-------------------------------------
POINTER EVENTS
-------------------------------------
*/
const isReady = ref( false );
let penBuf = new RingBuffer<QueueItem>( 1024 );
interface QueueItem {
  point: paper.Point,
  time: number,
  last?: boolean,
  first?: boolean,
}
let mouseDown = false;

const PASSIVE = {
  passive : true,
  capture : false,
};

let next: QueueItem|null;
const GRID_SIZE = 8;
let stateMan:StateManager;
const canvas = ref<HTMLCanvasElement>();
const inkUsed = ref<Record<string, number>>( {} );
const mPos = new paper.Point( 0, 0 );
const PAPER = new paper.PaperScope();
const wrapper = ref<HTMLElement>();
let animation : number;
let canvasRect:DOMRect;
let path: PathExtended<paper.Path> | null;

const mirrorColor = new paper.Color( {
  hue        : 200,
  lightness  : 0.5,
  saturation : 0.5,
} );


const props = withDefaults(
  defineProps<{
    onlyPen: boolean;
    currentTool: Tool|null;
    hideTemplate: boolean;
    config: {
      size: [number, number];
      bgImage?: string;
      penWidth: number;
    },
    targetLayer: number;
    useMirror: boolean;
    strokeFillMode: {
      fill: boolean,
      stroke: boolean,
    },
  }>(),
  {
    config : () => ( {
      penWidth : 7,
      size     : [
        0, 0,
      ],
      bgImage : "",
    } ),
    currentTool    : null,
    hideTemplate   : true,
    onlyPen        : false,
    strokeFillMode : () => ( {
      fill   : false,
      stroke : false,
    } ),
    useMirror : false,
  }
);

const emit = defineEmits<{
  ( event: "modify" ): void;
}>();


function clamp( val: number, min: number, max: number ) {
  return Math.min( Math.max( val, min ), max );
}


function mousePos( e:MouseEvent ) {
  if( !canvasRect ) {
    throw new Error( "canvasRect not set" );
  }

  // layers.fg?.activate();
  mPos.set(
    0.5 + Math.round(
      ( PAPER.view.size.width ) *
      clamp( ( e.clientX - canvasRect.left ) / ( canvasRect.width ), 0, 1 )
    ),
    0.5 + Math.round(
      ( PAPER.view.size.height )  *
      clamp( ( e.clientY - canvasRect.top ) / ( canvasRect.height ), 0, 1 )
    )
  );

  return mPos;
}

function onDrag( e: PointerEvent ){
  if ( props.onlyPen && e.pointerType === "touch" ) {
    return;
  }

  if( mouseDown ){
    continuePath( <QueueItem>{
      point : mousePos( e ),
    } );
  }
}

function onPointerDown( e: PointerEvent ) {
  // PAPER.project.activate();
  // layers.active?.activate();

  if ( props.onlyPen && e.pointerType === "touch" ) {
    return;
  }

  if( e.pointerType === "mouse" && e.button !== 0 ){
    return;
  }
  
  if( mouseDown ){
    return;
  }

  mouseDown = true;

  try{
    startPath( {
      point : mousePos( e ),
    } );
    PAPER.view.element.removeEventListener( "pointermove", onDrag );
    PAPER.view.element.addEventListener( "pointermove", onDrag, PASSIVE );
    tickStop();
    tick();
  }catch( err ){
    console.log( err );
  }
}



function onPointerUp( e: PointerEvent ) {
  if ( props.onlyPen && e.pointerType === "touch" ) {
    return;
  }

  if( e.pointerType === "mouse" && e.button != 0 ){
    return;
  }

  if( !mouseDown ){
    return;
  }


  mouseDown = false;

  try{
    continuePath( <QueueItem>{
      point : mousePos( e ),
    } );
    endPath( <QueueItem>{
      point : mousePos( e ),
    } );
    window.removeEventListener( "pointermove", onDrag );
    tickStop();
  }catch( err ){
    // console.log( err );
  }
}


const tickStop = ()=>{
  if( animation ){
    cancelAnimationFrame( animation );
    animation = 0;
  }
};

const tick = ()=>{
  animation = requestAnimationFrame( tick );
  PAPER.view.update();
};



/*
-------------------------------------
Path Drawing
-------------------------------------
*/
function startPath( {
  point,
}:{
  point: paper.Point
} ) {
  if( !path ){
    path = new paper.Path( {
      segments : [
        point,
      ],
      insert : false,
    } );
  }

  if( props.targetLayer < 0 ) {
    layers.behind?.addChild( path );
  }else{
    layers.active?.addChild( path );
  }

  props.currentTool?.onStart?.( path, stateMan!, point );
  
  if( props.useMirror ){
    StateManager!.updateMirror( path );
  }

  PAPER.view.update();
}



/* Continue */
function continuePath( context:QueueItem ) {
  if( !path ) {
    return;
  }

  const pos = context.point;
  const s1 = path.lastSegment;
  


  if( props.currentTool?.onMove ){
    props.currentTool?.onMove?.( path, stateMan!, pos, context );
  }else{
    path.lastSegment.point.set(
      path.lastSegment.point.multiply( 0.5 ).add( pos.multiply( 0.5 ) )
    );

    if( path._mirror ){
      const pos_ = getMirrorPoint( path?.lastSegment.point, path.project );

      path._mirror?.lastSegment.point.set( pos_ );
    }
  }

  if( ( path.lastSegment?.previous?.point.getDistance( pos ) || 8 ) < 8 ){
    return;
  }

  props.currentTool?.onDraw?.( path, stateMan!, pos, context );

  /* calculate */
  const fillColor = path.fillColor?.toCSS( true ).toUpperCase();

  // inkUsedTemp[fillColor] = path.area * INK_FACTOR;
}



/* End Path */
function endPath( context: QueueItem ) {
  if ( !path ) {
    return;
  }

  if( path?.segments.length > 2 ){
    props.currentTool?.onDraw?.( path, stateMan!, context.point, context );
    props.currentTool?.onEnd?.( path, stateMan!, context.point, context );
  }

  PAPER.view.update();
  path = null;
  emit( "modify" );
  PAPER.project.deselectAll();
}

function highestPowerOf2( n:number ) {
  return ( n & ( ~( n - 1 ) ) );
}

const layers: {
  bg? : paper.Layer,
  parent? : paper.Layer,
  fg? : paper.Layer,
  active? : paper.Layer,
  behind? : paper.Layer,
  mirror? : paper.Layer,
  rasterLines? : paper.Layer,
  raster? : paper.Layer,
  guide? : paper.Layer,
  grid? : paper.Layer,
} = {};

onMounted( async () => {
  isReady.value = false;

  if( !canvas.value ){
    PAPER.setup(
      new paper.Size( props.config.size?.[0], props.config.size?.[1] )
    );
    wrapper.value?.appendChild( PAPER.view.element );
    canvas.value = PAPER.view.element;
    
    const ctx = canvas.value!.getContext( "2d" )!;

    ctx.imageSmoothingEnabled = false;
    PAPER.view.element.style.width = `100%`;
    PAPER.view.element.style.height = `auto`;
    // PAPER.view.element.style.shapeRendering = "pixelated";
    // PAPER.view.element.style.imageRendering = "pixelated";
    PAPER.view.element.style.backgroundColor = "#f5f5f5";
    PAPER.view.element.style.display = "block";
  }

  onResize();

  if( !stateMan ){
    stateMan = new StateManager( {
      PAPER,
      layers,
      target : toRef( props, "targetLayer" ),
    } );
  }

  PAPER.view.autoUpdate = false;
  PAPER.project.clear();
  StateManager.PAPER = PAPER;
  path = null;
  PAPER.project.activate();
  /* Graphics */
  await init();
  await initGrid();
  PAPER.view.update();
  /* Events */
  removeEvents();
  window.addEventListener( "resize", onResize, PASSIVE );
  PAPER.view.element.addEventListener( "pointerdown", onPointerDown, PASSIVE );
  PAPER.view.element.addEventListener( "pointerup", onPointerUp, PASSIVE );
  /* Watch Mirror */
  watch(
    ()=>props.useMirror,
    ( v )=>{
      // if( v ){
      //   PAPER.project.insertLayer(
      //     PAPER.project.layers.length - 1,
      //     layers.mirror!
      //   );
      //   layers.mirror!.bringToFront();
      // }else{
      //   layers.mirror?.remove();
      // }

      layers.mirror!.visible = v;
      PAPER.view.update();
    },
    {
      immediate : true,
    }
  );
  watch(
    ()=>props.targetLayer,
    ( val ) => {
      if( val < 0 ) {
        layers.active!.blendMode = "overlay";
      }else{
        layers.active!.blendMode = "normal";
      }

      PAPER.view.update();
    },
    {
      immediate : true,
    }
  );
  setTimeout( () => {
    isReady.value = true;
    onResize();
  }, 500 );
} );

async function init() {
  await onResize();

  const origin = new paper.Point( 0, 0 );

  layers.parent = new paper.Layer( {
    position : origin,
    visible  : true,
    insert   : true,
    locked   : true,
  } );
  layers.bg =  new paper.Layer( {
    position : origin,
    visible  : false,
    insert   : true,
    locked   : true,
  } );
  layers.fg = new paper.Layer( {
    position : origin,
    visible  : false,
    insert   : true,
    locked   : true,
  } );
  layers.behind = new paper.Layer( {
    position : origin,
    visible  : true,
    insert   : true,
    locked   : true,
  } );
  layers.rasterLines = new paper.Layer( {
    position : origin,
    visible  : true,
    insert   : true,
    locked   : true,
  } );
  layers.raster = new paper.Layer( {
    position : origin,
    visible  : true,
    insert   : true,
    locked   : true,
  } );
  layers.active = new paper.Layer( {
    position : origin,
    visible  : true,
    insert   : true,
    locked   : true,
  } );
  layers.guide = new paper.Layer( {
    position  : origin,
    visible   : true,
    insert    : true,
    locked    : true,
    blendMode : "difference",
    opacity   : 0.5,
  } );
  layers.mirror = new paper.Layer( {
    position  : origin,
    insert    : true,
    locked    : true,
    blendMode : "difference",
    opacity   : 0.5,
  } );
  layers.mirror.bringToFront();


  const mirrorLine = new paper.Path( {
    insert      : false,
    strokeWidth : 1,
    strokeColor : mirrorColor,
    blendMode   : "difference",
    segments    : [
      new paper.Point( PAPER.view.center.x, 0 ),
      new paper.Point( PAPER.view.center.x, PAPER.view.size.height ),
    ],
  } );
  

  mirrorLine.addTo( layers.mirror );
  layers.active.activate();
}

async function initGrid(){
  // return;

  layers.grid = layers.grid || new paper.Layer( {
    visible   : true,
    insert    : true,
    locked    : true,
    blendMode : "difference",
    opacity   : 1,
  } );
  
  const bgImage = "";//"/img/sample1.svg";

  if( bgImage ){
    await new Promise<void>( ( res, rej ) => {
      PAPER.project!.importSVG( `${ bgImage }?t=${ Date.now() }`, {
        onError : ( err ) => {
          console.log( err );
          rej();
        },
        onLoad : ( item: paper.Item ) => {
        // item.remove();
          item.strokeScaling = false;
          item.fitBounds( PAPER.view.bounds );
          item.position.set(
            PAPER.view.size.divide( 2 )
          );
          item.strokeColor = mirrorColor;
          layers.grid?.addChild( item );
          res();
        },
      } );
    } );
  }

  return;
  const center = PAPER.view.center;

  const grid = new paper.Group( {
    insert : false,
  } );


  const size = props.config.size[0];
  const gridSize = 1;
  const N = 10 / gridSize;

  for( let a = 0; a < N; a++ ){
    const rays =  Math.floor( TAO * a / gridSize );
    const wt = highestPowerOf2( a );

    for( let r = 0; r < rays; r++ ){
      const angle = TAO * ( r / rays );


      const pt = new paper.Point(
        Math.sin( angle ),
        Math.cos( angle )
      ).multiply(
        ( a / N ) * 0.5
      );

      new paper.Shape.Circle( {
        position  : center.add( pt.multiply( size ).round() ),
        fillColor : mirrorColor,
        radius    : 3,
        opacity   : 1 * ( 1 / Math.log( 0 + 16 / wt ) ),
      } ).addTo( grid );
    }
  }

  layers.grid.addChild( grid.rasterize( {
    insert : false,
  } ) );
}


function loadSvg( svg: string ){
  console.log( `Load SVG: ${ svg }` );
  layers.active?.removeChildren();
  layers.fg?.removeChildren();
  layers.raster?.removeChildren();
  
  PAPER.project.activate();
  PAPER.project.importSVG( svg, {
    insert : false,
    onLoad( item: paper.Item ){
      console.log( item );
      item.fitBounds( PAPER.view.bounds, false );
      
      const items = ( item.getItems( {
        recursive : true,
      } ) ).sort( ( a, b )=>{
        return a.isAbove( b ) ? 1 : -1;
      } );


      for( let i = 0; i < items.length; i++ ){
        const path = items[i] as PathType;
        

        if(
          !( path instanceof paper.Path || path instanceof paper.CompoundPath )
          || path.parent instanceof paper.CompoundPath
        ){
          continue;
        }

        // path.strokeWidth = props.config.penWidth;
        stateMan.pushState( {
          add : [
            path,
          ],
          remove : [],
        } );
      }
    },
  } ) as paper.Item;
  PAPER.view.update();
}

function removeEvents() {
  tickStop();
  window.removeEventListener( "resize", onResize );
  window.removeEventListener( "pointerup", onPointerUp );
  PAPER.view.element.removeEventListener( "pointerdown", onPointerDown );
  PAPER.view.element.removeEventListener( "pointermove", onDrag );
}

/* Resizer */
async function  onResize( e?:Event ){
  window.scrollTo( 0, 0 );

  if( !wrapper.value ){
    return;
  }

  await nextTick();

  const wrapRect = wrapper.value!.getBoundingClientRect();

  if( !wrapRect ) {
    return;
  }

  canvasRect = canvas.value!.getBoundingClientRect();

  const width =  props.config.size[0];
  const width1 = Math.floor( wrapper.value!.clientWidth / 64 ) * 64;

  PAPER.view.center.set(
    new paper.Point( 0.5, 0 )
  );
  PAPER.view.zoom = ( width1 / width );
  PAPER.view.viewSize.set( width1, width1  );
  PAPER.view.element.style.width = `100%`;
  PAPER.view.element.style.height = `auto`;
  PAPER.view.center.set(
    new paper.Point( width / 2, width / 2 )
  );
  PAPER.view.update();
}

async function exportJSON( o: any = {} ) {
  if( !PAPER?.project ) {
    return;
  }

  const group = new paper.Group( {
    children : [
      ...layers.fg!.getItems( {
        recursive : false,
      } )
      .filter( item=>{
        return ( item.visible );
      } )
      .map( ( item ) => {
        return item.clone();
      } ),
    ],
    insert : false,
  } );
  
  const json = group.exportJSON( {
    bounds    : "view",
    asString  : false,
    precision : 3,
  } ) as unknown as string;

  return json;
}


const exportSVG = async ( withBg = false ) => {
  if( !PAPER?.project ) {
    return;
  }

  const group = new paper.Group( {
    children : [
      ...layers.fg!.getItems( {
        recursive : false,
      } )
      .filter( item=>{
        return ( item.visible ) && !( item.parent instanceof paper.CompoundPath );
      } )
      .map( ( item ) => {
        return item.clone();
      } ),
    ],
    insert : false,
  } );

  const svg = group.exportSVG( {
    bounds : "view",
  } ) as unknown as HTMLElement;

  svg.removeAttribute( "xmlns" );

  const ele = document.createElementNS( "http://www.w3.org/2000/svg", "svg" );

  ele.setAttribute( "xmlns", "http://www.w3.org/2000/svg" );
  ele.setAttribute( "viewBox", `0 0 ${  PAPER.view.size.width  } ${  PAPER.view.size.height }` );
  ele.setAttribute( "version", "1.1" );
  // ele.style.backgroundColor = "#e7e7e7";
  ele.innerHTML = svg.outerHTML;

  return ele.outerHTML;
};

async function clear(){
  stateMan.allPaths.forEach( ( p ) => {
    p.remove();
  } );
  stateMan.deltas = [];
  stateMan.undone = [];
  layers.fg?.removeChildren();
  layers.bg?.removeChildren();
  layers.behind?.removeChildren();
  layers.active?.removeChildren();
  layers.guide?.removeChildren();
  layers.raster?.removeChildren();
  PAPER.view.update();
}


interface Exposed {
  PAPER: typeof PAPER;
  init: typeof init;
  stateMan: ()=>StateManager;
  layers: typeof layers;
  inkUsed: typeof inkUsed;
  clear: typeof clear;
  onResize: typeof onResize;
  exportSVG: typeof exportSVG;
  exportJSON: typeof exportJSON;
  loadSvg: typeof loadSvg;
}

/* Expose */
defineExpose( <Exposed> {
  PAPER,
  stateMan : ()=>stateMan,
  init,
  layers,
  inkUsed,
  clear,
  onResize,
  exportSVG,
  exportJSON,
  loadSvg,
} );



</script>

<template lang="pug">
#wrapper(
  ref="wrapper"
  style="{opacity: isReady?1:0}"
)

</template>

<style lang="scss" scoped>
.log{
  user-select: none;
  pointer-events: none;
  touch-action: none;
}
#wrapper {
  user-select: none !important;
  touch-action: none !important;
  -webkit-user-drag: none !important;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  transform: translateZ(0);
  width: calc( min( 100vh - 5rem, 100vw - 10em  ) )
}

</style>
