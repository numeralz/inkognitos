/* eslint-disable no-underscore-dangle */

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Airdrop, Airdrop__factory, InkognitosInk, InkognitosInk__factory, InkognitosNFT, InkognitosNFT__factory, InkognitosRoyaltySplitter, InkognitosRoyaltySplitter__factory, INKStudioPass, INKStudioPass__factory, InkUsed, InkUsed__factory } from "../typechain";

import chalk from "chalk";
import { formatEther } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
import { exportDeployments, HEADER, importDeployments, TABLE } from "../utils/utils";
import { setupInk } from "utils/utils";


const func = async ( hre:HardhatRuntimeEnvironment ) =>{
  const [
    deployer,
  ] = await hre.ethers.getSigners();

  HEADER(
    `Deploy`
  );

  const {
    getChainId,
    artifacts:{
      readArtifact,
    },
    ethers: {
      getContractFactory,
      getContractAt,
      getContract,
      getContractOrNull,
    },
    upgrades: {
      upgradeProxy,
      deployProxy,
      erc1967,
    },
    deployments:{
      fetchIfDifferent,
      deploy,
      getArtifact,
      save,
    },
  } = hre;

  const chainId = await getChainId();

  
  const balance = await deployer.getBalance();

  TABLE( {
    Chain    : `${ chainId }`,
    Deployer : `${ deployer.address }`,
    Balance  : `Ξ ${ formatEther( ( balance ) ).padStart( 10, " " ) }`,
  } );
  
  /*
  -------------------------------------
  InkognitosInk
  -------------------------------------
  */
  const ink_ = await (
    await upgrades.deployProxy(
      await ethers.getContractFactory( "InkognitosInk", deployer ) as InkognitosInk__factory,
      [
        deployer.address,
        "InkognitosInk",
        "INK",
      ]
    )
  ).deployed() as InkognitosInk;

  
  console.log( chalk.whiteBright( `INK: ${ ink_.address }` ) );

  await save( "InkognitosInk", {
    address : ink_.address,
    abi     : InkognitosInk__factory.abi,
  } );

  const $ink = <InkognitosInk>await ethers.getContractAt(
    "InkognitosInk",
    ink_.address
  );

  /*
  -------------------------------------
  InkognitosNFT
  -------------------------------------
  */
  const nft_ = await (
    await upgrades.deployProxy(
      await ethers.getContractFactory( "InkognitosNFT", deployer ) as InkognitosNFT__factory,
      [
        deployer.address,
      ]
    )
  ).deployed() as InkognitosNFT;

  console.log( chalk.whiteBright( `NFT: ${ nft_.address }` ) );

  
  await save( "InkognitosNFT", {
    address : nft_.address,
    abi     : InkognitosNFT__factory.abi,
  } );
  
  const $nft = <InkognitosNFT>await ethers.getContractAt(
    "InkognitosNFT",
    nft_.address
  );

  /*
  -------------------------------------
  InkognitosRoyaltySplitter
  -------------------------------------
  */
  const splitter_ = await ( await ( await ethers.getContractFactory(
    "InkognitosRoyaltySplitter",
    deployer
  ) as InkognitosRoyaltySplitter__factory ).deploy() ).deployed();

  console.log( chalk.whiteBright( `ROY: ${ splitter_.address }` ) );

  await save( "InkognitosRoyaltySplitter", {
    address : splitter_.address,
    abi     : InkognitosRoyaltySplitter__factory.abi,
  } );
  
  const $splitter = <InkognitosRoyaltySplitter>await ethers.getContractAt(
    "InkognitosRoyaltySplitter",
    splitter_.address
  );
  

  /*
  -------------------------------------
  InkUsed
  -------------------------------------
  */
  const inkUsed_ = await (
    await upgrades.deployProxy(
      await ethers.getContractFactory( "InkUsed", deployer ) as InkUsed__factory,
      [
        deployer.address,
        $nft.address,
      ]
    )
  ).deployed() as InkUsed;

  
  console.log( chalk.whiteBright( `USE: ${ inkUsed_.address }` ) );

  await save( "InkUsed", {
    address : inkUsed_.address,
    abi     : InkUsed__factory.abi,
  } );

  const $inkUsed = await ethers.getContractAt(
    "InkUsed",
    inkUsed_.address
  );
  

  /*
  -------------------------------------
  Airdrop
  -------------------------------------
  */
  const airdrop_ = await (
    await new Airdrop__factory().connect( deployer ).deploy()
  ).deployed() as Airdrop;

  console.log( chalk.whiteBright( `AIR: ${ airdrop_.address }` ) );


  await save( "Airdrop", {
    address : airdrop_.address,
    abi     : Airdrop__factory.abi,
  } );

  const $air = await ethers.getContractAt(
    "Airdrop",
    airdrop_.address
  );


  /* Pass */
  const pass_ = <INKStudioPass>await (
    await upgrades.deployProxy(
      await ethers.getContractFactory( "INKStudioPass", deployer ) as INKStudioPass__factory,
      [
        deployer.address,
      ]
    )
  ).deployed();

  console.log( chalk.whiteBright( `PASS: ${ pass_.address }` ) );

  await save( "INKStudioPass", {
    address : pass_.address,
    abi     : INKStudioPass__factory.abi,
  } );

  const $pass = await ethers.getContractAt<INKStudioPass>(
    "INKStudioPass",
    pass_.address
  );
  
  await exportDeployments( { chainId,
    deployed : {
      InkognitosInk : {
        address : $ink.address,
        abi     : InkognitosInk__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
      INKStudioPass : {
        address : $pass.address,
        abi     : INKStudioPass__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
      InkognitosNFT : {
        address : $nft.address,
        abi     : InkognitosNFT__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
      InkognitosRoyaltySplitter : {
        address : $splitter.address,
        abi     : InkognitosRoyaltySplitter__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
      InkUsed : {
        address : $inkUsed.address,
        abi     : InkUsed__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
      Airdrop : {
        address : $air.address,
        abi     : Airdrop__factory.createInterface().format(
          ethers.utils.FormatTypes.full
        ),
      },
    }, } );

  
  const {
    deployed,
  } = await importDeployments( {
    chainId : await getChainId(),
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

  await setupInk( ink_ );
};

func.tags = [
  "all",
];

export default func;
