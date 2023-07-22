
// env
import dotenv from "dotenv";
Object.assign( process.env, dotenv.config().parsed );

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solpp";
import { SolppConfig } from "@nomiclabs/hardhat-solpp/dist/src/types";
import "@nomiclabs/hardhat-waffle";
import "@typechain/ethers-v5";
import "@typechain/hardhat";
// import "ethereum-waffle";
import "ethers";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-deploy";
// import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import "hardhat-proxy";
import "hardhat-storage-layout";
import "hardhat-tracer";
import "hardhat-watcher";
import { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } from "hardhat/builtin-tasks/task-names";
import "hardhat/config";
import { subtask, task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";
import "solidity-coverage";
import "tsconfig-paths/register";
// Error.stackTraceLimit = Infinity;


import "@openzeppelin/hardhat-upgrades";
import { parseEther } from "ethers/lib/utils";

let mainnetConfig:any;
// import mainnetConfig from "./mainnet.config"; 


task( "accounts", "Prints the list of accounts", async ( taskArgs, hre ) => {
  const accounts = await hre.ethers.getSigners();
  for ( const account of accounts ) {
    console.log( account.address );
  }
} );

task( "blocknumber", "Prints block number", async ( taskArgs, hre ) => {
  const provider = new hre.ethers.providers.JsonRpcProvider( process.env.ALCHEMY_MAINNET_URL );
  const blockNum = await provider.getBlockNumber();
  console.log( blockNum );
} );


subtask( TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS )
.setAction( async ( _, __, runSuper ) => {
  const paths: string[] = await runSuper();

  return paths.filter( p => !p.endsWith( ".sol_" ) );
} );


function solppConfig() {
  const network = process.env.HARDHAT_NETWORK || "hardhat";

  // if( network === "hardhat" ){
  //   process.exit(1);
  // }

  switch ( network ) {
  case "hardhat":
  case "localhost":
    return <Partial<SolppConfig>>{
      defs : {
        CONSOLE              : true,
        FACTORY_symbol       : `"FOO"`,
        FACTORY_name         : `"Testing"`,
        FACTORY_description  : `"Social NFT Factory https://"`,
        FACTORY_baseImageURI : `"https://localhost:30000/api/tokens/"`,

        INK_name   : "DreamInk",
        INK_symbol : "DRINK",
      },
      collapseEmptyLines : true,
    };
  case "goerli":
  case "stage":
    return <Partial<SolppConfig>>{
      defs : {
        FACTORY_symbol       : `"FOO"`,
        FACTORY_name         : `"Testing"`,
        FACTORY_description  : `"Testing description"`,
        FACTORY_baseImageURI : `"https://test.decentfactory.xyz/api/tokens/"`,
        INK_symbol           : `"INK"`,
        INK_name             : `"Inkognito-Ink"`,
      },
      collapseEmptyLines : true,
    };
  case "mainnet":
    return <Partial<SolppConfig>>{
      defs : {
        FACTORY_symbol       : `"NITOS"`,
        FACTORY_name         : `"Inkognitos"`,
        FACTORY_description  : `"Inkognitos by DecentFactory - https://inkognitos.decentfactory.xyz"`,
        FACTORY_baseImageURI : `"https://inkognitos.decentfactory.xyz/api/tokens/"`,
        INK_symbol           : `"INK"`,
        INK_name             : `"Inkognito-Ink"`,
      },
      collapseEmptyLines : true,
    };
  }

  process.exit( 1 );
}


const hhConfig: HardhatUserConfig = {
  solpp          : solppConfig(),
  defaultNetwork : "hardhat",
  // etherscan      : {
  //   apiKey : process.env.ETHERSCAN_API_KEY,
  // },
  gasReporter    : {
  // enabled: (process.env.REPORT_GAS) ? true : false,
    currency : "USD",
    gasPrice : 50,
    url      : process.env.ALCHEMY_MAINNET_URL,
  },
  mocha : {
    timeout     : 0,
    fullTrace   : true,
    inlineDiffs : true,
  },
  networks : {
    /* Local testnet */
    hardhat : {
      accounts : {
        mnemonic        : process.env.MNEMONIC,
        accountsBalance : parseEther( "5" ).toString(),
        count           : 5,
      },
      mining : {
        mempool : {
          order : "fifo",
        },
        auto : true,
      },
      throwOnTransactionFailures : false,
      loggingEnabled             : false,
      blockGasLimit              : 30000000,
      chainId                    : Number( process.env.CHAIN_ID || "1337" ),
      saveDeployments            : true,
    },
    localhost : {
      accounts : {
        mnemonic : process.env.MNEMONIC,
        count    : 10,
      },
      loggingEnabled  : false,
      chainId         : Number( process.env.CHAIN_ID || "1337" ),
      saveDeployments : true,
      url             : `http://localhost:8545`,
    },
    stage : {
      accounts : {
        count    : 3,
        mnemonic : process.env.MNEMONIC,
      },
      chainId         : 1338,
      saveDeployments : false,
      url             : `https://test.decentfactory.xyz/testnet`,
    },
    goerli : {
      accounts : {
        mnemonic     : process.env.MNEMONIC,
        count        : 10,
        initialIndex : 1,
      },
      loggingEnabled  : true,
      chainId         : 5,
      saveDeployments : true,
      url             : process.env.ALCHEMY_GOERLI_URL,
    },
    // mainnet : mainnetConfig,
  },
  paths : {
    artifacts   : "./artifacts",
    cache       : "./cache",
    deploy      : "./deploy",
    deployments : "./deployments",
    imports     : "./node_modules",
    sources     : "./contracts",
    tests       : "./test",
  },
  solidity : {
    settings : {
      outputSelection : {
        "*" : {
          "*" : [
            "storageLayout",
          ],
        },
      },
    },
    compilers : [
      {
        settings : {
          optimizer : {
            enabled : true,
            runs    : 1000,
          },
        },
        version : "0.8.0",
      },
      {
        settings : {
          optimizer : {
            enabled : true,
            runs    : 1000,
          },
        },
        version : "0.8.12",
      },
      {
        version : "0.6.0",
      },
    ],
  },
  contractSizer : {
    alphaSort         : true,
    disambiguatePaths : false,
    runOnCompile      : true,
    strict            : true,
  },
  typechain : {
    alwaysGenerateOverloads : false,
    tsNocheck               : true,
    outDir                  : "./typechain",
    target                  : "ethers-v5",
  },
  abiExporter : {
    path         : "./abis",
    runOnCompile : true,
    clear        : true,
    flat         : false,
    only         : [],
    spacing      : 2,
    pretty       : true,
  },
};


task( "rpc", "Prints RPC url", async ( taskArgs, hre ) => {
  const url = ( <any>hhConfig.networks[
  hre.network.name
  ] ).url;

  console.log( url || "http://localhost:8545" );
} );


export default hhConfig;