#/usr/bin/env bash
# set -x
# ROOT=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
# ROOT=$(cd "$(dirname "$(readlink -f "$0")")")

function HEADING { 
    echo -e "\e[1m\e[4m ${1} \e[0m"
}
function DANGER { 
    echo -e "\e[1m\e[31m ${1} \e[0m"
}
function SUCCESS { 
    echo -e "\e[1m\e[32m ${1} \e[0m"
}
function INFO { 
    echo -e "\e[1m\e[34m ${1} \e[0m"
}

function COMPOSE {
    docker --host "${DOCKER_HOST}" \
        compose \
        -p "${PROJECT_NAME}" \
        -f "${COMPOSE_FILE}" \
        "$@"

    if(($? != 0)); then
        DANGER "Compose failed"
        exit 1
    fi
}

# function fe-build-local {
#     pushd . && cd ./Frontend || exit 1
#     if ! yarn build ; then
#         DANGER "Frontend:Build failed"
#         exit 1sudo snap install go  --classic
#     fi
#     SUCCESS "Frontend build completed"
#     popd
# }
        
function fe-ensure-certificates {
    if compgen -G "./Frontend/nginx/*.key" >/dev/null; then
        SUCCESS "Certificates exist"
    else
        INFO "Generate certificates..."

        pushd . && cd ./Frontend/nginx || exit 1
        ./self-signed-cert.sh
        popd || exit

        if ! compgen -G "./Frontend/nginx/*.key" >/dev/null; then
            DANGER "Certificates failed"
            exit 1
        fi
        SUCCESS "Certificates created"
    fi
}


function waitForRpc {
    local RPC="$1"
    timeout=100
    until curl --insecure -s -f -o /dev/null "${RPC}"
    do
        INFO "Check ${RPC}... ${timeout}"
        sleep 1
        timeout=$((timeout-1))
        if [[ ${timeout} -lt 0 ]]; then
            DANGER "Timed out waiting for ${RPC}"
            exit 1
        fi
    done
    SUCCESS "OK: ${RPC}"
}

function update {
    docker volume create --name db-data

    if [[ "$HARDHAT_NETWORK" == "hardhat" ]];  then

        if [[ "$1" == 'contract' ]]; then
            HEADING "Update Contracts"
            shift;
            pid="$(lsof -ti :8545)"
            if [[ "$pid" != "" ]]; then
                kill "$pid"
            fi
        fi
        
        if [[ "$(lsof -ti :8545)" == "" ]]; then
            pushd . && cd ./Contract || exit 1
            rm -f "./deployed/deployed-${CHAIN_ID}.json"
            npx hardhat node &

            npx -y nodemon  \
                -w './hardhat.config.ts' \
                -w './contracts' \
                -e 'sol, ts' \
                -x 'yarn build' &

            waitForRpc "http://localhost:8545"
            
            popd

            sleep 10s
        fi
    elif [[ "$HARDHAT_NETWORK" == "stage" ]];  then
        if [[ "$1" == 'contract' ]]; then
            shift;
            HEADING "Update Contracts"

            COMPOSE build --no-cache contract 
            COMPOSE up -d --no-deps --force-recreate contract

            waitForRpc "$CHAIN_RPC"

            pushd . && cd ./Contract || exit 1
            rm -f "./deployed/deployed-${CHAIN_ID}.json"

            yarn build
            yarn deploy:stage
            # npx hardhat --network stage run --no-compile ./scripts/setup.ts || exit 1

            popd
            
            sleep 10s
        fi
    fi


    target="${@:-backend frontend}"
    HEADING "target: ${target}"

    # HEADING "Build"
    # COMPOSE build ${target} || exit 1

    HEADING "Deploy"
    COMPOSE up \
        --build \
        --force-recreate \
        --detach \
        ${target}

    HEADING "Logs"
    
    if [[ "$DOCKER_HOST" == "" ]];  then
        COMPOSE logs --tail=10000 -f backend frontend contract
    else
        COMPOSE logs --tail=10000 -f backend contract
    fi
}

function logs {
    HEADING "LOGS"
    COMPOSE logs --tail=100000 -f $@
}

function prune {
    docker --host "${DOCKER_HOST}" \
        system prune $@
}

function deploy-contract {
    pushd . && cd ./Contract || exit 1
    if [[ -f "./deployed/deployed-${CHAIN_ID}.json" ]]; then
        DANGER "Abort: Existing deployed-${CHAIN_ID}.json";
        exit 1
    fi

    yarn build
    npx hardhat --network goerli deploy --no-compile
    npx hardhat --network goerli run scripts/setup.ts
    
    popd
}

INFO "----------------------------"

ROOT=$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
pushd . 
cd "$ROOT" || exit

ENV="${1:-dev}"
shift 

INFO "----- ENV: $ENV "
COMPOSE_FILE="docker-compose.$ENV.yml"
PROJECT_NAME="dream-$ENV"

case "$ENV" in
dev)
    HEADING "Development"
    HARDHAT_NETWORK="hardhat"
    source .env.dev
    unset DOCKER_HOST
    ;;
# stage0)
#     HEADING "Stage0"
#     source ./.env.stage
#     unset DOCKER_HOST
#     HARDHAT_NETWORK="stage"
#     CHAIN_RPC="http://localhost:8546"
#     COMPOSE_FILE="docker-compose.stage.yml"
#     PROJECT_NAME="dream-dev"
#     export FRONTEND_PORT=30000
#     export FRONTEND_PORT_SSL=30443
#     ;;
# stage)
#     HEADING "Stage"
#     source .env.stage
#     CHAIN_RPC="http://54.82.133.172:8545"
#     HARDHAT_NETWORK="stage"
#     DOCKER_HOST="ssh://ink.test"
#     PROJECT_NAME="dream-stage"
#     ;;
stage)
    HEADING "Stage"
    # source ./.env.dev
    export USE_ENV=./.env.dev
    export FRONTEND_PORT=30080
    export FRONTEND_PORT_SSL=30000
    HARDHAT_NETWORK="hardhat"
    PROJECT_NAME="dream-stage"
    CHAIN_RPC="http://host.docker.internal:8545"
    unset DOCKER_HOST
    ;;
testnet)
    HEADING "Testnet"
    source ./.env.testnet
    HARDHAT_NETWORK="goerli"
    DOCKER_HOST="ssh://ink.test"
    PROJECT_NAME="dream-stage"
    ;;
prod)
    HEADING "Production"
    source ./.env.prod
    HARDHAT_NETWORK="mainnet"
    DOCKER_HOST="ssh://ink.prod"
    ;;
esac


INFO "HARDHAT_NETWORK : $HARDHAT_NETWORK "
INFO "DOCKER_HOST     : $DOCKER_HOST "
INFO "PROJECT_NAME    : $PROJECT_NAME "

export DOCKER_HOST
export PROJECT_NAME
export COMPOSE_FILE
export HARDHAT_NETWORK
export CHAIN_ID
export CHAIN_RPC


"$@"

popd || exit 