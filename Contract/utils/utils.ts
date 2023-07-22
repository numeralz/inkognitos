import { BaseContract, BigNumber, BigNumberish, Signer, utils } from "ethers";
import { Contract, ContractFactory, ContractInterface } from "@ethersproject/contracts";
import { InkognitosInk, InkognitosNFT } from "../typechain";
import { blue, bold, underline } from "chalk";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { formatEther, formatUnits, keccak256, parseEther, verifyTypedData } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { TypedDataDomain } from "@ethersproject/abstract-signer";
import chalk from "chalk";

export function writeJson<T=any>( file: string, data: T ) {
  try {
    const json = JSON.stringify( data, null, 2 );

    writeFileSync( resolve( file ), json, {
      encoding : "utf-8",
    } );
    return true;
  } catch ( e ) {
    return false;
  }
}

export function readJson<T=any>( file: string ) {
  try {
    mkdirSync( dirname( file ), {
      recursive : true,
    } );
    const json = readFileSync( resolve( file ), {
      encoding : "utf-8",
    } );
    const data = JSON.parse( json );

    return data as T;
  } catch ( e ) {
    return null;
  }
}

export function HEADER( ...s ){
  return console.log(
    ...s.map( s=>{
      const len = s.length;
      return chalk.bold.bgBlack.whiteBright( `${ " ".repeat( len + 4 ) }${ chalk.underline( `\n  ${ s }  \n` ) }` );
    } )
  );
}

export function NUM( s:number|string ){
  return chalk.hex( "#FF7700" ).bold( ( s ).toString() );
}

export function TABLE( o:any ){
  console.log(
    chalk.dim(
      "-".repeat( 40 )
    )
  );
  console.log( Object.entries( o ).map( ( [
    key, val,
  ] )=>{
    return [
      `${ chalk.dim( key.padStart( 20 ) ) }`, chalk.bold( String( val ) ),
    ].join( " : " );
  } ).join( "\n" ) );
}

export function BAD( s:string ){
  return chalk.hex( "#FF9999" ).underline.bold( `${ s }` );
}

export function WARN( s:string ){
  return chalk.hex( "#FFAA99" ).underline.bold( `${ s }` );
}

export function GOOD( s:string ){
  return chalk.hex( "#99FF99" ).underline.bold( `${ s }` );
}

export function prettyAddress( s0:string ){
  const s = s0.toLowerCase();
  return chalk.white( `${ chalk.dim( " @:" ) + chalk.bold( `${ s.slice( 0, 8 ) }⋯${ s.slice( -6 ) }` ) } ` );
}

export function prettyToken( s:BigNumberish ){
  return chalk.white( `${ chalk.dim( " #:" ) + chalk.bold( s.toString() ) } ` );
}

export function ensureUnique<K=any>( uniqueOwners:Map<K, true>, key:K ){
  if( uniqueOwners.has( key ) ){
    return false;
  }
  uniqueOwners.set( key, true );
  return true;
}

export async function impersonateSigner( address:string, cb:( signer: Signer )=>Promise<any> ){
  /* Impersonate account */
  await hre.network.provider.request( {
    method : "hardhat_impersonateAccount",
    params : [
      address,
    ],
  } );

  /* Impersonate transaction */
  await cb( await ethers.getSigner( address ) );

  /* Stop impersonating */
  await hre.network.provider.request( {
    method : "hardhat_stopImpersonatingAccount",
    params : [
      address,
    ],
  } );
}

// export async function deployContract( name:string ){
//   const art = hre.artifacts.readArtifactSync( name );
//   const F = await ethers.getContractFactory( art.contractName );
//   const C = await F.deploy();
//   await C.deployed();
//   // updateDeployment( name, C, deployJson );
//   return C;
// }

export function LogTable( o:Record<string, any> ){
  console.log();

  const keyWidth = Object.keys( o ).reduce( ( max, key ) => Math.max( max, key.length ), 0 );
  
  console.log(
    Object.entries( o ).map( ( [
      key, val,
    ] ) => {
      return [
        chalk.dim(
          key.padEnd( keyWidth )
        ),
        String( val ).padStart( 80 - keyWidth ),
      ].join( " : " );
    } ).join( "\n" )
  );
}


export function updateDeployment( name: string, C:Contract, DEPLOY_JSON: string ){
  const chainId =  hre.network.config.chainId || 0;

  const txn = C.deployTransaction;

  console.log( blue( `
    == ${ name } ==
    Chain:          ${ bold( chainId ) }
    Contract:       ${ ethscanAddr( chainId )( C.address ) }
    Transaction:    ${ underline( ethscanTxn( chainId )( txn.hash ) ) }
    Deployer:       ${ underline( ethscanAddr( chainId )( txn.from ) ) }
    Block:          ${ txn.blockHash } ${ txn.blockNumber }
    Gas used:       ${ txn.gasLimit.toString() }` ) );
}

const CHAIN_SUBDOMAIN = {
  1    : "https://etherscan.io",
  3    : "https://ropsten.etherscan.io",
  4    : "https://rinkeby.etherscan.io",
  1337 : "HARDHAT",
  1338 : "HARDHAT",
};
export const ethscanTxn = ( chainId: number ) => ( v?: string ) => v && `${ ( CHAIN_SUBDOMAIN[chainId] ) }/tx/${ v }`;
export const ethscanAddr = ( chainId: number ) => ( v?: string ) => v && `${ ( CHAIN_SUBDOMAIN[chainId] ) }/address/${ v }`;
export const dapp = ( chainId: number ) => ( v?: string ) => v && `${ ( CHAIN_SUBDOMAIN[chainId] ) }/dapp/${ v }`;


export async function exportDeployments ( { chainId, deployed = {}, }: { chainId; deployed?: any; } ) {
  HEADER( "Export Deployments" );
  /* Write deployments */
  
  const deployed_ = readJson( `./deployed/deployed-${ chainId }.json` );

  writeJson( `./deployed/deployed-${ chainId }.json`, {
    ...deployed_,
    ...deployed,
  } );
  
  try {
    cpSync(
      `./deployed/deployed-${ chainId }.json`,
      `../Backend/src/deployed/deployed-${ chainId }.json`,
      {
        errorOnExist : false,
        force        : true,
      }
    );
  } catch ( err: any ) {
    console.log( err );
  }
}

export async function importDeployments ( { chainId, }: { chainId: string|number } ) {
  HEADER( "Import Deployments" );
  /* Write deployments */

  const deployed = readJson( `./deployed/deployed-${ chainId }.json` );

  return {
    deployed,
  };
}


export async function setupInk( $Ink: InkognitosInk, scaling = 1 ) {
  HEADER( "Setup INK" );
  const [
    deployer,
  ] = await hre.ethers.getSigners();

  const tokenId = 0;
  /* Free white */
  {
    const tx = await ( await $Ink.updateTokenMeta(
      "0xFFFFFF",
      0,
      0
    ) ).wait();
    TABLE( {
      action   : `Init white`,
      gasUsed  : tx.gasUsed,
      gasTotal : tx.cumulativeGasUsed,
      txHash   : tx.transactionHash,
    } );
  }
  
  {
    const tx = await ( await $Ink.updateTokenMeta(
      "0x000000",
      "1000000000",
      parseEther( "0.000001" )
    ) ).wait();
    TABLE( {
      action   : `Init black`,
      gasUsed  : tx.gasUsed,
      gasTotal : tx.cumulativeGasUsed,
      txHash   : tx.transactionHash,
    } );
  }

  const gray = new Array( 6 + 2 ).fill( 0 ).map( ( _, i, a ) => {
    if( i === 0 || i === a.length - 1 ){return;}
    return hslToHex( 0, 0, i / a.length );
  } ).filter( Boolean );
  
  const colors = new Array( 6 * 2 ).fill( 0 ).map( ( _, i, a ) => {
    return hslToHex( ( 360 * i / a.length ), 0.9, 0.7 );
  } );

  /* Prepare colors */
  const tokens = (
    [
      ...gray,
      ...colors,
      // "0x423553",
      // "0x264945",
      // "0x873827",
      // "0x1c1abb",
      // "0x682244",
      // "0xb0b7b0",
      // "0x842c90",
      // "0x0f7689",
      // "0xd41208",
      // "0x264cf9",
      // "0xb03262",
      // "0xc1b992",
      // "0xa88ecd",
      // "0x53d5a5",
      // "0xf66061",
      // "0x79a9fb",
      // "0xf22c79",
      // "0xe2d891",
      // "0xcecbe8",
      // "0xcdead6",
      // "0xead3cd",
      // "0xd7e5ff",
      // "0xead7ea",
    ].map( DEC=>{
      const hex = DEC.replace( "0x", "#" );
      const rgb = hexToRGB( hex );
      const hsb = RGBToHSB( rgb );
    
      const value = getValue( {
        hsb,
      } );

      const price = getPrice( value ).div( 1 / scaling );
      const amt = BigNumber.from( "100000000" ).div( 1 + Math.floor( 10 * Math.pow( value, 3 ) ) );
    
      return {
        DEC,
        hex,
        rgb,
        hsb,
        value,
        price,
        amt,
      };
    } ).sort( ( a:any, b:any ) => {
      return ( a.value < b.value )
        ? -1 : ( a.value > b.value )
          ? 1 : 0;
    } )
  );

  let total = BigNumber.from( 0 );

  /* Deploy Tokens */
  for( let t = 0; t < tokens.length; t++ ){
    const token = tokens[ t ];
    total = total.add(
      token.amt.mul( token.price )
    );
    try{
      const exists = await $Ink.callStatic.exists( token.DEC );
      if( exists ){
        console.log( `Token exists ${ token.hex }` );
        continue;
      }
    }catch( err ){
      // does not exist
      
    }

    console.log( `Setup ${ token.hex }` );
    try{
      const tx = await ( await $Ink.updateTokenMeta(
        token.DEC,
        token.amt,
        token.price
      ) ).wait();

      TABLE( {
        action   : `${ t } Init ${ token.hex }`,
        gasUsed  : tx.gasUsed,
        gasTotal : tx.cumulativeGasUsed,
        txHash   : tx.transactionHash,
        balance  : `Ξ ${ formatEther( ( await deployer.getBalance() ) ).padStart( 10, " " ) }`,
      } );
    }catch( err ){
      console.log( err );
    }
  }

  
  console.log( tokens.map( t=>(
    Object.entries( {
      C   : chalk.hex( t.hex )( t.hex ),
      SUP : ( t.amt ).toString(),
      ETH : formatEther( t.price ),
    } )
    .map(
      ( [
        key, val,
      ] )=>[
        chalk.dim( key ), val,
      ].join( ":" ).padEnd( 30 )
    ).join( " " )
  ) ).join( "\n" ) );

  console.log( `Total ETH: ${ formatUnits( total, "ether" ) }` );
}


function getValue( item:any ){
  if( !item.hsb ) {
    return 0;
  }

  return ( ( 0.5 * 1 + Math.pow( 1 + Math.cos( Math.PI * item.hsb.H / 180 ), 1 + ( item.hsb.S ) / 100 * ( item.hsb.B / 100 ) ) ) ) * ( item.hsb.B / 100 ) * ( item.hsb.S ) / 100 ;
}

function getPrice( value:number ){
  return parseEther( ( 0.0001 + 0.0005 * Math.pow( value, 3 ) ).toFixed( 6 ) );
}


export function hslToHex( h: number, s: number, l: number ) {
  const a = s * Math.min( l, 1 - l );

  const f = n => {
    const k = ( n + h / 30 ) % 12;
    const color = l - a * Math.max( Math.min( k - 3, 9 - k, 1 ), -1 );
    return Math.round( 255 * color ).toString( 16 ).padStart( 2, "0" );
  };

  return `0x${ `${ f( 0 ) }${ f( 8 ) }${ f( 4 ) }`.toUpperCase() }`;
}


// eslint-disable-next-line complexity
export function hexToRGB( hex:string ) {
  let alpha = false;
  let h = hex.slice( hex.startsWith( "#" ) ? 1 : ( hex.startsWith( "0x" ) ? 1 : 0 ) );

  if ( h.length === 3 ) {
    h = [
      ...h,
    ].map( x => x + x ).join( "" );
  } else if ( h.length === 8 ) {
    alpha = true;
  }

  const X = parseInt( h, 16 );
  return {
    r : X >>> ( alpha ? 24 : 16 ),
    g : ( X & ( alpha ? 0x00ff0000 : 0x00ff00 ) ) >>> ( alpha ? 16 : 8 ),
    b : ( X & ( alpha ? 0x0000ff00 : 0x0000ff ) ) >>> ( alpha ? 8 : 0 ),
    a : alpha ? X & 0x000000ff : 1,
  };
}


export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSB {
  H: number;
  S: number;
  B: number;
  a?: number;
}

export function HSBToRGB( {
  H, S, B, a,
}: HSB ) {
  S /= 100;
  B /= 100;

  const k = ( n: number ): number => ( n + H / 60 ) % 6;
  const f = ( n: number ): number => B * ( 1 - S * Math.max( 0, Math.min( k( n ), 4 - k( n ), 1 ) ) );

  const [
    r, g, b,
  ] = [
    255 * f( 5 ), 255 * f( 3 ), 255 * f( 1 ),
  ];

  return {
    r, g, b, a,
  } as RGB;
}

export function RGBToHSB( {
  r, g, b, a,
}: RGB ) {
  r /= 255;
  g /= 255;
  b /= 255;

  const v = Math.max( r, g, b ), n = v - Math.min( r, g, b );
  const h = n === 0 ? 0 : n && v === r ? ( g - b ) / n : v === g ? 2 + ( b - r ) / n : 4 + ( r - g ) / n;

  const [
    H, S, B,
  ] = [
    60 * ( h < 0 ? h + 6 : h ), v && ( n / v ) * 100, v * 100,
  ];

  return {
    H, S, B, a,
  } as HSB;
}

export interface PermitRequest {
  author: string,
  imageHash: string,
  timestamp: number,
  tokensUsed: Record<number, number>,
  contract: BaseContract,
  verifier: SignerWithAddress,
  chainId: string;
}


export async function getPermit( {
  author,
  imageHash,
  timestamp,
  tokensUsed,
  contract,
  verifier,
  chainId,
}: PermitRequest ) {
  const domain: TypedDataDomain = {
    name              : "SubmitPermit",
    chainId,
    version           : "1",
    verifyingContract : contract.address,
  };

  console.log( {
    name              : domain.name,
    chainId           : domain.chainId.toString(),
    version           : domain.version,
    verifyingContract : domain.verifyingContract,
  } );


  const types = {
    SubmitPermit : [
      { name : "author", type : "address", },
      { name : "imageHash", type : "uint256", },
      { name : "timestamp", type : "uint256", },
      { name : "inkIds", type : "uint256[]", },
      { name : "inkQtys", type : "uint256[]", },
    ],
  };

  // const svgHash = keccak256( Buffer.from( imageData ) );
  const inkIds = Object.keys( tokensUsed ).map( v => BigNumber.from( v ).toHexString() );
  const inkQtys = Object.values( tokensUsed ).map( v => BigNumber.from( v ).toHexString() );

  const message: InkognitosNFT.SubmitPermitStruct = {
    author : author.toLowerCase(),
    imageHash,
    timestamp,
    inkIds,
    inkQtys,
  };

  const signature = await verifier._signTypedData( domain, types, message );
  const verified = verifyTypedData( domain, types, message, signature );

  if ( verified !== verifier.address ) {
    throw new Error( "Verification sanity check failuire " );
  }

  return {
    signature,
    permit : message,
  };
}


export function getInterfaceID( contractInterface: utils.Interface ) {
  // const contractInterface = factory.interface;
  let interfaceID: BigNumber = ethers.constants.Zero;
  const functions: string[] = Object.keys( contractInterface.functions );
  for ( let i = 0; i < functions.length; i++ ) {
    interfaceID = interfaceID.xor( contractInterface.getSighash( functions[i] ) );
  }

  return interfaceID.toHexString();
}