
<script lang="ts" setup>

import * as THREE from "three";
// @ts-ignore
import { MeshLine, MeshLineMaterial } from "three.meshline";

// Props
const props = withDefaults( defineProps<{
  value: any;
  width: number;
  height: number;
}>(), {
  width  : 1920,
  height : 1920,
} );


const canvas = ref<HTMLCanvasElement>();
let scene:THREE.Scene;
let camera:THREE.Camera;
let renderer:THREE.WebGLRenderer;
let line:MeshLine;
let mesh: THREE.Mesh;
let points:THREE.Vector3[] = [];
let numPoints = 0;
 
function init() {
  renderer = new THREE.WebGLRenderer( {
    antialias : true,
  } );
  renderer.autoClear = true;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  renderer.setSize(
    props.width,
    props.height
  );
  
  const scene = new THREE.Scene();

  scene.autoUpdate = false;
  scene.background = new THREE.Color( 0xB0B0B0 );

  let isMouseDown = false;
  let rayCaster = new THREE.Raycaster();
  const hitPoint = new THREE.Vector3();
  const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );

  camera.position.set( 6, 6, 12 );
  camera.lookAt( 0, 0, 0 );
  scene.add( new THREE.GridHelper( 10, 20 ) );
  
  /* Plane */
  const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 10, 10 ),
    new THREE.MeshBasicMaterial( {
      color : 0x202020, wireframe : true,
    } )
  );
  
  plane.geometry.applyMatrix4( new THREE.Matrix4()
  .makeRotationFromEuler( new THREE.Euler( Math.PI / 2, Math.PI, 0 ) ) );
  
  /* Geom */
  const geometry = new THREE.BufferGeometry();
  var MAX_POINTS = 1000000;
  var positions = new Float32Array( MAX_POINTS * 3 );

  geometry.setAttribute( "position", new THREE.BufferAttribute( positions, 3 ) );
  
  /* Points */
  const points = new THREE.Points( geometry, material );
  /* Line */
  const line = new MeshLine();

  line.boundingSphere = new THREE.Sphere( new THREE.Vector3( 0, 0, 0 ), 1000 );
  line.setGeometry( geometry );
  line.setPoints( positions );
  scene.add( points );


  var material = new MeshLineMaterial( {
    color : new THREE.Color( 0x000000 ), lineWidth : 1,
  } );

  // material.transparent = true;
  mesh = new THREE.Mesh( line, material );
  // scene.add( mesh );
  renderer.domElement.addEventListener( "mousedown", e => {
    if ( e.button === 0 ) {
      isMouseDown = true;

      const x = ( e.clientX / renderer.domElement.clientWidth ) * 2 - 1;
      const y = -( e.clientY / renderer.domElement.clientHeight ) * 2 + 1;
    
      rayCaster.setFromCamera( {
        x, y,
      }, camera );

      const intersections = rayCaster.intersectObject( plane );
      const positions = points.geometry.getAttribute( "position" ).array as Float32Array;

      if ( intersections?.length ) {
        hitPoint.copy( intersections[0].point );
        geometry.computeVertexNormals();

        const pt = intersections[0].point;

        positions[numPoints++] = pt.x;
        positions[numPoints++] = pt.y;
        positions[numPoints++] = pt.z;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    points.geometry.setDrawRange( 0, numPoints );
  } );
  animate();
}
 
function animate() {
  renderer.render( scene, camera );
  requestAnimationFrame( animate );
}

// Mounted
onMounted( async () => {
  init();
} );
// Unmounted
onBeforeUnmount( async () => {
  // window.removeEventListener( "mousemove", onMouseMove );
  // window.removeEventListener( "mousedown", onMouseDown );
  // window.removeEventListener( "mouseup", onMouseUp );
} );


// function getMousePos( event:MouseEvent ){
//   return [
//     -rect.width * 0.5 + ( event.offsetX - rect.left ),
//     -rect.height * 0.5 + ( rect.height - event.offsetY - rect.top ),
//     0,
//   ] as [number, number, number] ;
// }

// function addPoint( pos: [number, number, number] ) {
//   points.value.push( ...pos );
// }

// function onMouseDown( e:MouseEvent ){
//   // console.log( e );
//   window.addEventListener( "mousemove", onMouseMove, false );
// }

// function onMouseMove( e:MouseEvent ){
//   // console.log( e );
  
//   addPoint( getMousePos( e ) );
// }

// function onMouseUp( e:MouseEvent ){
//   // console.log( e );
//   points.value = [];
//   window.removeEventListener( "mousemove", onMouseMove );
// }

</script>
<template lang="pug">

canvas(
  :width="props.width"
  :height="props.height"
  ref="canvas"
)

</template>
<style lang="scss" scoped>

</style>
