#!/bin/bash

export ipfs_staging="$(dirname $(readlink -fm ${PWD}))"/ipfs_staging
export ipfs_data="$(dirname $(readlink -fm ${PWD}))"/ipfs_data

echo ipfs_staging: $ipfs_staging
echo ipfs_data: $ipfs_data

function addfile {
  sudo cp -r ${1} "${ipfs_staging}/"
  docker exec ipfs_host ipfs add -r "/export/"
}

function start {

  docker rm -f ipfs_host

  docker run -d \
    --name ipfs_host \
    -v "${ipfs_staging}:/export/" \
    -v "${ipfs_data}:/data/ipfs/" \
    -p 4001:4001 \
    -p 4001:4001/udp \
    -p 127.0.0.1:8080:8080 \
    -p 127.0.0.1:5001:5001 \
    ipfs/go-ipfs:latest

  docker logs -f ipfs_host &

  sleep 3

  docker exec ipfs_host ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://0.0.0.0:5001", "http://localhost:3000", "http://127.0.0.1:5001", "https://webui.ipfs.io"]'
  docker exec ipfs_host ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'
  docker exec ipfs_host ipfs swarm peers


}

function remove {
  docker rm -f ipfs_host
}


"$@"
