
import hre, { deployments, getChainId } from "hardhat";
import { InkognitosInk, InkognitosNFT, InkognitosRoyaltySplitter } from "typechain";
import { getPermit } from "utils/utils";
async function main(){
  const [
    deployer, verifier, user,
  ] = await hre.ethers.getSigners();
  
  const { getContractFactory, } = hre.ethers;

  const deployed = {
    Ink : ( await getContractFactory( "InkognitosInk", deployer ) ).attach(
      ( await deployments.getOrNull( "InkognitosInk" ) ).address
    ) as InkognitosInk,
    NFT : ( await getContractFactory( "InkognitosNFT", deployer ) ).attach(
      ( await deployments.getOrNull( "InkognitosNFT" ) ).address
    ) as InkognitosNFT,
    Roy : ( await getContractFactory( "InkognitosRoyaltySplitter", deployer ) ).attach(
      ( await deployments.getOrNull( "InkognitosRoyaltySplitter" ) ).address
    ) as InkognitosRoyaltySplitter,
  };
  
  const tokenData = {
    imageData  : "<svg>Test</svg>",
    tokensUsed : {
      1 : 10,
      2 : 10,
      3 : 10,
    },
  };

  const {
    permit,
    signature,
  } = await getPermit( {
    author   : verifier.address,
    verifier,
    contract : deployed.NFT,
    chainId  : ( await getChainId() ).toString(),
    ...tokenData,
  } );

  
  await (
    await (
      deployed.NFT.connect( verifier ).mint(
        permit,
        signature
      )
    )
  ).wait( 1 );

}


main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
}
