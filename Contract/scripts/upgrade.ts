import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UpgradeProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import chalk from "chalk";
import { Signer } from "ethers";
import { formatEther } from "ethers/lib/utils";
import hre, { getChainId } from "hardhat";
import { exportDeployments, HEADER, importDeployments, TABLE } from "utils/utils";
import { Airdrop, InkognitosInk, InkognitosInk__factory, InkognitosNFT, InkognitosNFT__factory, InkognitosRoyaltySplitter, INKStudioPass, INKStudioPass__factory, InkUsed } from "../typechain";

const {
  upgrades,
  deployments,
  ethers,
  run,
  config,
  tracer,
} = hre;

async function main() {
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

  // console.log( Object.keys( $ ) );

  // return;

  // console.log( "Upgrade INK" );
  // await upgradeINK( {
  //   deployer,
  //   old  : $.InkognitosInk,
  //   opts : {
  //     timeout : 600000,
  //     // call    : {
  //     //   fn   : "initialize2",
  //     //   args : [
  //     //     "Inkognitos-Ink",
  //     //     "INK",
  //     //   ],
  //     // },
  //   },
  // } );
  
  // console.log( "Upgrade NFT" );
  // await upgradeNFT( {
  //   deployer,
  //   old  : $.InkognitosNFT,
  //   opts : {
  //     timeout : 600000,
  //     // call    : {
  //     //   fn   : "initialize2",
  //     //   args : [],
  //     // },
  //   },
  // } );

  // return;

  // console.log( "Deploy PASS" );
  // $.INKStudioPass = await deployPass( $ );

  HEADER( "Upgrade PASS" );
  $.INKStudioPass = <INKStudioPass>await (
    await upgrades.upgradeProxy(
      $.INKStudioPass,
      await ethers.getContractFactory( "INKStudioPass", deployer ) as INKStudioPass__factory,
      {
        timeout : 600000,
        
      }
    )
  ).deployed();
  
  await exportDeployments( {
    chainId,
    deployed : {
      INKStudioPass : {
        address : $.INKStudioPass.address,
        abi     : INKStudioPass__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
    },
  } );
  
  // await ( await $.InkognitosNFT.set_refPassContract( $.INKStudioPass.address ) ).wait();

  // await ( await $.INKStudioPass.setImageURI( "https://test.decentfactory.xyz/img/pass5.svg" ) ).wait();

  // await $.InkognitosNFT.set_contractURI( "data:application/json,{\"name\":\"Inkognitos\",\"description\":\"Community-driven%20NFT%20art%20factory.\",\"external_link\":\"https://inkognitos.decentfactory.xyz\"}" );
}

async function deployPass( $ ){
  const [
    deployer,
  ] = await hre.ethers.getSigners();
  
  const name = "INKStudioPass";
  const deployed = <INKStudioPass>await (
    await upgrades.deployProxy(
      await ethers.getContractFactory( name, deployer ) as INKStudioPass__factory,
      [
        deployer.address,
      ]
    )
  ).deployed();

  console.log( chalk.whiteBright( `PASS: ${ deployed.address }` ) );

  await deployments.save( name, {
    address : deployed.address,
    abi     : INKStudioPass__factory.abi,
  } );

  return await ethers.getContractAt<INKStudioPass>(
    name,
    deployed.address
  );
}


async function upgradeNFT( { deployer, old, opts, }:{deployer:SignerWithAddress, old:InkognitosNFT, opts?: UpgradeProxyOptions} ){
  const name = "InkognitosNFT";
  HEADER( `Upgrade ${ name }` );

  const deployed = <typeof old>await (
    await upgrades.upgradeProxy(
      old,
      await ethers.getContractFactory( name, deployer ) as InkognitosNFT__factory,
      opts
    )
  ).deployed();
  
  await deployments.save( name, {
    address : deployed.address,
    abi     : InkognitosNFT__factory.abi,
  } );
}

async function upgradeINK( { deployer, old, opts, }:{deployer:SignerWithAddress, old:InkognitosInk, opts?: UpgradeProxyOptions} ){
  const name = "InkognitosInk";
  HEADER( `Upgrade ${ name }` );

  const deployed = <typeof old>await (
    await upgrades.upgradeProxy(
      old,
      await ethers.getContractFactory( name, deployer ) as InkognitosInk__factory,
      opts
    )
  ).deployed();
  
  await deployments.save( name, {
    address : deployed.address,
    abi     : InkognitosInk__factory.abi,
  } );
}

main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
} );

