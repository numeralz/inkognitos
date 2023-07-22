#!/usr/bin/env ts-node

import axios from 'axios';
import { randomBytes } from 'crypto';
import { mkdirSync, readdirSync, renameSync, writeFileSync } from "fs";
import minimist from "minimist";
import { dirname, format, join, parse, resolve } from "path";



(async function main(){
  const ARGS = minimist( process.argv.slice( 2 ) );
  const [CMD, ...PARAMS] = ARGS._;
  
  switch(CMD){
    case "rename":
      const {src} = {
        src: "./",
        ...ARGS
      } as any;
      renameImages(src);
    break;
    case "fake":
      const {num, dst} = {
        num: 10,
        dst: "./fake",
        ...ARGS
      } as any;
      getFakeImages(
        num,
        dst,
        formatTokenId
      );
    break;
    default:
      console.log("INVALID");
    break;
  }
})().then(( ...args:any )=>{ 

}).catch(( err )=>{
  console.trace(err);
});

export function renameImages(p:string){
  const dir = resolve( p );

  const files = readdirSync( dir )
  .filter( ( file ) => /(\.jpe?g|\.png|\.gif|\.svg)$/.test( file ) )
  .map( ( file ) => join( dir, file ) );

  console.log(`Found ${files.length} images...`);
  
  /* Rename */
  files.forEach( ( file, index ) => {
    // console.log( file );
    const p1 = parse( file );

    p1.base = "";
    p1.name = `${String( index ).padStart( 0, "0" )}`;

    console.log(
      file,
      format( p1 )
    );
    
    renameSync(
      file,
      format( p1 )
    );
  } );
}


export function formatTokenId( i:number|string ){
  return String( i ).padStart( 4, "0" );
}

export function parseTokenId( i:string ){
  return parseInt( i );
}

export function getFakeImages( n:number, dst:string, getFileName:( i:number )=>string ){
  for( let i = 0; i < n; i++ ){
    const fileName = getFileName( i );
    (
      async ()=>{
        try{
          const {
            data,
          } = await axios.request( {
            method       : "get",
            url          : `https://picsum.photos/128/128?t=${randomBytes( 10 ).toString( "hex" )}`,
            maxRedirects : 2,
            responseType : "arraybuffer",
          } );
          const dest = resolve( dst, fileName );
          mkdirSync( dirname( dest ), {
            recursive : true,
          } );
          writeFileSync( resolve( dst, fileName ), data );
        } catch( error ){
          console.error( error );
          process.exit( 1 );
        }
      }
    )();
  }
}
