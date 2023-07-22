/**
 * ------------------------------------------------------------------------
 * Class Definitions
 * ------------------------------------------------------------------------
 */

export class RingBuffer<T=any>{
  /* https://stackoverflow.com/a/4774081 */

  writePtr = 0;
  readPtr = 0;

  buffer:T[] = new Array( this.length ).fill( null );
  numItems = 0;

  constructor( private length = 2048 ) {
  }
  
  // get( key:number ) {
  //   if ( key < 0 ) {
  //     return this.buffer[( this.readPtr + key ) % length];
  //   } else if ( typeof key !== "number" ) {
  //     return this.buffer[this.readPtr - 1];
  //   } else {
  //     return this.buffer[key];
  //   }
  // }
  clear(){
    // this.buffer = new Array( length ).fill( null );
    this.readPtr = 0;
    this.writePtr = 0;
    this.numItems = 0;
  }

  isEmpty(){
    return this.numItems === 0;
  }

  push( item:T ) {
    this.buffer[this.writePtr] = item;
    this.writePtr = ( this.writePtr + 1 ) % length;
    
    if( this.numItems < this.length ){
      this.numItems++;
    }else{
      console.log( "Buffer full" );
      this.readPtr = ( this.readPtr + 1 ) % length;
    }

    return item;
  }

  readNext(){
    if( this.numItems === 0 ){
      return null;
    }

    const item = this.buffer[this.readPtr];

    this.readPtr = ( this.readPtr + 1 ) % length;
    this.numItems--;

    return item;
  }

  // prev() {
  //   const tmp_pointer = ( this.writePtr - 1 ) % length;

  //   if ( this.buffer[tmp_pointer] ) {
  //     this.writePtr = tmp_pointer;

  //     return this.buffer[this.writePtr];
  //   }
  // }

  // next() {
  //   if ( this.buffer[this.writePtr] ) {
  //     this.writePtr = ( this.writePtr + 1 ) % length;

  //     return this.buffer[this.writePtr];
  //   }
  // }
}
export class FastQueueJs {
  private _queue:any[] = [];
  private _first = 0;
  private _limit = 0;

  constructor( sizeLimit = 1024 ) {
    this._limit = ~~sizeLimit;
    this._queue = [];
    this._first = 0;
  }

  enqueue( value:any ) {
    this._queue.push( value );
  }

  dequeue() {
    /**should throw if empty? */
    let out;

    if ( !this.isEmpty() ) {
      out = this._queue[this._first];
      this._first++;

      if ( this._first === this._limit ) {
        this.removeDequeued();
      }
    }

    return out;
  }

  removeDequeued() {
    const queue = this._queue;
    let l = queue.length;
    let i = this._first;

    while ( i > 0 ) {
      l--;
      i--;
      queue[i] = queue[l];
    }

    queue.length = queue.length - this._first;
    this._first = 0;
  }

  enqueueMany( list ) {
    if ( list.length ) {
      this._queue.push( ...list );
    }
  }

  dequeueMany( howMany ) {
    const l = this.getLength();

    if ( howMany <= l ) {
      const first = this._first;

      this._first += howMany;

      const out = this._queue.slice( first, first + howMany );

      if ( this._first >= this._limit ) {
        this.removeDequeued();
      }

      return out;
    } else {
      return this.flush();
    }
  }

  isEmpty() {
    return this.getLength() === 0;
  }

  flush() {
    if ( this.getLength() === 0 ) {
      return [];
    }

    this.removeDequeued();

    const queue = this._queue;

    this._queue = [];
    this._first = 0;

    return queue;
  }

  peek( n = 1 ) {
    if ( n === 1 ) {
      return this._queue[this._first];
    } else {
      const max = this._first + n;

      if ( max >= this._queue.length ) {
        return this._queue.slice( this._first );
      }

      return this._queue.slice( this._first, this._first + n );
    }
  }

  last( n = 1 ) {
    if ( n === 1 ) {
      return this._queue[this._queue.length - 1];
    } else {
      if ( n < this.getLength() ) {
        return this._queue.slice( this._queue.length - n ).reverse();
      }

      return this._queue.slice( this._first ).reverse();
    }
  }

  getLength() {
    return this._queue.length - this._first;
  }

  setLimit( sizeLimit ) {
    this._limit = !isNaN( sizeLimit ) ? ~~sizeLimit : 1024;
  }
}
