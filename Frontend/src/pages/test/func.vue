<script lang="ts" setup>

import paper from "paper";


// fast spatial hash grid (no GC)
class Grid {
  max: any;
  neighborsSize: number;
  neighbors: Uint16Array;
  width: any;
  size: any;
  cellsSize: any;
  height = 0;
  cells = new Uint16Array();

  constructor( maxParticlesPerCell: number ) {
    this.max = maxParticlesPerCell;
    this.neighborsSize = 0;
    this.neighbors = new Uint16Array( this.max );
  }

  index( x: number, y: number ) {
    return this.max * ( y * this.width + x );
  }

  getX( x: number ) {
    return ( 0.5 + x / this.size ) | 0;
  }

  getY( y: number ) {
    return ( 0.5 + y / this.size ) | 0;
  }

  cellSize( x: number, y: number ) {
    return this.cellsSize[y * this.width + x];
  }

  initSize( width: number, height: number, size: number ) {
    this.width = Math.round( width / size ) + 1;
    this.height = Math.round( height / size ) + 1;
    this.size = size;
    this.cells = new Uint16Array( this.width * this.height * this.max );
    this.cellsSize = new Uint8Array( this.width * this.height );
  }

  fill( particles:Particle[] ) {
    for ( let p of particles ) {
      const xc = this.getX( p.x );
      const yc = this.getY( p.y );
      const index = yc * this.width + xc;

      if ( this.cellsSize[index] < this.max ) {
        const cellPos = this.cellsSize[index]++;

        this.cells[index * this.max + cellPos] = p.i;
      }
    }
  }

  update( particles:Particle[] ) {
    for ( let i = 0; i < this.width * this.height; ++i ) {
      for ( let j = 0; j < this.cellsSize[i]; ++j ) {
        const p = particles[this.cells[i * this.max + j]];
        const xc = this.getX( p.x );
        const yc = this.getY( p.y );
        const index = yc * this.width + xc;

        // if new grid position
        if ( index !== i && this.cellsSize[index] < this.max ) {
          this.cells[index * this.max + this.cellsSize[index]++] = p.i;
          // replace the old particle with the last one
          this.cells[i * this.max + j] = this.cells[
          i * this.max + --this.cellsSize[i]
          ];
        }
      }
    }
  }
}
class Particle {
  i: any;
  x: any;
  y: any;
  px: any;
  py: any;
  vx: number;
  vy: number;
  q: number;
  vlen: number;
  constructor( i: number, x: number, y: number ) {
    this.i = i;
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0.0;
    this.vy = 0.0;
    this.q = 0.0;
    this.vlen = 0.0;
  }

  integrate() {
    sun.collide( this );
    container.limit( this );

    const x = this.x;
    const y = this.y;

    this.x += this.x - this.px;
    this.y += this.y - this.py + kGravity;
    this.px = x;
    this.py = y;
  }

  fluid() {
    // Ref Grant Kot Material Point Method http://grantkot.com/
    let pressure = 0;
    let presnear = 0;

    grid.neighborsSize = 0;

    const xc = grid.getX( this.x );
    const yc = grid.getY( this.y );

    // 3 x 3 cells
    for ( let x = xc - 1; x < xc + 2; ++x ) {
      for ( let y = yc - 1; y < yc + 2; ++y ) {
        const len = grid.cellSize( x, y );

        if ( len ) {
          const index = grid.index( x, y );

          for ( let k = index; k < index + len; ++k ) {
            const id = grid.cells[k];

            if ( id !== this.i ) {
              const pn = particles[id];
              const vx = pn.x - this.x;
              const vy = pn.y - this.y;

              pn.vlen = vx * vx + vy * vy;

              if ( pn.vlen < kRadius * kRadius ) {
                // compute density and near-density
                pn.vlen = Math.sqrt( pn.vlen );

                const q = 1 - pn.vlen / kRadius;

                pressure += q * q;
                presnear += q * q * q;
                pn.q = q;
                pn.vx = vx / pn.vlen * q;
                pn.vy = vy / pn.vlen * q;
                grid.neighbors[grid.neighborsSize++] = pn.i;
              }
            }
          }
        }
      }
    }

    // second pass of the relaxation
    pressure = ( pressure - kDensity ) * 1.0;
    presnear *= 0.5;

    for ( let i = 0; i < grid.neighborsSize; ++i ) {
      const pn = particles[grid.neighbors[i]];

      if ( pn ) {
        // apply displacements
        const p = pressure + presnear * pn.q;
        const dx = pn.vx * p * 0.5;
        const dy = pn.vy * p * 0.5;

        pn.x += dx;
        pn.y += dy;
        this.x -= dx;
        this.y -= dy;

        // render
        if ( pn.q > kRendering && pn.vlen < canvas.mx ) {
          ctx.moveTo( this.x, this.y );
          ctx.lineTo( pn.x, pn.y );
        }
      }
    }
  }
}
class Circle {
  x: any;
  y: any;
  px: any;
  py: any;
  dx: number;
  dy: number;
  r: any;
  drag: boolean;
  over: boolean;
  constructor( x: number, y: number, r: number ) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.dx = 0;
    this.dy = 0;
    this.r = r;
    this.drag = false;
    this.over = false;
  }

  anim() {
    const dx = pointer.x - this.x;
    const dy = pointer.y - this.y;

    if ( Math.sqrt( dx * dx + dy * dy ) < this.r ) {
      if ( !this.over ) {
        this.over = true;
        canvas.elem.style.cursor = "pointer";
      }
    } else {
      if ( this.over && !this.drag ) {
        this.over = false;
        canvas.elem.style.cursor = "default";
      }
    }

    if ( this.drag ) {
      this.x = pointer.ex + this.dx;
      this.y = pointer.ey + this.dy;
    }

    container.limit( this, this.r );

    const x = this.x;
    const y = this.y;

    this.x += this.x - this.px;
    this.y += this.y - this.py + 2 * kGravity;
    this.px = x;
    this.py = y;
    // render
    ctx.beginPath();
    ctx.arc( this.x, this.y, this.r, 0, 2 * Math.PI );
    ctx.fillStyle = "#65abe3";
    ctx.fill();
  }

  collide( p: { x: number; y: number; } ) {
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.sqrt( dx * dx + dy * dy );

    if ( dist < this.r * 1.2 ) {
      const fx = dx / dist;
      const fy = dy / dist;

      p.x += fx;
      p.y += fy;
      this.x -= 0.01 * fx;
      this.y -= 0.01 * ( fy + 2 * Math.abs( fy ) );
    }
  }
}
const canvasRef = ref<HTMLCanvasElement>();
let container: any;
let pointer: any;
let canvas: any;
let sun: Circle;
let ctx: CanvasRenderingContext2D;
let kRadius: number;
const particles:Particle[] = [];
const grid = new Grid( 100 );
const kGravity = 0.04;
const kDensity = 3;
const kRendering = 0.45;

onMounted( () => {
  // way wavy way
  container = {
    x       : 0,
    y       : 0,
    scale   : 1,
    borders : [],
    init( scale: number ) {
      this.ai = 0;
      this.scale = scale;
      this.borders = [
        new this.Plane(),
        new this.Plane(),
        new this.Plane(),
        new this.Plane(),
      ];
    },
    Plane : class {
      x: number;
      y: number;
      d: number;
      constructor() {
        this.x = 0;
        this.y = 0;
        this.d = 0;
      }

      distanceToPlane( p: { x: number; y: number; } ) {
        return (
          ( p.x - canvas.width * 0.5 ) * this.x +
					( p.y - canvas.height * 0.5 ) * this.y +
					this.d
        );
      }

      update( x: number, y: number, d: number ) {
        this.x = x;
        this.y = y;
        this.d = d;
      }
    },
    rotate() {
      const w = canvas.width;
      const h = canvas.height;
      const s = this.scale;
      const angle = Math.sin( ( this.ai += 0.01 ) ) * s * Math.min( 1.0, h / w );
      const cos = Math.cos( angle );
      const sin = Math.sin( angle );

      this.borders[0].update( -sin, cos, -h * s );
      this.borders[1].update( cos, sin, -w * s );
      this.borders[2].update( -cos, -sin, -w * s );
      this.borders[3].update( sin, -cos, -h * s );
      ctx.save();
      ctx.fillStyle = "#fff";
      ctx.translate( w * 0.5, h * 0.5 );
      ctx.rotate( angle );
      ctx.fillRect( -w * s, -h * s, w * s * 2, h * s * 2 );
      ctx.restore();
    },
    limit( p: this | this, radius = 0 ) {
      for ( let b of this.borders ) {
        let d = b.distanceToPlane( p ) + radius + 0;

        if ( d > 0 ) {
          p.x += b.x * -d + ( Math.random() * 0.1 - 0.05 );
          p.y += b.y * -d + ( Math.random() * 0.1 - 0.05 );
        }
      }
    },
  };
  // setup canvas
  canvas = {
    width  : 0,
    height : 0,
    elem   : null,
    init( this:any ) {
      this.elem = canvasRef.value!;
      this.elem.width = 1000;
      this.elem.height = 1000;

      const ctx = this.elem.getContext( "2d", {
        alpha : false,
      } );

      this.resize();
      window.addEventListener( "resize", () => canvas.resize(), false );

      return ctx;
    },
    resize( this:any ) {
      this.width = this.elem.width = this.elem.offsetWidth;
      this.height = this.elem.height = this.elem.offsetHeight;
      this.mx = Math.sqrt( this.width * this.height / 2000 );
      kRadius = Math.round( 0.04 * Math.sqrt( this.width * this.height ) );
      grid.initSize( this.width, this.height, kRadius );
      grid.fill( particles );

      if ( sun ) {
        sun.r = 1.5 * kRadius;
      }
    },
  };
  // setup pointer
  pointer = {
    init( canvas: { init?: () => any; resize?: () => void; elem?: any; } ) {
      this.x = this.ex = 0;
      this.y = this.ey = 2000;
      window.addEventListener( "mousemove", e => this.move( e, false ), false );
      canvas.elem.addEventListener( "touchmove", ( e: any ) => this.move( e, true ), false );
      window.addEventListener( "mousedown", e => this.down( e, false ), false );
      window.addEventListener( "touchstart", e => this.down( e, true ), false );
      window.addEventListener( "mouseup", e => this.up( e, false ), false );
      window.addEventListener( "touchend", e => this.up( e, true ), false );
    },
    move( e: MouseEvent, touch: boolean ) {
      if ( touch ) {
        e.preventDefault();
        this.x = e.targetTouches[0].clientX;
        this.y = e.targetTouches[0].clientY;
      } else {
        this.x = e.clientX;
        this.y = e.clientY;
      }
    },
    down( e: MouseEvent | TouchEvent, touch: boolean ) {
      this.move( e, touch );

      if ( touch ) {
        sun.anim();
      }

      if ( sun.over ) {
        sun.drag = true;

        if ( touch ) {
          sun.dx = 0;
          sun.dy = 0;
          this.ex = this.x;
          this.ey = this.y;
        } else {
          sun.dx = sun.x - this.ex;
          sun.dy = sun.y - this.ey;
          canvas.elem.style.cursor = "move";
        }
      }
    },
    up( e: MouseEvent | TouchEvent, touch: boolean ) {
      if ( !touch ) {
        canvas.elem.style.cursor = "default";
      }

      sun.drag = false;
      sun.over = false;
    },
    ease( n: number ) {
      this.ex += ( this.x - this.ex ) * n;
      this.ey += ( this.y - this.ey ) * n;
    },
  };
  sun = new Circle(
    canvas.width * 0.5,
    canvas.height * 0.5 - kRadius,
    1.5 * kRadius
  );
  ctx = canvas.init();
  pointer.init( canvas );
  container.init( 0.35 );
  
  // pen setup
  function initParticles( num:number ) {
    const s = container.scale;
    let x = canvas.width * s * 0.5;
    let y = canvas.height * s * 0.5;

    for ( let i = 0; i < num; ++i ) {
      particles.push( new Particle( i, x, y ) );
      x += kRadius / 2.5;

      if ( x > canvas.width * ( 1 - s * 0.5 ) ) {
        x = canvas.width * s * 0.5;
        y += kRadius / 3;
      }
    }

    grid.fill( particles );
  }

  initParticles( 1200 );

  // animation loop
  const run = () => {
    requestAnimationFrame( run );
    ctx.fillStyle = "#bebebf";
    ctx.fillRect( 0, 0, canvas.width, canvas.height );
    pointer.ease( 0.1 );
    container.rotate();

    for ( let p of particles ) {
      p.integrate();
    }

    grid.update( particles );
    ctx.beginPath();
    ctx.strokeStyle = "#556";

    for ( let p of particles ) {
      p.fluid();
    }

    ctx.stroke();
    sun.anim();
  };

  run();
} );



</script>
<template lang="pug">

.container
  .row
    .col
      canvas(ref="canvasRef")

</template>
<style lang="scss" scoped>
canvas{
  width: 100%;
  height: auto;
}
</style>
