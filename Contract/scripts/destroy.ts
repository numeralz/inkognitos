

import hre, { getChainId } from "hardhat";
import { importDeployments } from "utils/utils";
import { Airdrop, InkognitosInk, InkognitosNFT, InkognitosRoyaltySplitter, InkUsed } from "../typechain";

const {
  upgrades,
  ethers,
} = hre;


async function main() {
  const [
    deployer, verifier, user,
  ] = await hre.ethers.getSigners();

  const {
    deployed,
  } = await importDeployments( {
    chainId : await getChainId(),
  } );

  console.log( deployed );
  
  const $ = (
    await Promise.allSettled( [
      ...Object.keys( deployed )
      .map( async ( name )=>{
        const { abi, address, } = deployed[name];
        return {
          name,
          contract : await hre.ethers.getContractAt( abi, address ),
        };
      } ),
    ] )
  )
  .filter( x=>x.status === "fulfilled" )
  .map( x=>x.status === "fulfilled" ? x.value : null )
  .reduce( (
    $,
    { name, contract, }
  ) => {
    $[name] = contract.connect( deployer );
    return $;
  }, {} as any ) as {
    InkognitosInk: InkognitosInk,
    InkognitosNFT: InkognitosNFT,
    InkognitosRoyaltySplitter: InkognitosRoyaltySplitter,
    InkUsed: InkUsed,
    Airdrop: Airdrop,
  };

  console.log( $ );
  
  const destroyed:any = {};

  for( const [
    name, c,
  ] of Object.entries( $ ) ){
    if( !( <any>c ).dev_destroy ) {continue;}
    try{
      const res = await ( await ( <InkognitosInk>c ).dev_destroy( {
        gasLimit : 100000,
      } ) ).wait();

      destroyed[name] = res.status;
    }catch( err:any ){
      console.log( `Skip destroy ${ name }` );
      console.log( err.message );
    }
  }

  console.log( destroyed );
}


main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
} );

