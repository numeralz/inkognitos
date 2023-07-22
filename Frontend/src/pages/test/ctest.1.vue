<script lang="ts" setup>

import * as THREE from "three";
import {  Scene, WebGLRenderer, Vector3, PerspectiveCamera, Mesh, CatmullRomCurve3, Shape, ExtrudeBufferGeometry, OrthographicCamera, GridHelper } from "three";
// import { Line2 } from "three/examples/jsm/lines/Line2";
// import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
// import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
// import { GeometryUtils } from "three/examples/jsm/utils/GeometryUtils";

// import { MeshLine, MeshLineMaterial } from "three.meshline";
// import { MeshLine, MeshLineMaterial } from "threejs-meshline";


// Props
const props = withDefaults( defineProps<{
  value: any;
}>(), {} );

// Data
const isLoading = ref( false );

// Mounted
onMounted( async () => {
  init();
  animate();
  window.onresize = resizeCanvasToDisplaySize;
} );

// Events
const emit = defineEmits<{
  ( event: "update:value", val: any ): void;
}>();

let renderer:WebGLRenderer;
let scene:Scene;
let camera: OrthographicCamera;
let count = 0;
let mouse = new THREE.Vector3();
let positions: THREE.Vector3[] = [];
let line: Mesh;
var MAX_POINTS = 500;
let rect: DOMRect;
let shape2:Shape;
let grid2: GridHelper;

function init() {
  const pts2:THREE.Vector2[] = [], numPts = 3;

  for ( let i = 0; i < numPts * 2; i ++ ) {
    // const l = i % 2 === 1 ? 10 : 20;
    const a = i / numPts * Math.PI;


    pts2.push( new THREE.Vector2( Math.cos( a ) * 0.2, Math.sin( a ) * 0.2 ) );
  }

  shape2 = new THREE.Shape( pts2 );
  renderer = new THREE.WebGLRenderer( {
    preserveDrawingBuffer : false,
  } );
  renderer.setClearColor( 0x555555, 1 );
  renderer.setSize( 1920, 1920 );
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "auto";
  rendererWrapper.value!.appendChild( renderer.domElement );
  rect = rendererWrapper.value!.getBoundingClientRect();
  scene = new THREE.Scene();

  const grid = new THREE.GridHelper( 1920, 10 );

  grid.position.x = 0;
  grid.position.y = 0;
  grid.position.z = 0;
  grid.rotation.x = Math.PI / 2;
  scene.add( grid );
  grid2 = new THREE.GridHelper( 1920, 10 );
  grid2.position.x = 0;
  grid2.position.y = 0;
  grid2.position.z = 0;
  grid2.rotation.x = Math.PI / 2;
  scene.add( grid2 );

  // camera = new THREE.PerspectiveCamera(
  //   45, (
  //     1
  //   ), 1,
  //   1920
  // );
  const width = 100;
  const height = 100;

  camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -1000, 1000 );
  // camera.position.set( 0, 0, 10 );
  // startLine();
  document.addEventListener( "mousemove", onMouseMove, false );
  document.addEventListener( "mousedown", onMouseDown, false );
  document.addEventListener( "mouseup", onMouseUp, false );
}

const mousePoints: THREE.Vector3[] = [];

function resizeCanvasToDisplaySize() {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // adjust displayBuffer size to match
  if ( canvas.width !== width || canvas.height !== height ) {
    // you must pass false here or three.js sadly fights the browser
    renderer.setSize( width, height, false );
    camera.updateProjectionMatrix();

    // update any render target sizes here
  }
}



// update line
function updateLine() {
  // if( lineSpline.points ){
  //   lineSpline.points = positions;
  // }

  // line.geometry.setFromPoints( positions );
  // line.geometry.setDrawRange( 0, count );
  

  if( line?.geometry ) {
    // lineSpline = new THREE.CatmullRomCurve3( positions );
    // line.geometry.attributes.extrudePath.needsUpdate = true;
    // console.log( line.geometry );
    // line.geometry.attributes.position.updateRange.start = 0;
    // line.geometry.attributes.position.updateRange.count = positions.length;
    // line.geometry.attributes.position.needsUpdate = true;
    lineSpline = new THREE.CatmullRomCurve3( positions );

    const geometry2 = new THREE.ExtrudeBufferGeometry( shape2, {
      steps        : Math.floor( positions.length / 2 ),
      bevelEnabled : false,
      extrudePath  : lineSpline,
    } );

    line.geometry = geometry2;
  }
}

let lineSpline:CatmullRomCurve3;

function startLine(){
  // positions = positions.slice( -4, -1 );

  if( positions.length < 3 ){
    return;
  }

  lineSpline = new THREE.CatmullRomCurve3( positions );

  const geometry2 = new THREE.ExtrudeBufferGeometry( shape2, {
    steps        : 2,
    bevelEnabled : false,
    extrudePath  : lineSpline,
  } );

  const material2 = new THREE.MeshLambertMaterial( {
    color     : 0xff8000,
    wireframe : false,
  } );

  line = new THREE.Mesh( geometry2, material2 );
  scene.add( line );

  return line;
}



// mouse move handler
function onMouseMove( event:MouseEvent ) {
  if( !mouseIsDown.value ){
    return;
  }

  const mouse1 = new THREE.Vector3(
    1 * ( ( event.clientX - rect.left ) / rect.width - 0.5  ),
    1 * -( ( event.clientY - rect.top ) / rect.height - 0.5 ),
    0
  );
  
  const p = new Vector3(
    mouse1.x * 100,
    mouse1.y * 100,
    mouse1.z * 100
  );

  // console.log( positions.length );
  
  if( mouse1.distanceTo( mouse ) > 0.001 ) {
    mouse = mouse1;
    positions.push( p );
    
    if( positions.length >= MAX_POINTS ) {
      return;
    }

  
    if( positions.length === 3 ){
      startLine();
    }

    if( positions.length >= 3 ){
      updateLine();
    }
  }
}


const mouseIsDown = ref( false );
const lastMouseEvent = ref<MouseEvent>();

// mouse down handler
function onMouseDown( evt:MouseEvent ) {
  lastMouseEvent.value = evt;
  mouseIsDown.value = true;
  positions = [];
}

function onMouseUp( evt:MouseEvent ) {
  lastMouseEvent.value = evt;
  mouseIsDown.value = false;
}

function updateScene(){
  if( !mouseIsDown.value ){
    camera.position.set( 0, 0, 0 );
    camera.rotation.y += 0.01;
  }
}

// render
function render() {
  updateScene();
  renderer.render( scene, camera );
}

// animate
function animate() {
  requestAnimationFrame( animate );
  render();
}


// Expose
defineExpose( {} );

const rendererWrapper = ref<HTMLDivElement>();
</script>
<template lang="pug">

div(
  ref="rendererWrapper"
)


</template>
<style lang="scss" scoped>
canvas{
  width: 100%
}
</style>
