import { BigNumber, BigNumberish } from "ethers";
import { utils } from "ethers";
import { TinyEmitter } from "tiny-emitter";
import type { RouteLocationRaw, Router } from "vue-router";
export function roundNearest( n: number, nearest: number ) {
  return Math.round( n / nearest ) * nearest;
}
export interface Field<T=string> {
  value0: T,
  value: T,
  isLoading: boolean,
  isInvalid: boolean,
}
export function useField( value?:any ): Field{
  const field = reactive<Field<string>>( {
    value0    : "",
    value     : "",
    isLoading : false,
    isInvalid : false,
  } );

  return field;
}
export const TAO = Math.PI * 2;
export function format( val: BigNumberish, units = "ether", decimals = 4 ){
  return Number( utils.formatUnits( val, units ) ).toFixed( decimals );
}
export function interp( val:number, min:number, max:number ){
  return min + ( max - min ) * val;
}
export function clamp( val: number, min: number, max: number ) {
  return Math.min( Math.max( val, min ), max );
}
export function numberWheel( e:WheelEvent, factor = 1 ) {
  return Math.sign( e.deltaY ) * factor;
}
export function bigMax(  ...nums: BigNumberish[] ) {
  return nums.reduce( ( $, n ) => {
    const N = BigNumber.from( n );

    if( !$ || N.gt( $ ) ) {
      return N;
    }

    return $;
  }, null as BigNumber|null ) as BigNumber;
}
export function timeAgo( v ){
  const val = useTimeAgo( new Date( v ) );
  return val.value;
}
export function bigMin(   ...nums: BigNumberish[] ) {
  return nums.reduce( ( $, n ) => {
    const N = n instanceof BigNumber ? n : BigNumber.from( n );

    if( !$ || N.lt( $ ) ) {
      return N;
    }

    return $;
  }, null as BigNumber|null ) as BigNumber;
}
export function bigClamp( value: BigNumberish, min: BigNumberish, max: BigNumberish ) {
  return BigNumber.from(
    BigNumber.from( min ).gt( value ) ? min :
      BigNumber.from( max ).lt( value ) ? max :
        value
  );
}
export class Snoozer{
  private timeout: any;

  private callback?: () => void;

  reset( timeout = 1000 ){
    if( this.timeout ) {
      clearTimeout( this.timeout );
    }

    if( !timeout ) {
      return;
    }

    this.timeout = setTimeout( () => {
      console.log( "snoozer tick" );
      this.callback?.();
    }, timeout );
  }

  snooze( cb: () => void, timeout = 1000 ) {
    this.callback = cb;
    this.reset( timeout );
  }
}
export interface ModalProps {
  text: string;
  action: () => void;
  clas?: string[] | string | Record<string, any>;
}
export function openErrorModal( title: string, message?: string, actions:any[] = [] ):Promise<void>{
  return new Promise( ( resolve, reject )=>{
    const el = document.createElement( "div" );

    el.style.zIndex = "10000";

    const emitter = new TinyEmitter();

    emitter.on( "close", () => {
      console.log( "X" );
      resolve();
    } );

    const modal = createApp( defineAsyncComponent( {
      loader : () => import( "$/components/ModalBox.vue" ),
    } ), {
      emitter,
      value : true,
      title,
      text  : message,
      actions,
    } );
    
    const modalsTarget = document.getElementById( "modals" );

    if( !modalsTarget ){
      reject( "Could not open modal" );

      return;
    }

    modalsTarget.appendChild( modal.mount( el ).$el );

    return modal;
  } );
}
export function parseErrorMessage( err:any ){
  if( typeof err === "string" ){
    return err;
  }

  try{
    const json = ( err.message ).match( /'({.+?})'/ )?.[1];

    if( !json ){
      return "";
    }
    
    const json2 = JSON.parse( json ) ;

    console.log( json2 );

    const err2 = json2.value || json2;

    console.log( err2 );

    const message = err2?.data?.message;
    return message;
  }catch( _ ){
    console.log( {
      err,
      _,
    } );

    const reason = ( err.reason )?.match( /with reason string '(.+)'/ )?.[1];
    return reason || err.reason || err.message;
  }
}
export function loadScript( src:string ){
  return new Promise( ( resolve, reject ) => {
    const script = document.createElement( "script" );

    script.onload = () => {
      resolve( script );
    };
    script.crossOrigin = "anonymous";
    script.type = "text/javascript";
    document.head.appendChild( script );
  } );
}
export function OpenNewTab( $router: Router,  url: RouteLocationRaw  ) {
  if( typeof window === "undefined" ) {
    return;
  }

  window.open( $router.resolve( url ).href, "_blank" );
}

const SQRT5 = Math.sqrt( 5 );

export function getPhi( n:number ){
  return Math.pow( ( 1 + SQRT5 ) / 2, n  );
}

const SI_SYMBOL = [
  "", "K", "M", "B", "T",
];

export function abbreviateNumber( n:BigNumberish = 0 ){
  const tier = Math.min( SI_SYMBOL.length - 1, Math.log10( Math.abs( Number( n || 0 ) ) ) / 3 | 0 );

  if( !tier ) {
    return ( n || 0 ).toString();
  }

  const suffix = SI_SYMBOL[tier];
  const scale = Math.pow( 10, tier * 3 );
  const scaled = Number( n ) / scale;
  return scaled.toFixed( 1 ) + suffix;
}
export function safeUrl( url: string ) {
  const url_ = new URL( url );
  return url_.protocol === "ipfs:"
    ? `https://ipfs.io/ipfs/${ url_.pathname.slice( 2 ) }`
    : url_.toString();
}
