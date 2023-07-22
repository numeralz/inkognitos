<script lang="ts" setup>
import type WhiteboardVue from "$/components/Whiteboard.vue";
import { TAO } from "$/lib/utils";
import { getCNC, getMirrorPoint, StateManager } from "$/lib/Whiteboard";
import type { InputPath, PathExtended, Tool } from "$/lib/Whiteboard";
import type { InkToken } from "$/store/session";
import concaveman from "concaveman";
import * as paper from "paper";
import { PaperOffset } from "paperjs-offset";
import { reactive, ref } from "vue";

let strokeGuide: paper.Path;
let pathGuide: paper.Path;
const canvasRes = 1024;
const hideTemplate = ref( false );
const useMirror = ref( true );
const onlyPen = ref( false );
const whiteboard = ref<typeof WhiteboardVue>();
let colorBlack: paper.Color|null = null;
let colorWhite: paper.Color|null = null;
let colorGuide: paper.Color|null = null;
const GRID_SNAP = 8;
const penWidthLog2 = ref( 2 );
const penWidth = ref( 0 );
let brushWidth = 8;
const TOOLS: Record<string, Tool> = {};
let path2: InputPath;
let joinPreview: paper.Path;
let mouseVel:paper.Point;
let timeLastMove = Date.now();
let pos0: paper.Point;
let ray: paper.Path;

const activeColor = reactive<Record<string, string | null>>( {
  fill : null,
} );

const currentColorTarget = ref<"fill" | "stroke" | "">( "" );
const showInk = ref<boolean>( false );

const guideStyle = {
  strokeColor : colorGuide,
  strokeWidth : Math.ceil( penWidth.value ),
  opacity     : 0.5,
  strokeCap   : "round",
  strokeJoin  : "round",
};



defineExpose( {
  w : whiteboard,
} );


const strokeFillMode = reactive<{
  stroke: boolean,
  fill: boolean,
}>( {
  stroke : true,
  fill   : true,
} );

function setStrokeFill( stroke: boolean|null, fill: boolean|null ) {
  if( typeof stroke === "boolean" ) {
    strokeFillMode.stroke = stroke;
  }

  if( typeof fill === "boolean" ) {
    strokeFillMode.fill = fill;
  }
}


function onEnd( path: InputPath, stateMan ){
  // if( currentTool.value.name !== "eraser" && path.hasStroke() ){
  //   const path2 = PaperOffset.offsetStroke( path, path.strokeWidth / 2, {
  //     insert : false,
  //   } );

  //   path2.fillColor = path.strokeColor;
  //   path2.strokeWidth = 0;
  //   // if ( useMirror.value ) {
  //   //   stateMan.updateMirror( path2 );
  //   //   path2 = stateMan.mergeMirror( path2 );
  //   // }
  //   path = PaperOffset.offset( path, -path.strokeWidth / 2, {
  //     insert : false,
  //   } ) as InputPath;
  //   path.strokeWidth = 0;
  //   onEnd( path2, stateMan );
  // }

  // path.smooth();
  // path.flatten( 32 );
  // StateManager.arcPath( path, 128 );
    
  if ( useMirror.value ) {
    StateManager.updateMirror( path );
    path = StateManager.mergeMirror( path );
  }

  let paths = [
    path, path._mirror,
  ].filter( Boolean ).forEach( ( path1 ) => {
    let path = path1!;

    path.closePath();

    if( ( strokeFillMode.fill && path.hasFill() ) && !path.closed ){
      path.closePath();

      if( path.fillColor ) {
        path.fillColor.alpha = 1;
      }
    }
    
    path.strokeWidth = 0;
    path.closePath();

    let add:any[] = [];
    let remove:any[] = [];


    if( currentTool.value.name !== "eraser" ){
      if( !stateMan.paths.length ){
        stateMan.pushState( {
          add : [
            path,
          ],
        } );

        return;
      }

      stateMan.pushState( {
        add : [
          path,
        ],
        remove,
      } );
    }else{
      stateMan.paths.forEach( (  pp ) => {
        remove.push( pp );

        const pp2 = pp.subtract( path, {
          insert : false,
          trace  : true,
        } );

        add.push( pp2 );
        pp.replaceWith( pp2 );
      } );
      stateMan.pushState( {
        add,
        remove,
      } );
    }
  } );
}

function initPathColor( path: InputPath ) {
  path.strokeCap = "none";
  path.strokeJoin = "miter";
  path.miterLimit = penWidth.value * 0.5;

  /* Stroke */
  if ( strokeFillMode.stroke ) {
    path.strokeWidth = penWidth.value;
    path.strokeColor = colorBlack;
  } else {
    path.strokeWidth = 0;
    path.strokeColor = null;
  }

  path.strokeWidth = 0;

  /* Fill */
  if ( strokeFillMode.fill && activeColor.fill ) {
    path.fillColor = new paper.Color( activeColor.fill );
    // path.fillRule = "nonzero";
    // path.blendMode = "multiply";

    /* Fill Only */
    if ( !strokeFillMode.stroke ) {
      path.selected = true;
      path.selectedColor = colorBlack;
    }
  } else {
    path.fillColor = null;
  }
}

function trimPath( path:paper.Path ){
  if( path.curves.length < 4 ){
    return;
  }

  let [
    s1, s2,
  ] = path.segments.slice( -2 );
  

  const lastCurve = s2.point.subtract(
    s1.point
  );

  if( path.segments.length > 3 &&
    lastCurve.length < brushWidth &&
    ( lastCurve.dot(
      s1.location.normal
    ) * path.lastCurve.length ) < ( penWidth.value * 0.5 ) ){
    s2.remove();
  }

  {
    let [
      s2, s1,
    ] = path.segments;

    const lastCurve = s2.point.subtract(
      s1.point
    );

    if( path.segments.length > 3 &&
      lastCurve.length < brushWidth &&
      ( lastCurve.dot(
        s1.location.normal
      ) * path.lastCurve.length ) < ( penWidth.value * 0.5 ) ){
      s2.remove();
    }
  }
}



const smoothPath = ( path:PathExtended<paper.Path>, factor = 0.25 )=>{
  const [
    c1, c2,
  ] = path.curves.slice( -2 );

  if( !c2 ){
    return;
  }

  // const t1 = c1.getTangentAtTime( 0.5 );
  // const t2 = c2.getTangentAtTime( 0.5 );

  // if( t1.quadrant > 1 ){
  //   t1.set( t1.multiply( -1 ) );
  // }

  // if( t2.quadrant > 1 ){
  //   t2.set( t2.multiply( -1 ) );
  // }

  // const ang = Math.abs( t2.getDirectedAngle( t1 ) / 180 );

  // path.simplify( 0.0001 );
  // if( ang < 0.5  ){
  path.smooth( {
    factor,
    type : "geometric",
    from : -Math.min( 8, path.segments.length - 1 ),
    to   : -1,
  } );
  // }else{
  //   c1.segment2.clearHandles();
  // }
};

/*
-------------------------------------
#brushtool
-------------------------------------
*/
const brush: Tool = {
  name : "brush",
  icon : "fa-brush rotate-45",
  onStart( path: InputPath, stateMan, pos ) {
    path.fillColor = null;
    path2 = new paper.Path( {
      insert   : false,
      segments : [
        pos,
        pos,
      ],
    } ) as PathExtended<paper.Path>;
    path2.insertAbove( path );
    initPathColor( path2 );
    path.visible = false;


    if( useMirror.value ){
      StateManager.updateMirror( path2 );
    }

    if( !strokeFillMode.stroke ){
      path2.selected = true;
      path2.selectedColor = colorBlack;
    }
    
    mouseVel.set( 0, 0 );
  },
  onMove( path:PathExtended<paper.Path>, stateMan, pos ) {
    mouseVel.set(
      mouseVel.multiply( 0.1 ).add(
        pos.subtract(
          path?.lastSegment?.point
        ).multiply( 0.9 )
      )
    );
    path.lastSegment?.point.set(
      pos
    );
  },
  onDraw( path:PathExtended<paper.Path>, stateMan, pos, context ) {
    if( path.length && path.lastCurve?.length < 8 ){
      return;
    }

    path.add( pos );
    path.smooth();

    const angle = mouseVel.angle - 90;

    const normal = new paper.Point(
      Math.cos( TAO * ( angle ) / 360 ),
      Math.sin( TAO * ( angle ) / 360 )
    ).multiply( brushWidth * 1 );

    const mid = path.curves.at( -1 )!.getPointAtTime( 0 );
    // 
    const top = mid.add( normal );
    const bot = mid.subtract( normal );
    // 
    const a = path2.add( top );
    const b = path2.insert( 0, bot );


    if( useMirror.value ){
      const a2 = getMirrorPoint( top, path.project );
      const b2 = getMirrorPoint( bot, path.project );

      path2._mirror?.add( a2 );
      path2._mirror?.insert( 0, b2 );
    }
  },

  onEnd( path: InputPath, stateMan, pos, context ) {
    // path.remove();
    // path._mirror?.remove();
    // path2.remove();
    // path2._mirror?.remove();
    path?.remove();
    path?._mirror?.remove();
    path2.add( pos );
    path2.closePath();
    path2?.remove();
    path2?._mirror?.remove();
    path = path2;
    // StateManager.reducePath( path, 4 );
    // StateManager.roundPath( path, 1 );
    
    if ( useMirror.value ) {
      path._mirror = StateManager.updateMirror( path );
      path = StateManager.mergeMirror( path ) || path;
    }

    path = PaperOffset.offset( path, 0.1, {
      insert : false,
    } ) as PathExtended<paper.Path>;
    onEnd( path, stateMan );

    

    // const fanAmount = 0.3;

    // if( handMode ){
    //   path.add(
    //     new paper.Segment(
    //       wrist.add(
    //         handNormal.normalize( -brushWidth * 0.5  )
    //       )
    //     )
    //   );
      
    //   for( let i = 0; i < 5; i++ ){
    //     const angle1 = outAngle + ( fanAmount * 180 ) * ( ( ( i - 0.5 ) / 5 ) - 0.5 );
    //     const angle2 = outAngle + ( fanAmount * 180 ) * ( ( ( i ) / 5 ) - 0.5 );
    //     const fingerSize = outSize * ( 1 + 0.7 * Math.sin( Math.PI * 0.75 * (  ( i / 4 ) ) ) );
      
    //     path.insertSegments( path.segments.length, [

    //       new paper.Segment(
    //         wrist.add(
    //           new paper.Point(
    //             Math.cos( angle1 * TAO / 360 ) * fingerSize * 0.7,
    //             Math.sin( angle1 * TAO / 360 ) * fingerSize * 0.7
    //           )
    //         )
    //         // handNormal.normalize( -4 ),
    //         // handNormal.normalize( 4 )
    //       ),
    //       new paper.Segment(
    //         wrist.add(
    //           new paper.Point(
    //             Math.cos( angle2 * TAO / 360 ) * fingerSize,
    //             Math.sin( angle2 * TAO / 360 ) * fingerSize
    //           )
    //         ),
    //         handNormal.normalize( -4 ),
    //         handNormal.normalize( 4 )
    //       ),
    //     ] );
    //   }

    //   // path.add(
    //   //   new paper.Segment(
    //   //     wrist.add(
    //   //       handNormal.normalize( brushWidth * 0.7 )
    //   //     )
    //   //   )
    //   // );
    // }
    


    // let p1!:PathExtended<any>;
    // let p2!:PathExtended<any>;

    // try {
    //   path.reorient( true, true );

    //   const width = strokeFillMode.stroke ? ( brushWidth * 0.5 ) : ( penWidth * 0.5 );

    //   p1 = PaperOffset.offsetStroke( path, width, {
    //     join : "miter",
    //     cap  : "butt",
    //   } );

    //   if( p1 ){
    //     p2 = PaperOffset.offset( path2!, 0, {
    //       join   : "miter",
    //       cap    : "butt",
    //       insert : false,
    //     } );
    //     p1?.remove();
    //   }
    // } catch ( err: any ) {
    //   console.log( err );
    // }

    // path.remove();
    // path._mirror?.remove();


    // try {
    //   initPathColor( p2! );

    //   if( !strokeFillMode.stroke ){
    //     p2.strokeColor = null;
    //   }

    //   if ( path._mirror ) {
    //     p2._mirror = stateMan.updateMirror( p2! );
    //     p2 = stateMan.mergeMirror( p2! ) || p2;
    //   }

    //   const baseArea = Math.abs( path.area * 0.25 );

    //   if( p2.children?.length ){
    //     p2.children.forEach( ( child:paper.Path ) => {
    //       if( Math.abs( child.area ) < baseArea ){
    //         child.remove();
    //       }
    //     } );
    //   }

    //   stateMan.pushState( {
    //     add : [
    //       p2!, p2?._mirror || null,
    //     ],
    //     remove : [],
    //   } );
    // } catch ( err ) {
    //   console.log( err );
    // }
  },
};

function snapPath( path:paper.Path, stateMan ){
  if( !path.closed ){
    const [
      p0, p1,
    ] = [
      path.firstSegment, path.lastSegment,
    ].filter( Boolean ).map( ( segment ) => {
      const basePt = segment.point;
      let nearestLoc: paper.CurveLocation;
      let dist0 = penWidth.value;
      
      stateMan.paths.forEach( ( pp:paper.Path ) => {
        if( pp === path ){
          return;
        }
      
        const nearest = pp.getNearestLocation( basePt );

        if( !nearest ) {
          return ;
        }

        const dist1 = nearest.point.getDistance( basePt );
    
        if(
          dist1 < dist0
        ){
          nearestLoc = nearest;
          dist0 = dist1;
        }
      } );

      if( nearestLoc! ){
        segment.point.set(
          nearestLoc.point
        );
      }

      return nearestLoc!;
    } ).filter( Boolean )

    // .forEach( ( p ) => {
    //   if( p.path ){
    //     path.remove();
    //     path = path.subtract( p.path, {
    //       insert : true,
    //       trace  : true,
    //     } );
    //   }
    // } );

    .sort( ( a, b )=>{
      const _a = a.offset;
      const _b = b.offset;
      return _a < _b ? -1 : ( _a > _b ? 1 : 0 );
    } );


    if( p0 && p1 ){
      if( p0.path === p1.path ){
        let seg1 = p0.path.clone( {
          insert : false,
        } );
        const len = p0.path.length;

        seg1 = seg1.splitAt( p0.offset );
        seg1.splitAt( p1.offset - p0.offset );

        // seg1.strokeColor = new paper.Color( 0, 0, 1, 0.5 );
        // seg1.insertAbove( path );
        if( p0.path.closed ){
          let seg2 = p0.path.clone( {
            insert : false,
          } );

          seg2 = seg2.splitAt( p0.offset ).splitAt( p1.offset - p0.offset );

          // seg2.strokeColor = new paper.Color( 1, 0, 0, 0.5 );
          // seg2.insertAbove( path );
          const shortest = seg2.length < seg1.length ? seg2 : seg1;

          path.join( shortest, 1 );

          return path;
        }

        path.join( seg1, 1 );

        return path;
      }
    }
  }

  return path;
}

function COLOR( color: string | paper.Color | null ) {
  if ( !color ) {
    return null;
  }

  if ( color instanceof paper.Color ) {
    return color;
  }

  const val = new paper.Color( color );

  val.alpha = 1;

  return val;
}

/*
-------------------------------------
#penciltool
-------------------------------------
*/
const pencil: Tool = {
  name : "pencil",
  icon : "fa-pencil rotate-180",
  onStart( path: InputPath, stateMan, pos, context ) {
    initPathColor( path );
    path.fillColor = null;

    if( activeColor.fill ) {
      path.strokeColor = COLOR( activeColor.fill );
    }

    path.strokeWidth = brushWidth;
    mouseVel.set( 0, 0 );
    timeLastMove = Date.now();
  },
  onMove( path:PathExtended<paper.Path>, stateMan, pos, context ) {
    mouseVel.set(
      mouseVel.multiply( 0.1 ).add(
        pos.subtract(
          path?.lastSegment?.point
        ).normalize( 0.9 )
      )
    );
    path?.lastSegment?.point.set( pos );

    
    if( path._mirror && path?.lastSegment ){
      const pos_ = getMirrorPoint( path?.lastSegment.point, path.project );

      path._mirror?.lastSegment.point.set( pos_ );
    }
  },
  onDraw( path:PathExtended<paper.Path>, stateMan, pos, context ) {
    if( path.segments.length < 3 ){
      path.add( pos );

      if( path._mirror ){
        path._mirror.add( getMirrorPoint( pos, path.project ) );
      }

      return;
    }

    path?.add( pos );

    if( path._mirror ){
      const pos_ = getMirrorPoint( path.lastSegment.point, path.project );

      path._mirror.lastSegment.point.set( pos_ );
      path._mirror.add( pos_ );
    }
  },
  onEnd( path: InputPath, stateMan, pos, context ) {
    path.remove();
    path._mirror?.remove();
    StateManager.roundPath( path, 0.5 );
    path = PaperOffset.offsetStroke( path, brushWidth / 2, {
      insert : false,
      limit  : penWidth.value * 0.5,
      join   : "bevel",
      cap    : "round",
    } );
    path.strokeWidth = 0;
    onEnd( path, stateMan );
  },
};


function longPoint( path, pos ){
  const delay = Date.now() - timeLastMove;


  if( delay > 250 ){
    // @ts-ignore-next
    path.lastSegment.point._keep = true;
    path.add( path?.lastSegment?.point );
  }

  timeLastMove = Date.now();
}

const keyPoints: paper.Point[] = [];

/*
-------------------------------------
#pentool
-------------------------------------
*/
const pen: Tool = {
  name : "pen",
  icon : "fa-pen-fancy rotate-180",
  onStart( path: InputPath, stateMan, pos ) {
    initPathColor( path );
    path.fillColor = null;

    if( activeColor.fill ) {
      path.strokeColor = COLOR( activeColor.fill );
    }

    path.strokeWidth = brushWidth;
    mouseVel.set( 0, 0 );
    timeLastMove = Date.now();
  },
  onMove( path:PathExtended<paper.Path>, stateMan, pos, context ) {
    mouseVel.set(
      mouseVel.multiply( 0.2 ).add(
        pos.subtract(
          path?.lastSegment?.point
        ).multiply( 0.8 )
      )
    );
    path?.lastSegment?.point.set( pos );

    if( path._mirror && path?.lastSegment ){
      const pos_ = getMirrorPoint( path?.lastSegment.point, path.project );

      path._mirror?.lastSegment.point.set( pos_ );
    }
  },
  onDraw( path:PathExtended<paper.Path>, stateMan, pos ) {
    if( path.segments.length < 3 ){
      path.add( pos );

      if( path._mirror ){
        path._mirror.add( getMirrorPoint( pos, path.project ) );
      }

      return;
    }

    path.add( pos );

    if ( path._mirror ) {
      const pos_ = getMirrorPoint( path.lastSegment.point, path.project );

      path._mirror.lastSegment.point.set  ( pos_ );
      path._mirror.add( pos_ );
    }

    return true;
  },
  onEnd( path: InputPath, stateMan, pos ) {
    path.remove();
    path._mirror?.remove();
    StateManager.roundPath( path );
    path = PaperOffset.offsetStroke( path, brushWidth / 2, {
      insert : false,
      join   : "bevel",
      cap    : "round",
    } );
    path.strokeWidth = 0;
    onEnd( path, stateMan );
  },
};


/* PAINT TOOL */
/*
-------------------------------------
#rollertool
-------------------------------------
*/

const roller: Tool = {
  name : "roller",
  icon : "fa-paint-roller rotate-45",
  onStart( path: InputPath, stateMan, pos ) {
    initPathColor( path );
    path.closed = true;

    if( !ray ){
      ray = new paper.Path( {
        insert      : false,
        strokeColor : new paper.Color( "#F00" ),
        strokeWidth : 2,
        opacity     : 1,
        segments    : [
          pos,
          pos,
        ],
      } );
    }

    if( !strokeGuide ){
      strokeGuide = new paper.Path( {
        strokeWidth : 1,
        strokeColor : "#000000",
        visible     : false,
      } );
    }

    strokeGuide.removeSegments();
    strokeGuide.insertAbove( path );
    strokeGuide.add( pos );

    if(  !pathGuide ){
      pathGuide = new paper.Path( {
        strokeWidth : 1,
        strokeColor : "#000000",
        visible     : false,
      } );
    }

    if( !path.hasStroke() && path.hasFill() ){
      // path.fillColor.alpha = 0.5;
    }
    
    if (  !path.hasFill() ) {
      path.selected = true;
      path.selectedColor = colorBlack;
    }

    pathGuide.removeSegments();
    pathGuide.add( pos );
    pathGuide.insertAbove( path );
    pos0.set( pos );
  },
  onMove( path:PathExtended<paper.Path>, stateMan, pos ) {
    mouseVel.set(
      mouseVel.multiply( 0.1 ).add(
        pos.subtract(
          path?.lastSegment?.point
        ).multiply( 0.9 )
      )
    );
    strokeGuide.lastSegment?.point.set(
      pos
    );
  },
  onDraw( path:PathExtended<paper.Path>, stateMan, pos, press ) {
    if( pathGuide.segments.length < 3 ){
      pathGuide.add( pos );

      return;
    }

    const s1 = pathGuide.lastSegment.previous;
    const step = Math.max( 6, penWidth.value );

    if( s1.point.getDistance( pos ) < step ){
      return;
    }

    if( strokeGuide.hitTest( pos, {
      curves    : true,
      fill      : true,
      tolerance : step,
    } ) ){
      return;
    }

    const p = pos;
    // const nor = pathGuide.getNormalAt( pathGuide.length );
    const angle = mouseVel.angle - 90;
    
    const nor = new paper.Point(
      Math.cos( TAO * ( angle ) / 360 ),
      Math.sin( TAO * ( angle ) / 360 )
    ).multiply( brushWidth * 1 );


    strokeGuide.add( p.add( nor ) );
    strokeGuide.add( p.subtract( nor ) );
    strokeGuide.add( pos );
    pathGuide.add( pos );

    const points = concaveman( strokeGuide.segments.map( ( {
      point: {
        x, y,
      },
    } ) => [
      x, y,
    ] ), 1, 64 );


    path.segments = points.map( ( [
      x, y,
    ], i ) => {
      const seg = new paper.Segment( new paper.Point( x, y ) );
      const seg_ = new paper.Segment( getMirrorPoint( seg.point, path.project ).clone() );

      if ( path._mirror ) {
        path._mirror.segments![i] = seg_;
      }

      return seg;
    } );

    if( strokeGuide.segments.length > 4 ){
      StateManager.reducePath( strokeGuide, 2 );
    }
  },
  onEnd( path: InputPath, stateMan ) {
    path.remove();
    path._mirror?.remove();
    StateManager.reducePath( path );
    StateManager.arcPath( path, 8 );
    onEnd( path, stateMan );
  },
};



const eraserHitConfig = {
  tolerance : 1,
  fill      : true,
  stroke    : true,
};

let eraserTimeout = 0;

// #erasertool
const eraser: Tool = {
  ...roller,
  name : "eraser",
  icon : "fa-eraser",
  onStart( path: InputPath, stateMan, pos ) {
    roller.onStart( path, stateMan, pos );
    path.strokeWidth = 1;
    // path.dashArray = [
    //   2, 2,
    // ];
    path.strokeColor = COLOR( "red" );
    path.fillColor = null;
  },
  onEnd( path, stateMan, pos ){
    strokeGuide.remove();

    // roller.onEnd( path, stateMan, pos );
    if ( useMirror.value ) {
      path.remove();
      StateManager.updateMirror( path );
      path = StateManager.mergeMirror( path );
      // path._mirror = null;
    }

    path.strokeColor = null;
    path.fillColor = null;
    path.remove();
    onEnd( path, stateMan );
  },
};

// const eraser: Tool = {
//   name : "eraser",
//   icon : "",
//   onStart( path: InputPath, stateMan, pos ) {
//     const p = path;

//     p.strokeWidth = 10;
//     p.strokeJoin = "round";
//     p.dashArray = [
//       2, 2,
//     ];
//     p.strokeColor = colorWhite;
//     // path.remove();
//     path.add( pos );
//     eraserTimeout = Date.now() - 1;
//     // if( path._mirror ){
//     //   path._mirror.visible = false;
//     // }
//     stateMan.paths.reverse().some( ( p ) => {
//       let item = p.hitTest( pos, eraserHitConfig ) ? p : null;

//       if ( !item ) {
//         return false;
//       }

//       if ( item.parent instanceof paper.CompoundPath ) {
//         item.parent?.reorient( true, true );

//         const old = item.parent.clone( {
//           deep   : true,
//           insert : false,
//         } );

//         old.insertBelow( item.parent );
//         old.visible = false;
//         item.remove();
//         stateMan.pushState( {
//           add : [
//             item.parent,
//           ],
//           remove : [
//             old,
//           ],
//         } );

//         return true;
//       }

//       eraserTimeout = Date.now() + 100;
//       stateMan.pushState( {
//         add    : [],
//         remove : [
//           item,
//         ],
//       } );

//       return true;
//     } );
//   },
//   onDraw( path:PathExtended<paper.Path>, stateMan, pos ) {
//     path.add( pos );
//     stateMan.onlyPaths.forEach( ( item ) => {
//       if( !path.intersects( item ) ){
//         return;
//       }
      
//       stateMan.pushState( {
//         add    : [],
//         remove : [
//           item,
//         ],
//       } );
//     } );
//     path.segments = path.segments.slice( -8 );
//   },
//   onEnd( path: InputPath, stateMan ) {
//     path.remove();
//     path._mirror?.remove();
//   },
// };

/* #guidetool */
const guide: Tool = {
  name : "guide",
  icon : "",
  onStart( path: InputPath, stateMan ) {
    Object.assign( path, guideStyle );

    if ( path._mirror ) {
      StateManager.updateMirror( path );
    }
  },
  onDraw( path:PathExtended<paper.Path>, stateMan, pos, context ) {
    if( path.segments.length < 3 ){
      path.add( pos );

      if( path._mirror ){
        path._mirror.add( getMirrorPoint( pos, path.project ) );
      }

      return;
    }

    if( path.lastCurve.length < 10 ){
      return;
    }
    

    path.add( path.lastSegment.point );

    if ( path._mirror ) {
      path._mirror.add( getMirrorPoint( path.lastSegment.point, path.project ) );
    }
  },
  onEnd( path, stateMan ) {
    stateMan.addPath( path, false, true );

    if ( path._mirror ) {
      StateManager.updateMirror( path );
      stateMan.addPath( path._mirror, false, true );
    }
  },
};

const hitConfig = {
  tolerance : 1,
  fill      : true,
  stroke    : false,
  curves    : true,
};

let rawPath: paper.Path;


const bucket: Tool = {
  name : "bucket",
  icon : "fa-fill-drip",
  onStart( path, stateMan, pos ) {
    stateMan.paths.some( ( pp ) => {
      const hit = pp.hitTest( pos, hitConfig );

      if( !hit ) {
        return;
      }
    } );
  },
  onDraw() {
    return true;
  },
  onEnd( path, stateMan ) {
  },
};

// const text: Tool = {
//   name : "text",
//   icon : "fa-text",
//   onStart(){


//   },
//   onDraw(){
//     path.lastSegment.point = 
//   }
//   onEnd(){

//   }
// };

Object.assign( TOOLS, {
  // bucket,
  roller,
  brush,
  pen,
  pencil,
  guide,
} );

const props = withDefaults( defineProps<{
  embedMode: boolean,
  inkColors: Record<string, InkToken>,
  user: any,
  emitt?: ( event: string, data: any ) => void,
}>(), {
  user      : {},
  embedMode : false,
} );

const currentTool = ref<Tool>( TOOLS.brush );
let eraserPrevTool: Tool = currentTool.value;
let svgUrl: string;

async function downloadSVG() {
  const svgData1 = ( await whiteboard.value?.exportSVG() );
  const svgData = await getCNC( svgData1 );
  var preface = "<?xml version=\"1.0\" standalone=\"no\"?>\n";
  var svgBlob = new Blob( [
    preface, svgData,
  ], {
    type : "image/svg+xml;charset=utf-8",
  } );

  const filename = window.prompt(
    "Save as:",
    `inkognitos-${ new Date().toISOString() }.svg`
  )?.replace( /(\.svg)?$/i, ".svg" );

  if ( !filename ) {
    return;
  }


  if ( svgUrl ) {
    URL.revokeObjectURL( svgUrl );
  }

  svgUrl = URL.createObjectURL( svgBlob );

  var downloadLink = document.createElement( "a" );

  downloadLink.href = svgUrl;
  downloadLink.download = filename;
  document.body.appendChild( downloadLink );
  downloadLink.click();
  document.body.removeChild( downloadLink );
}

let WINDOW;
const limitExcess = ref( true );
const route = useRoute();


function getPenWidth( x ){
  return 2 + Math.floor( Math.pow( 2, x ) );
}

onMounted( async () => {
  WINDOW = window;
  colorBlack = new paper.Color( "#000000" );
  colorWhite = new paper.Color( "#FFFFFF" );
  colorGuide = new paper.Color( "#0066SS" );
  activeColor.fill = colorBlack?.toCSS( true );
  mouseVel = new paper.Point( 0, 0 );
  pos0 = new paper.Point( 0, 0 );
  watch( ()=>penWidthLog2.value, ( v ) => {
    penWidth.value = getPenWidth( v );
    brushWidth = getPenWidth( v ) ;
  }, {
    immediate : true,
  } );

  
  if( route.query?.showInk ){
    currentColorTarget.value = "fill";
  }
    
  joinPreview = new paper.Path( {
    visible : true,
  } );
  initPathColor( joinPreview );
  onlyPen.value = Boolean( window.localStorage.getItem( "penMode" ) );
  useMirror.value = Boolean( window.localStorage.getItem( "useMirror" ) );
  limitExcess.value = Boolean( window.localStorage.getItem( "limitExcess" ) );
  showInk.value = Boolean( window.localStorage.getItem( "showInk" ) );
  window?.removeEventListener( "keydown", onKeyDown );
  window?.addEventListener( "keydown", onKeyDown );
} );
onBeforeUnmount( async () => {
  window?.removeEventListener( "keydown", onKeyDown );

  if ( typeof window !== "undefined" ) {
    window.onbeforeunload = null;
  }
} );
watch( ()=>onlyPen.value, ( val ) => {
  window.localStorage.setItem( "penMode", val ? "1" : "" );
} );
watch( ()=>useMirror.value, ( val ) => {
  window.localStorage.setItem( "useMirror", val ? "1" : "" );
} );
watch( ()=>limitExcess.value, ( val ) => {
  window.localStorage.setItem( "limitExcess", val ? "1" : "" );
} );


function clearGuides() {
  whiteboard.value?.layers.guide.removeChildren();
  whiteboard.value?.PAPER.project.view.update();
}

const emit = defineEmits<{
  ( event: "modify", _:any ): void;
}>();

function $emit( event:string, data?:any ) {
  props.emitt?.( event as any, data );
  emit( event as any, data );
}


const targetLayer = ref<number>( 1 );
const $window = window;


function onKeyDown( e: KeyboardEvent ) {
  if ( e.code === "KeyZ" ) {
    whiteboard.value?.stateMan().undo();
    e.preventDefault();
    e.stopPropagation();

    return;
  }

  if ( e.code === "KeyY" ) {
    whiteboard.value?.stateMan().redo();
    e.preventDefault();
    e.stopPropagation();

    return;
  }
}


</script>

<template lang="pug">

.w-100(
  @touchmove.self.prevent=""
)
  .row.g-0.align-items-center.flex-nowrap.w-100
    .col.justify-content-center.d-flex(
      @mousedown.stop=""
      @pointerdown.stop=""
      @touchstart.stop=""
    )
      .scroll-y.side-menu
        .row.g-1.align-items-center
          .col-12
            .btn-group-vertical
              .btn.btn-white(
                v-for="i in 3" @click="penWidthLog2=i;"
                :class="{'border border-dark':(penWidthLog2===i)}" ).px-2
                svg(width="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg")
                  path(d="M 8 24 T 24 8 Z" :stroke-width="`${ getPenWidth(i) }px`" stroke="black" line-cap="round")


          .col-12
            .btn-group-vertical
              //- .btn(
              //-   @click.stop="currentTool = eraserPrevTool; setStrokeFill(false, true)"
              //-   :class="{ active: !strokeFillMode.stroke && strokeFillMode.fill }"
              //-   v-tooltip="{ content: 'Only-fill', placement: 'left' }"
              //- )
              //-   i.fa-stack
              //-     i.fa-stack-1x.fa-xl.fa.fa-circle(
              //-       :style="{ color: activeColor.fill||'' }"
              //-     )

              //- .btn(
              //-   @click.stop="currentTool = eraserPrevTool; setStrokeFill(true, true)"
              //-   :class="{ active: strokeFillMode.stroke && strokeFillMode.fill }"
              //-   v-tooltip="{ content: 'Outlined', placement: 'left' }"
              //- )
              //-   i.fa-stack
              //-     i.fa-stack-1x.fa-xl.fa.fa-circle(:style="{ color: activeColor.fill||'' }")
              //-     i.fa-stack-1x.fa-xl.far.fa-circle

              //- .btn(
              //-   @click.stop="currentTool = eraserPrevTool; setStrokeFill(true, false)"
              //-   :class="{ active: strokeFillMode.stroke && !strokeFillMode.fill }"
              //-   v-tooltip="{ content: 'Only-outline', placement: 'left' }"
              //- )
              //-   i.fa-stack
              //-     i.fa-stack-1x.fa-xl.fa.fa-circle-notch
          .col-12
            ModalBox(
              :value="currentColorTarget === 'fill'"
              @close="currentColorTarget = ''"
              tabindex="-1"
            )
              template(#header)
                .row.g-2(style="height: 4rem;")
                  .col.align-items-center.d-flex
                    h5.m-0 INK Palette
                  .col-auto
                    .px-4.h-100.rounded-4.border.border-black.appear.striped-dark(
                      @click.stop="activeColor.fill = ''; setStrokeFill(null, true); currentColorTarget = ''"
                      style="width:100%"
                    ).flex-center Clear
                  .col-auto
                    .px-4.h-100.rounded-4.border.border-black.appear(
                      @click.stop="activeColor.fill = '#FFFFFF'; setStrokeFill(null, true); currentColorTarget = ''"
                      style="width:100%; background-color: #FFFFFF;"
                    ).flex-center


              .modal-body.bg-light2.p-3
                .w-100
                  .row.g-2
                    template(
                      v-for="(item, c) in Object.values(inkColors).filter(a=> a.color !== '#FFFFFF' )"
                      :key="item.color"
                    )
                      .col-2(
                        v-if="item && !( limitExcess && !item.myBalance?.gt(0) )"
                      )
                        .square.rounded-4.border.border-black.appear(
                          :style="{ backgroundColor: item.color, '--delay': `${c*0.1}` }",
                          :class="[ \
                            (item?.color === activeColor[currentColorTarget]) ? 'shadow-inset border-black' : 'shadow-lg border-white', \
                            (!item.color) ? 'striped-dark' : '' \
                          ]"
                          @click.stop="activeColor.fill = item.color; setStrokeFill(null, true); currentColorTarget = ''"
                        )
                          .pos-rel
                            .badge.bg-white.p-1.pos-abs.bottom.right(
                              v-if="item.myBalance?.gt(0) && item.maxSupply?.gt(0)"
                            ) {{ item.myBalance?.toString() }}
                            
              .modal-footer
                .form-check.form-switch
                  input.form-check-input(type='checkbox' v-model="limitExcess")
                  label.form-check-label Only use INK that I own


                      
          .col-12
            .btn-group-vertical(
              @click.stop="currentTool = eraserPrevTool"
              v-tooltip="{ content: 'Color', placement: 'left' }"
            )
              .square
                .d-block.rounded.rounded-pill(
                  @click="() => { currentColorTarget = currentColorTarget ? '' : 'fill'; }",
                  :class="{ 'active': strokeFillMode.fill }"
                  :style="{ backgroundColor: activeColor.fill||'' }",
                ).border.border-2.border-black

          .col-12
            .btn-group-vertical(
              v-tooltip="{ content: 'Tools', placement: 'left' }"
            )
              template(
                v-for="tool in TOOLS"
              )
                .btn.btn-outline-dark(
                  v-if="tool.icon"
                  :class="(currentTool.name === tool.name) ? 'active' : 'btn-white text-dark1'"
                  @click.stop="() => { eraserPrevTool = currentTool = tool; }",
                ): i.fa.fa-xl(:class="tool.icon")

            hr.mx-2
            .btn.btn-outline-danger(
              @click.stop="() => { eraserPrevTool = currentTool; currentTool = eraser; }",
              :class="(currentTool.name === 'eraser') ? 'active' : ''"
            ): i.fa.fa-lg.fa-eraser

          .col-12
            .btn-group-vertical
              .btn.btn-light1.text-danger(
                @click="() => { whiteboard?.stateMan?.().undo(); }",
              ): i.fa.fa-reply
              .btn.btn-light1.text-dark(
                @click="() => { whiteboard?.stateMan?.().redo(); }",
              ): i.fa.fa-reply.fa-rotate-180


    .col-auto(
      @touchmove.prevent=""
      @touchstart.prevent=""
      @touchend.prevent=""
      @touchcancel.prevent=""
      @mousedown.stop=""
      @pointerdown.stop=""
      @touchstart.stop=""
    )
      Whiteboard(
        ref="whiteboard",
        :strokeFillMode="strokeFillMode",
        @modify="$emit('modify')"
        :config="{ penWidth, size: [canvasRes, canvasRes], bgImage: '' }"
        :useMirror="useMirror"
        :targetLayer="targetLayer"
        :hideTemplate="hideTemplate",
        :onlyPen="onlyPen",
        :currentTool="currentTool",
        ).border.my-2.shadow
        .pos-abs.faded.top.square(
          style="pointer-events: none;"
        )
          .p-2
            .rounded-circle.h-100(style="border: 2px dashed #000; opacity: 0.2;")


    .col.justify-content-center.d-flex(
      @mousedown.stop=""
      @pointerdown.stop=""
      @touchstart.stop=""
    )
      .side-menu.scroll-y
        .row.g-2
          .col-12
            .btn.btn-white(title="Pen/Pointer" @click="onlyPen = !onlyPen")
              i.fa.fa-pen(v-if="onlyPen")
              i.fa.fa-hand-pointer.rotate-45(v-else)

            template(v-if="user?.isAdmin")
              hr.mx-2
              .btn-group-vertical.faded
                .btn.btn-white.text-success(@mousedown.prevent="downloadSVG")
                  i.fa.fa-fw.fa-download

          .col-12
            .btn-group-vertical
              .btn.btn-white(
                :class="(currentTool.name === 'guide') ? 'active' : ''"
                @click.stop="() => { \
                  if( currentTool.name === TOOLS.guide.name ){ currentTool=eraserPrevTool; }else{ eraserPrevTool=currentTool; currentTool=TOOLS.guide } \
                }",
                v-tooltip="{ content: 'Guideline', placement: 'right' }"
              )
                i.fa.fa-fw.fa-compass-drafting
                
              .btn.btn-light(
                v-if="(currentTool.name === 'guide') "
                @click.stop="() => { clearGuides(); }",
                v-tooltip="{ content: 'Clear-guides', placement: 'right' }"
              )
                i.fa.fa-stack
                  i.fa.fa-stack-1x.fa-lg.fa-slash.text-danger
                  i.fa.fa-stack-1x.fa-compass-drafting

            .btn.btn-white(
              @click="() => { useMirror = !useMirror; }",
              :class="useMirror ? 'active' : ''"
              v-tooltip="{ content: 'Mirror', placement: 'right' }"
            )
              .d-flex(style="width: 1em; font-size: 1.5rem").mx-auto
                .overflow-hidden.py-1.d-flex(style="width: 50%; overflow: hidden;").border-end.border-white
                  .d-block.far.fa-smile
                .overflow-hidden.py-1.d-flex(style="width: 50%; overflow: hidden;").faded
                  .d-block.far.fa-smile(style="margin-left:-100%")

            .btn.btn-white(
              @click="() => { targetLayer = targetLayer < 0 ? 1 : -1; }",
              :class="targetLayer < 0 ? 'active btn-warning' : ''"
                v-tooltip="{ content: 'Behind', placement: 'right' }"
            )
              i.fa-lg.fa.fa-arrows-down-to-line

            hr.mx-2
            .btn-group-vertical
              .btn.btn-white.text-danger(
                @click="() => { if ($window.confirm('Clear canvas?')) { whiteboard?.clear(); } }",
                v-tooltip="{ content: 'Clear', placement: 'right' }"
              ): i.fa.fa-file-circle-xmark
  slot


</template>

<style lang="scss" scoped>


.scroll-y{
  flex-direction: column;
  justify-content: center;
  max-height: calc( 100vh - 5rem );

  &::-webkit-scrollbar{
    display: none;
  }
}

.btn-group-vertical {
  width: 100%;
}

.btn {
  border: none;
  border-radius: 10% !important;
  &.active{
    background-color: $dark1;
    color: #fff;
  }
}

.btn{
  border-color: transparent;
}

.col-12{
  &>.btn-group-vertical{
    margin: 0.25rem 0;
    &>.btn{
      margin: 0.25rem 0;
    }
  }
  &>.btn{
    margin: 0.25rem 0;
  }
}

.side-menu {
  z-index: 10;
  width: 3em;

  .btn{
    padding: 0.5em 0 !important;
    border-radius: 50% !important;
    width: 100%;
    height: 3em;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}


@include media-breakpoint-down(md) {
  .side-menu {
    margin: 0%;
    width: 2em;

    .btn {
      width: 100%;
      font-size: 0.6em;
    }
  }
}


.tiny {
  font-size: 0.8rem;
}

table.table {
  td {
    vertical-align: middle;
  }
}
</style>
