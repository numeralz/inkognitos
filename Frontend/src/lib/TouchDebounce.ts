
export class TouchDebounce{
  counter  = 0;
  handler: ( num:number )=>void = ()=>null;
  timeout = 0;

  constructor( handler: ( n:number )=>void ){
    this.handler = handler;
  }

  tap( num:number ){
    this.counter = Math.max(
      num,
      this.counter
    );

    if( this.timeout ){
      clearTimeout( this.timeout );
    }

    this.timeout = window.setTimeout(
      ()=>this.finish(),
      20
    );
  }

  finish(){
    this.handler?.( this.counter );
    this.counter = 0;
  }
}