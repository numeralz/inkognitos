<script lang="ts" setup>

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

function initCanvas() {
  render();
  window.addEventListener( "mousedown", onMouseDown, false );
  window.addEventListener( "mouseup", onMouseUp, false );
}

const points = ref<number[]>( [] );

// Mounted
onMounted( async () => {
  // 
  initCanvas();
} );
// Unmounted
onBeforeUnmount( async () => {
  window.removeEventListener( "mousemove", onMouseMove );
  window.removeEventListener( "mousedown", onMouseDown );
  window.removeEventListener( "mouseup", onMouseUp );
} );

let rect: DOMRect;

function render(){
  if( !canvas.value ){
    return;
  }

  rect = canvas.value.getBoundingClientRect();

  var gl = canvas.value.getContext(
    "webgl",
    {
      antialias : true,
    }
  );

  if( !gl ) {
    return;
  }

  var vertex_buffer = gl.createBuffer();

  gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
  // Pass the vertex data to the buffer
  gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( points.value ), gl.STATIC_DRAW );
  // Unbind the buffer
  gl.bindBuffer( gl.ARRAY_BUFFER, null );/*=================== Shaders ====================*/

  // Vertex shader source code
  var vertCode =
            "attribute vec3 coordinates;" +
            "void main(void) {" +
               " gl_Position = vec4(coordinates, 2.0);" +
            "}";
  // Create a vertex shader object
  var vertShader = gl.createShader( gl.VERTEX_SHADER );

  if( !vertShader ){
    return;
  }

  // Attach vertex shader source code
  gl.shaderSource( vertShader, vertCode );
  // Compile the vertex shader
  gl.compileShader( vertShader );

  // Fragment shader source code
  var fragCode =
            "void main(void) {" +
               "gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);" +
            "}";
  // Create fragment shader object
  var fragShader = gl.createShader( gl.FRAGMENT_SHADER );

  if( !fragShader ){
    return;
  }

  // Attach fragment shader source code
  gl.shaderSource( fragShader, fragCode );
  // Compile the fragmentt shader
  gl.compileShader( fragShader );

  // Create a shader program object to store
  // the combined shader program
  var shaderProgram = gl.createProgram();

  if( !shaderProgram ){
    return;
  }

  // Attach a vertex shader
  gl.attachShader( shaderProgram, vertShader );
  // Attach a fragment shader
  gl.attachShader( shaderProgram, fragShader );
  // Link both the programs
  gl.linkProgram( shaderProgram );
  // Use the combined shader program object
  gl.useProgram( shaderProgram );

  /*======= Associating shaders to buffer objects ======*/

  // Bind vertex buffer object
  gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );

  // Get the attribute location
  var coord = gl.getAttribLocation( shaderProgram, "coordinates" );

  // Point an attribute to the currently bound VBO
  gl.vertexAttribPointer( coord, 3, gl.FLOAT, false, 0, 0 );
  // Enable the attribute
  gl.enableVertexAttribArray( coord );

  /*============ Drawing the triangle =============*/

  // Clear the canvas
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
  // gl.clear( gl.COLOR_BUFFER_BIT );
  // Enable the depth test
  // gl.enable( gl.DEPTH_TEST );
  // Clear the color and depth buffer
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  // Set the view port
  gl.viewport( 0, 0, canvas.value.width, canvas.value.height );
  // Draw the triangle
  gl.drawArrays( gl.LINE_STRIP, 0, points.value.length );
}


function getMousePos( event:MouseEvent ){
  return [
    -rect.width * 0.5 + ( event.offsetX - rect.left ),
    -rect.height * 0.5 + ( rect.height - event.offsetY - rect.top ),
    0,
  ] as [number, number, number] ;
}

function addPoint( pos: [number, number, number] ) {
  points.value.push( ...pos );
}

function onMouseDown( e:MouseEvent ){
  // console.log( e );
  window.addEventListener( "mousemove", onMouseMove, false );
}

function onMouseMove( e:MouseEvent ){
  // console.log( e );
  
  addPoint( getMousePos( e ) );
  render();
}

function onMouseUp( e:MouseEvent ){
  // console.log( e );
  points.value = [];
  window.removeEventListener( "mousemove", onMouseMove );
}

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