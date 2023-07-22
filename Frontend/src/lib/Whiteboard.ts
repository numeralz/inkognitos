// import * as jsondiffpatch from "jsondiffpatch";
import * as paper from "paper";
import simplify from "simplify-js";
import type { Ref } from "vue";
import { TAO } from "./utils";
import { PaperOffset } from "paperjs-offset";

// const PATCH = jsondiffpatch.create( {
//   cloneDiffValues : true,
//   // arrays          : {
//   //   detectMove : true,
//   // },
//   // propertyFilter( name:string, context ){
//   //   return [

//   //   ].includes( name );
//   // },

// } );

// import concaveman from "concaveman";
export declare type PathType = paper.Path | paper.CompoundPath;
export declare type PathExtended<T extends paper.PathItem = paper.PathItem> = T & { _mirror?: PathExtended<T> };
export declare type InputPath = paper.Path & { _mirror?: InputPath }
export class ShapeItem extends paper.Path {
  _path: PathType;

  _isGuide = false;
  _mirror?: ShapeItem;

  constructor( item: PathType ) {
    super();
    this._path = item;
  }
}
export interface Tool {
  name: string,
  icon: string,
  onStart(
    path: InputPath,
    stateMan: StateManager,
    pos: paper.Point,
    context?: any
  ): void,
  onDraw?(
    path: InputPath,
    stateMan: StateManager,
    pos: paper.Point,
    context?: any
  ): boolean | void,
  onMove?(
    path: InputPath,
    stateMan: StateManager,
    pos: paper.Point,
    context?: any
  ): boolean | void,
  onEnd(
    path: InputPath,
    stateMan: StateManager,
    pos: paper.Point,
    context?: any
  ): void,
}
export interface StateDelta {
  sendToBack?: boolean,
  layer?: paper.Layer,
  add?: ( PathType | null )[],
  remove?: ( PathType | null )[],
}
export interface LineSegment {
  len: number,
  angle: number,
}
export function mod( a: number, n: number ) {
  return a - Math.floor( a / n ) * n;
}
export const angleDiff = ( x: number, y: number ) => {
  let a = x - y;

  a = mod( a + Math.PI, TAO ) - Math.PI;

  return a;
};
export function reduceSingleChildCompoundPath( path: PathType ) {
  if ( path.children.length === 1 ) {
    path = path.children[ 0 ] as paper.Path;
    path.remove(); // remove from parent, this is critical, or the style attributes will be ignored
  }

  return path;
}
export function normalizePath( path: PathType, areaThreshold = 0.01 ) {
  if ( path.closed ) {
    const ignoreArea = Math.abs( path.area * areaThreshold );

    if ( !path.clockwise ) {
      path.reverse();
    }

    path = path.unite( path, {
      insert : false,
    } ) as PathType;

    if ( path instanceof paper.CompoundPath ) {
      path.children.filter( ( c ) => Math.abs( ( c as PathType ).area ) < ignoreArea ).forEach( ( c ) => c.remove() );

      if ( path.children.length === 1 ) {
        return reduceSingleChildCompoundPath( path );
      }
    }
  }

  return path;
}
export function getMirrorPoint( pos: paper.Point, project: paper.Project ) {
  const mp = pos.clone();



  mp.x = ( project.view.bounds.width ) - pos.x + 0.5 * Math.sign( pos.x - project.view.bounds.width / 2 );
  mp.y = pos.y;

  return mp;
}

let lineFillCount = 0;

export function lineFill( shape: paper.Path | paper.CompoundPath, density = 1 ) {
  const colorBlack = new paper.Color( "black" );

  if ( !density ) {
    return new paper.Path( {
      insert : false,
    } );
  }

  const ORIGIN = shape.bounds.center;
  const rotation = ( 1 + lineFillCount++ ) * ( 360 * 1.61803 ) % 360;

  const compound = new paper.Group( {
    insert   : false,
    position : shape.position,
  } );

  compound.rotate( rotation, ORIGIN );
  shape.rotate( rotation, ORIGIN );
  shape.reorient( true, true );

  const LINES_COUNT = Math.ceil( shape.bounds.size.height * Math.pow( Math.max( 0.1, Math.min( density, 0.7 ) ), 3 ) );
  const lineDistance = shape.bounds.size.height / LINES_COUNT;

  for ( let i = 0; i < LINES_COUNT; i += 1 ) {
    const y = shape.bounds.top + ( i + 0.5 ) * lineDistance;

    // Create a horizontal line crossing the shape.
    const line = new paper.Path.Line( {
      from   : new paper.Point( shape.bounds.left - 1, y ),
      to     : new paper.Point( shape.bounds.right + 1, y ),
      insert : false,
    } );

    const int1 = line.getIntersections( shape );

    if ( int1.length < 2 ) {
      continue;
    }

    // Every 2 intersections...
    for ( let j = 0; j < int1.length; j++ ) {
      if ( j > 0 && j % 2 === 1 ) {
        const line = new paper.Path.Line( {
          insert        : false,
          from          : new paper.Point( int1[ j - 1 ].point.x, y ),
          to            : new paper.Point( int1[ j ].point.x, y ),
          strokeWidth   : 1,
          strokeScaling : false,
          strokeColor   : colorBlack,
          closed        : true,
        } );

        compound.addChild( line );
      }
    }
  }

  compound.rotate( -rotation, ORIGIN );
  shape.rotate( -rotation, ORIGIN );
  shape.reorient( true, true );
  shape.view.update();

  return compound;
}
export function getCNC( svgData1: string ) {
  const colorBlack = new paper.Color( "black" );
  return new Promise<string>( ( resolve, reject ) => {
    const p = new paper.PaperScope();

    p.setup( new paper.Size( 1024, 1024 ) );
    p.project.importSVG( svgData1, {
      insert : false,
      onLoad( item: paper.Item ) {
        p.project.clear();

        const l = new p.Layer( {
          insert : true,
        } );

        // const l2 = new p.Layer( {
        //   insert : true,
        // } );

        const children = ( item.getItems( {
          recursive : true,
          match( x ) {
            return ( ( x instanceof paper.Path ) || ( x instanceof paper.CompoundPath ) ) && !( x.parent instanceof paper.CompoundPath );
          },
        } ) as PathType[] || [] )
        .sort( ( a, b )=>( a.isAbove( b ) ? 1 : -1 ) );


        children.forEach( ( o ) => {
          // o.closePath();
          l.addChild( o );
        } );

        
        // children.forEach(x=>l.addChild(x));

        // (children as PathType[]).forEach((o, j) => {

        for( let j = 1; j < l.children.length; j++ ){
          const o = l.children[j];

          for( let i = 0; i < j; i++ ){
            const pp = l.children[i];

            // console.log( j, i );

            if( !pp?.hasFill() ){
              continue;
            }

            if ( pp.fillColor?.toCSS( true ) === o.fillColor?.toCSS( true ) ) {
              const pp2 = pp.unite( o, {
                insert : false,
                trace  : true,
              } );

              l.children[j] = new paper.Path( {
                insert : false,
              } );
              l.children[i] = pp2;
            } else {
              const pp2 = pp.subtract( o, {
                insert : false,
                trace  : true,
              } );
              

              l.children[i] = pp2;
            }
          }
        }

        const l2 = new p.Layer( {
          insert : true,
        } );

        for( let j = 0; j < l.children.length; j++ ){
          const o = l.children[j];

          // if( !o?.hasFill() ){
          //   continue;
          // }

          if ( o?.hasFill() ) {
            o.reorient( true, true );

            const fill = lineFill( o, ( 1 - ( o.fillColor?.lightness || 0 ) ) );

            l2.addChild( o );
            fill.fillColor = null;
            fill.strokeColor = o.fillColor;
            o.strokeColor = o.fillColor;
            fill.insertBelow( o );
            o.strokeColor = colorBlack;
            o.strokeWidth = 1;
            o.fillColor = null;
          }
        }
        
        l.remove();
        p.view.update();
        resolve( p.project.exportSVG( {
          asString : true,
        } ) as string );
      },
    } );
  } );
}
export class StateManager {
  deltas: StateDelta[] = [];
  undone: StateDelta[] = [];
  layers: Record<string, paper.Layer | paper.Raster> = {};
  raster!: paper.Raster;
  target: Ref<number>;
  static PAPER: paper.PaperScope;


  constructor( {
    PAPER,
    layers,
    target,
  }: {
    PAPER: paper.PaperScope,
    layers,
    target: Ref<number>,
  } ) {
    this.layers = layers;
    this.target = target;
  }

  get allPaths() {
    return this.layers.fg.children || [];
  }

  get paths() {
    return this.layers.fg?.getItems( {
      recursive : false,
      match( item: paper.Item ) {
        return item.visible && ( item instanceof paper.Path || item instanceof paper.CompoundPath );
      },
    } ) as ( paper.Path | paper.CompoundPath )[];
  }

  get onlyPaths() {
    return this.layers.fg?.getItems( {
      recursive : true,
      class     : paper.Path,
      match( item: paper.Item ) {
        return item.visible && item instanceof paper.Path;
      },
    } ) as ( paper.Path )[];
  }

  static pathPoints( path: PathType ) {
    if ( path instanceof paper.Path ) {
      return path.segments.map( ( segment ) => segment.point );
    }

    return ( <paper.Path[]>path.children ).map( ( child ) => this.pathPoints( child ) ).flat();
  }


  static reducePath( path: PathType, tolerance = 2, hq = true ) {
    path.flatten( 0.5 );
    path.reduce( 1 );

    if ( path instanceof paper.CompoundPath ) {
      ( <paper.Path[]>path.children ).forEach( ( path ) => {
        const points = this.pathPoints( path );

        path.segments = simplify( points, tolerance, hq ).map( ( point ) => {
          return point as any;
        } );
      } );
    } else {
      const points = this.pathPoints( path );

      path.segments = simplify( points, tolerance, hq ).map( ( point ) => {
        return point as any;
      } );
    }
  }

  static roundPath( path: paper.Path, factor = 2 ) {
    if ( !path ) {
      return;
    }

    const area = Math.abs( path.area );

    if ( path instanceof paper.CompoundPath ) {
      path.children.forEach( ( child ) => {
        // if( Math.abs( child.area || area ) < 0.05 * area ) {
        //   child.remove();
        // }

        this.roundPath( child as paper.Path );
      } );

      return;
    }


    if ( !( path instanceof paper.Path ) ) {
      return;
    }

    const wasClosed = path.closed;

    path.flatten( 1 );

    if ( !path.lastSegment ) {
      return;
    }

    const parts: paper.Path[] = [];
    const s1 = path.lastSegment;
    let s = path.lastSegment.previous;
    const angleOut = path.getTangentAt( 0 ).angle;
    const angleIn = path.getTangentAt( path.length ).multiply( -1 ).angle;

    if ( wasClosed ) {
      path.splitAt( path.length );
    }

    let prevAng = 0;

    while ( s && s.index >= 0 ) {
      try {
        const t0 = s.next.curve.getTangentAtTime( 0.5 );
        const t1 = s.curve.getTangentAtTime( 0.5 );
        const ang = ( t1.getDirectedAngle( t0 ) / 360 ) * 2;
        const absAng = Math.abs( ang );
        // const len = Math.max( ( parts.at( -1 )?.length || 0 ), s.next.location.offset );

        // @ts-ignore-next
        if ( ( absAng > 0.45 && absAng < 0.9 ) || ( ( Math.sign( ang ) !== Math.sign( prevAng ) ) ) || s.next.point._keep ) {
          const part = path.splitAt( s.next.location.offset );

          parts.push( part );
        }

        prevAng = ang;
        s = s.previous;
      } catch ( err ) {
        console.log( err );
      }
    }

    parts.push( path.splitAt( 0 ) );

    let part: paper.Path | undefined;

    path.removeSegments();
    // console.log( parts.length );

    let i = 0;

    while ( ( part = parts.shift() ) ) {
      part.simplify( factor );
      path.join( part, 0 );
      i++;
    }


    if ( wasClosed ) {
      // path.join( null );
      path.closePath();
    } else {
      path.firstSegment.handleOut.angle = angleOut;
      path.lastSegment.handleIn.angle = angleIn;
    }
  }

  static arcPath( path: PathType, r = 64 ) {
    if ( path instanceof paper.CompoundPath ) {
      path.children.forEach( x => StateManager.arcPath( x as paper.Path, r ) );

      return;
    }

    // path.reorient( true, true );
    path.flatten( 32 );

    const segments = path.segments.slice( 0 );

    path.removeSegments();

    for ( let i = 0, l = segments.length; i < l; i++ ) {
      const curPoint = segments[ i ].point;
      const nextPoint = segments[ i + 1 === l ? 0 : i + 1 ].point;
      const prevPoint = segments[ i - 1 < 0 ? segments.length - 1 : i - 1 ].point;
      const nextDelta = curPoint.subtract( nextPoint );
      const prevDelta = curPoint.subtract( prevPoint );

      const radius = Math.min(
        r,
        nextDelta.length / 2,
        prevDelta.length / 2
      );

      nextDelta.length = prevDelta.length = radius;
      path.add(
        new paper.Segment( {
          point     : curPoint.subtract( prevDelta ),
          handleOut : prevDelta.divide( 2 ),
        } )
      );
      path.add(
        new paper.Segment( {
          point    : curPoint.subtract( nextDelta ),
          handleIn : nextDelta.divide( 2 ),
        } )
      );
    }

    // path.closed = true;
  }

  static updateMirror( path: InputPath ): InputPath {
    if ( path._mirror ) {
      path._mirror.remove();
    }

    path.reorient( true, true );
    path._mirror = path.clone( {
      insert : true,
    } );
    path._mirror._mirror = path;
    path._mirror.position.x = path.project.view.bounds.width - path.position.x;
    path._mirror.scaling.x = -1;
    path._mirror.reorient( true, true );

    return path._mirror;
  }

  static mergeMirror( path: InputPath, mirror?: InputPath ): InputPath {
    const mirrorX = this.PAPER.view.size.width / 2;

    if ( !mirror ) {
      mirror = path._mirror;
    }

    if ( !path.lastSegment || !path.firstSegment ) {
      console.log( "segment" );

      return path;
    }

    const leftSide = ( path.bounds.left - mirrorX );
    const rightSide = ( path.bounds.right - mirrorX );
    const startSide = ( path.firstSegment.point.x - mirrorX );
    const endSide = ( path.lastSegment.point.x - mirrorX );
    const centerSide = leftSide + rightSide;

    /* UNCLOSED */
    const rect = new paper.Path.Rectangle( {
      center : [
        0, this.PAPER.view.bounds.height / 2,
      ],
      size : new paper.Point(
        this.PAPER.view.bounds.width / 2,
        this.PAPER.view.bounds.height
      ),
      insert : false,
    } );

    const side = -Math.sign( centerSide );

    rect.position.x = 0.5 * this.PAPER.view.bounds.width * ( 1 + side * 0.5 );

    if ( Math.sign( leftSide ) === Math.sign( rightSide ) ) {
      /* Does not cross the mirror line */
      this.updateMirror( path );

      return path;
    }



    path.remove();
    path._mirror?.remove();

    // const half = path.subtract( rect, {
    //   insert : false,
    //   // trace  : true,
    // } );
    const half = path;

    this.updateMirror( half );

    const full = half.unite( half._mirror, {
      insert : false,
    } );

    return full;
  }


  removePath( path: PathExtended ) {
    path.visible = false;
    path.remove();

    if ( path.layer === this.layers.fg ) {
      this.updateRaster();
    } else {
      StateManager.PAPER.view.update();
    }
  }

  updateRaster() {
    // this.updateBackdrop();
    this.layers.fg.visible = true;
    this.layers.raster?.removeChildren();
    this.layers.raster?.addChild( this.layers.fg.rasterize( {
      insert : false,
    } ) );
    this.layers.fg.visible = false;
    StateManager.PAPER.view.update();
  }

  addPath( path: PathType, withMirror = false, isGuide = false ) {
    if ( !path ) {
      return;
    }

    path.visible = true;
    path.remove();

    if ( isGuide ) {
      this.layers.guide?.addChild( path );
      StateManager.PAPER.view.update();
    } else {
      // if( !this.layers.fg?.isChild( path ) ){
      if ( this.target.value < 0 ) {
        this.layers.fg?.insertChild( 0, path );
      } else {
        this.layers.fg?.addChild( path );
      }

      // }
    }
  }

  _diffs: any[] = [];
  _unDiffs: any[] = [];

  pushState( addRemove: StateDelta ) {
    const before = this.layers.fg.exportJSON( {
      asString : false,
    } );

    this.applyDelta( addRemove );


    // const after = this.layers.fg.exportJSON( {
    //   asString : false,
    // } );

    // const after = this.layers.fg.exportJSON( {
    //   asString : false,
    // } );

    // if( !before ){
    //   this._diffs.push( after );

    //   return;
    // }

    // const delta = PATCH.diff( before, current );

    // if( !delta ){
    //   return;
    // }

    // this._diffs.push( delta );
    this._diffs.push( before );
    this._diffs = this._diffs.slice( -4 );
    this._unDiffs = [];
  }

  undo() {
    const current = this.layers.fg.exportJSON( {
      asString : false,
    } );

    this.layers.fg.removeChildren();

    const delta = this._diffs.pop();

    if ( delta ) {
      this._unDiffs.push( current );
      this.layers.fg.importJSON( delta );
    }

    this.updateRaster();
  }

  redo() {
    const current = this.layers.fg.exportJSON( {
      asString : false,
    } );

    const delta = this._unDiffs.pop();

    if ( delta ) {
      this._diffs.push( current );
      this.layers.fg.removeChildren();
      this.layers.fg.importJSON( delta );
      this.updateRaster();
    }
  }


  pushState_( delta: StateDelta ) {
    this.undone = [];
    this.applyDelta( delta );
    // this.updateBackdrop( delta.add );
  }

  undo_() {
    console.log( "undo" );

    const delta = this.deltas.pop();

    if ( delta ) {
      this.applyDelta( delta, true );
    }
  }

  redo_() {
    console.log( "redo" );

    const delta = this.undone.pop();


    if ( delta ) {
      this.applyDelta( delta, false );
    }
  }

  // add/remove paths in state
  private applyDelta( delta: StateDelta, reverse?: boolean ) {
    const add = reverse ? delta.remove : delta.add;
    const remove = reverse ? delta.add : delta.remove;

    add?.forEach( ( path ) => {
      if ( path ) {
        this.addPath( path );
      }
    } );
    remove?.forEach( ( path ) => {
      if ( path ) {
        this.removePath( path );
      }
    } );

    // if( reverse ){
    //   this.undone.push( delta );

    //   if( this.undone.length > 100 ){
    //     this.undone = this.undone.slice( -100 );
    //   }
    // }else{
    //   this.deltas.push( delta );

    //   if( this.deltas.length > 100 ){
    //     this.deltas = this.deltas.slice( -100 );
    //   }
    // }

    this.updateRaster();
  }
}

