

# ------------------------------------
FROM node:16-alpine AS install

ENV YARN_CACHE_FOLDER /tmp/yarn.cache

RUN apk --update add --no-cache \
  git g++ make

RUN mkdir -p /app /node_modules $YARN_CACHE_FOLDER \
  && chown -R node:node /app /node_modules $YARN_CACHE_FOLDER

WORKDIR /app

COPY --chown=node:node \
  ./Contract/package.json \
  ./Contract/yarn.lock \
  ./

# Install modules
ENV PATH=/node_modules/.bin:$PATH
RUN --mount=type=cache,target=$YARN_CACHE_FOLDER \
  yarn install \
  --ignore-optional \
  --modules-folder "/node_modules" \
  --cache-folder "$YARN_CACHE_FOLDER"

# ------------------------------------
FROM install AS dev

VOLUME [ "/app/Contract/src" ]
WORKDIR /app/Contract
USER node

CMD [ "yarn", "dev" ]

FROM install AS start

COPY --chown=node:node \
  ./Contract /app/

WORKDIR /app/Contract
USER node

CMD [ "yarn", "start" ]



# ------------------------------------
# FROM library/node:16-alpine AS build

# RUN mv /app/Contract/node_modules /app/node_modules
# ENV PATH=/node_modules/.bin:$PATH

# VOLUME [ "/app/Contract" ]
# WORKDIR /app/Contract

# VOLUME [ "/app/Frontend/src" ]
# VOLUME [ "/app/Backend/src" ]

# # RUN yarn build 
# USER node
# ENTRYPOINT [ "yarn"]
# CMD [ "build" ]