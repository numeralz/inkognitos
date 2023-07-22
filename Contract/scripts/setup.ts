
import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { BigNumber, ContractTransaction } from "ethers";
import { formatEther } from "ethers/lib/utils";
import hre, { deployments, getChainId } from "hardhat";
import { Airdrop, InkognitosInk, InkognitosNFT, INKStudioPass, InkognitosRoyaltySplitter, InkUsed } from "typechain";
import { getPermit, HEADER, importDeployments, setupInk, TABLE } from "utils/utils";

async function main(){
  const [
    deployer,
  ] = await hre.ethers.getSigners();
  
  const {
    deployed,
  } = await importDeployments( {
    chainId : await getChainId(),
  } );
  

  console.log( deployed );
  

  const chainId = await getChainId();

  
  const balance = await deployer.getBalance();

  TABLE( {
    Chain    : `${ chainId }`,
    Deployer : `${ deployer.address }`,
    Balance  : `Ξ ${ formatEther( ( balance ) ).padStart( 10, " " ) }`,
  } );


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
    INKStudioPass: INKStudioPass,
    InkognitosRoyaltySplitter: InkognitosRoyaltySplitter,
    InkUsed: InkUsed,
    Airdrop: Airdrop,
  };


  console.log( Object.entries( $ ).map( ( [
    key, c,
  ] )=> `${ key }: ${ c.address }` ) );
  
  // // // Setup
  await ( await $.InkognitosInk.set_refFactoryContract( $.InkognitosNFT.address ) ).wait();
  await ( await $.InkognitosNFT.set_refInkContract( $.InkognitosInk.address ) ).wait();
  await ( await $.InkognitosNFT.set_addrVerifier( "0x98f3eb85746a09e911BE0c701911739780009a20" ) ).wait();
  await ( await $.InkognitosNFT.set_refSplitter( $.InkognitosRoyaltySplitter.address ) ).wait();
  await ( await $.InkognitosNFT.set_refInkUsed( $.InkUsed.address ) ).wait();
  await ( await $.Airdrop.set_addrVerifier( "0x98f3eb85746a09e911BE0c701911739780009a20" ) ).wait();
  await ( await $.Airdrop.set_refInkContract( $.InkognitosInk.address ) ).wait();
  await ( await $.InkognitosNFT.set_royaltyFund( "0x87e5773b1393317f0686375fFBEF31467D8166Fe" ) ).wait();
  
  await ( await $.InkognitosNFT.set_refPassContract( $.INKStudioPass.address ) ).wait();
  await ( await $.INKStudioPass.setImageURI( "https://test.decentfactory.xyz/img/pass5.svg" ) ).wait();

  // ( await $.InkognitosInk.ownerMint( $.Airdrop.address, [
  //   0x000000,
  // ], [
  //   100000,
  // ] ) ).wait();


  await setupInk( $.InkognitosInk, 1 );
}

main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
} );