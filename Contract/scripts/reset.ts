import hre from "hardhat";

async function main(){
  const {
    deployments:{
      delete: deleteDeployment,
    },
  } = hre;

  console.log(
    "InkognitosNFT"
  );
  await deleteDeployment( "InkognitosNFT" );
  console.log(
    "InkognitosInk"
  );
  await deleteDeployment( "InkognitosInk" );
  console.log(
    "InkognitosRoyaltySplitter"
  );
  await deleteDeployment( "InkognitosRoyaltySplitter" );
}

main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
} );