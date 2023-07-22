// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { cpSync } from "fs";
import hre from "hardhat";

async function main() {
  await hre.run( "compile", [
    "--force",
  ] );

  cpSync(
    "./typechain",
    "../Backend/src/typechain",
    {
      errorOnExist : false,
      force        : true,
      recursive    : true,
    }
  );
  cpSync(
    "./typechain",
    "../Frontend/typechain",
    {
      errorOnExist : false,
      force        : true,
      recursive    : true,
    }
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
.then( () => process.exit( 0 ) )
.catch( ( error ) => {
  console.error( error );
  process.exit( 1 );
} );

