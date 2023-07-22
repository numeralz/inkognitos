#!/bin/sh

echo ">> Check yarn cache integrity"
(yarn check --integrity && yarn check --verify-tree) \
|| yarn install --frozen-lockfile

echo ">> Build contract project"
yarn build

echo ">> Call command issued to the docker service"
exec "$@"
