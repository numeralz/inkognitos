#!/usr/bin/env ts-node



import chalk from "chalk";
import axios from "axios";
import { SpawnOptions, spawnSync } from "child_process";
import highlight from "cli-highlight";
import https from "https";
import minimist from "minimist";

/*
-------------------------------------
ts-node ./deploy.ts \
  -e dev|test|prod \
  --build? \
  frontend|backend|contract \

-------------------------------------
*/
function LOG_JSON(o: any) {
  console.log(
    highlight(
      JSON.stringify(o),
      {
        language: "json",
      }
    )
  );
}


function prettyCmd(cmd: string[]) {

  let isCmd = true;
  let isVal = false;
  return cmd.filter(Boolean).map(item => {
    if (item.indexOf('-') === 0) {
      isCmd = false;
      isVal = true;
      return (chalk.dim("\\\n  ") + chalk.blue.bold(item)).padEnd(10, " ");
    }
    if (isVal) {
      isVal = false;
      return chalk.gray(item);
    }
    if (isCmd) {
      return chalk.bold(item);
    }
    return (chalk.dim("\\\n  ") + chalk.bold(item));
  }).join(" ");
}


let DRY_RUN = true;

function X(cmd: string[] | string, opts: SpawnOptions = {}): string {

  // if(DRY_RUN){
  //   console.log(prettyCmd(cmd as string[]));
  //   return;
  // }

  if (typeof cmd === "string") {
    return X(cmd.trim().split(/\s+/), opts);
  }

  console.log(prettyCmd(cmd));

  try {
    const out = spawnSync(cmd[0], cmd.slice(1).filter(x => !!x), {
      cwd: process.cwd(),
      ...opts,
      env: {
        ...process.env,
        ...(opts.env),
      },
      stdio: ['inherit', 'inherit', 'inherit']
    });
    if (out.error) {
      process.exit(1);
    }
    console.log(out?.stdout?.toString().trim());
    return out?.stdout?.toString().trim();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

};


let ENV: EnvConfig;

interface EnvConfig {
  name: string;
  projectName: string;
  composeFile: string;
  chainRpc: string;
  dockerHost: string;
  hhNetwork: string;
}


const envConfigs: Record<string, EnvConfig> = {
  dev: {
    name: "dev",
    hhNetwork: "hardhat",
    projectName: "ink-dev",
    composeFile: "docker-compose.dev.yml",
    chainRpc: "https://localhost:8545",
    dockerHost: "",
  },
  test: {
    name: "test",
    hhNetwork: "stage",
    projectName: "ink-test",
    composeFile: "docker-compose.stage.yml",
    chainRpc: "https://test.decentfactory.xyz/testnet",
    dockerHost: "ssh://ink.test",
  },
  prod: {
    name: "prod",
    hhNetwork: "stage",
    projectName: "ink-prod",
    composeFile: "docker-compose.prod.yml",
    chainRpc: "https://test.decentfactory.xyz/testnet",
    dockerHost: "ssh://ink.prod",
  }
};

const dockerCmd = (env: EnvConfig) => {
  return [
    `docker`, ...(env.dockerHost ? [`--host`, `${env.dockerHost}`] : []),
  ];
};

const composeCmd = (env: EnvConfig) => {
  return [
    ...dockerCmd(env), `compose`,
    ...(env.composeFile ? [`-f`, `${env.composeFile}`] : []),
    `-p`, env.projectName];
};


const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function waitForLive(url: string) {
  let attempts = 500;
  while (--attempts) {

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(chalk.yellow(`Polling ${url}...`));
    
    try {
      const {
        data,
      } = await axios.request({
        httpsAgent,
        method: "get",
        url,
      });
      break;
    }
    catch (error: any) {
      continue;
    }
  }

  console.log(
    chalk.green(`${url} is live`)
  );
}


const actionConfigs: {
  [item: string]: {
    run?: (...args: any[]) => Promise<void>;
    build?: (...args: any[]) => Promise<void>;
    [action: string]: undefined | ((...args: any[]) => Promise<void>);
  };
} = {

  /*
  -------------------------------------
  Contract
  -------------------------------------
  */
  contract: {
    async default() {
      await actionConfigs.contract.build?.();
      await actionConfigs.contract.deploy?.();
    },
    async build() {
      X([`yarn`, `build`], { cwd: './Contract' });

      // await actionConfigs.backend.build?.();

      X([...composeCmd(ENV), 'build', 'contract'], { cwd: './Contract' });
    },
    async logs() {
      X([...composeCmd(ENV), `logs`, '--tail=1000', `-f`, `contract`]);
    },
    async run() {
      switch (ENV.name) {
        case "prod":
        case "test":
          X([
            ...composeCmd(ENV),
            'up', 
            '--no-deps', 
            '-d',
            `contract`
          ]);
          
          await actionConfigs.contract.deploy?.();

          break;
        case "dev":
          // close
          const pid = X(`lsof -ti :8545`);
          if (pid) {
            console.log(pid);

            X(['sudo', 'kill', '-9', pid]);
          }


          X([`yarn`, `dev`], { cwd: './Contract' });

          break;
      }
    },
    async deploy({ clean }: { clean?: boolean; } = {}) {

      const HARDHAT_NETWORK = ENV.hhNetwork;
      
      await waitForLive(ENV.chainRpc);

      X([
        'npx', 'hardhat',
        ...(HARDHAT_NETWORK ? ['--network', HARDHAT_NETWORK] : []),
        'deploy',
        '--reset'
      ], {
        cwd: "./Contract",
        env: {
          HARDHAT_NETWORK
        }
      });
    }
  },

  /*
  -------------------------------------
  Frontend
  -------------------------------------
  */
  frontend: {
    async default() {
      await actionConfigs.frontend.build?.();
      await actionConfigs.frontend.run?.();
    },
    async build(
      { clean }: { clean?: boolean; } = {},
    ) {

      if (ENV.name !== 'dev') {
        if (!spawnSync(
          'find', ["./", "-name", "\\*.key"],
          { cwd: './Frontend/nginx' })
        ) {
          X(
            ['sh', `./self-signed-cert.sh`],
            { cwd: './Frontend/nginx' }
          );
        }

        X(['yarn', 'build'], {
          cwd: "./Frontend"
        });
      }

      X([
        ...composeCmd(ENV),
        `build`,
        clean ? '--no-cache' : '',
        `--progress=tty`,
        `frontend`
      ], {
        env: {
          "DOCKER_BUILDKIT": "1"
        }
      });
    },
    async run() {
      X([
        ...composeCmd(ENV),
        'up',
        '--no-deps', 
        '--force-recreate',
        '-d',
        'frontend'
      ]);
    },
    async logs() {
      X([...composeCmd(ENV), `logs`, '--tail=1000', `-f`, `frontend`]);
    }
  },
  /*
  -------------------------------------
  Backend
  -------------------------------------
  */
  backend: {
    async default() {
      await actionConfigs.backend.build?.();
      await actionConfigs.backend.run?.();
    },
    async build(
      { clean }: { clean?: boolean; } = {},
    ) {
      X([
        ...composeCmd(ENV),
        `build`,
        `--progress=tty`,
        clean ? '--no-cache' : '',
        `backend`
      ], {
        env: {
          "DOCKER_BUILDKIT": "1"
        }
      });
    },
    async run({ rebuild }: { rebuild?: boolean; } = {}) {
      X([
        ...dockerCmd(ENV),
        'volume', 'create', `--name=db-data`
      ]);
      X([
        ...composeCmd(ENV),
        'up',
        '--no-deps', 
        '--force-recreate',
        (ENV.name !== "dev" ? '-d' : ''),
        `backend`
      ]);
    },
    async logs() {
      X([...composeCmd(ENV), `logs`, '--tail=1000', `-f`, `backend`]);
    }
  },
  default: {
    async default() {
      await actionConfigs.frontend.run?.();
      await actionConfigs.backend.run?.();
    },
    async logs() {
      X([...composeCmd(ENV), `logs`, '--tail=1000', `-f`]);
    },
    async build() {
      await actionConfigs.contract.build?.();
      await Promise.allSettled([
        actionConfigs.backend.build?.(),
        actionConfigs.frontend.build?.()
      ]);
    },
    async run() {
      await actionConfigs.contract.run?.();
      await Promise.allSettled([
        actionConfigs.backend.run?.(),
        actionConfigs.frontend.run?.()
      ]);
    }
  },
};


const ARGS = minimist(process.argv.slice(2));



console.log(ARGS);


(async function main() {

  const envName = ARGS.e || ARGS.env;


  if (typeof envName !== "string") {
    process.exit(1);
  }

  console.log(`ENV: ${envName}`);

  ENV = envConfigs[envName];

  while (ARGS._?.length) {

    const [target, actions] = (ARGS._?.shift()?.split(":")||[]) as string[];

    console.log(ARGS._);

    const _actions = (actions||'default')?.split(",");
    

    for (let action of _actions) {
      console.log("〰️".repeat(80));

      console.log(
        chalk.bold(`--> ${target}:${action} ${_actions.indexOf(action)}/${_actions.length}`)
      );
      const [_action, args] = (action).match(/(\w+)(?:\((.+)\))?/gi)?.slice(0)||[];
      const flags = Object.fromEntries((args||'').match(/\.([^\.]+)/gi)?.map(n=>[n, true])||[]);

      console.log(_action, flags);
      

      try {
        await actionConfigs[target||'default']?.[_action]?.();
      } catch (err) {
        console.log(err);
        process.exit(1);
      }
    }

    // await Promise.allSettled(
    //   actions.split(",").map(async (action) => {
    //     console.log(
    //       chalk.bold(`--> ${target}:${action} `)
    //     );
    //     await actionConfigs[target]?.[action]?.();
    //   })
    // );
  }
})().then((...args: any) => {


}).catch((err) => {
  console.error(err);
});


// ts-node deploy.ts