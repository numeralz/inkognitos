

# ------------------------------------
FROM node:16-alpine AS install

ENV YARN_CACHE_FOLDER /tmp/yarn.cache

RUN apk --update add --no-cache \
  git gettext

RUN mkdir -p /app /node_modules $YARN_CACHE_FOLDER \
  && chown -R node:node /app /node_modules $YARN_CACHE_FOLDER

WORKDIR /app

COPY --chown=node:node \
  package.json \
  yarn.lock \
  ./

RUN npm install -g npm@latest
RUN npm install -g vite

# Install modules
ENV PATH=/node_modules/.bin:$PATH
# RUN --mount=type=cache,target=$YARN_CACHE_FOLDER \
#   yarn install \
#   --ignore-optional \
#   --modules-folder "/node_modules" \
#   --cache-folder "$YARN_CACHE_FOLDER"
RUN yarn install --modules-folder "/node_modules"

# ------------------------------------
FROM install AS development

HEALTHCHECK CMD curl --fail http://localhost/ || exit 1

WORKDIR /app
CMD [ "yarn", "dev" ]

# ------------------------------------
FROM node:16-alpine AS build

ARG VITE_BASE
ENV VITE_BASE=${VITE_BASE}

ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY --from=install --chown=node:node \
  /node_modules /app/node_modules

COPY --chown=node:node \
  . /app

WORKDIR /app

RUN yarn build:ssg

# ------------------------------------
FROM nginx:mainline-alpine AS production

HEALTHCHECK CMD curl --fail http://localhost/ || exit 1

ARG NGINX_TEMPLATE="./nginx/nginx.tmpl"

ENV DOMAIN="decentfactory.xyz"

RUN apk --update add --no-cache \
  git gettext

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build \
  --chown=nginx:nginx \
  /app/dist/ /usr/share/nginx/html/

# load nginx config
COPY --chown=nginx:nginx \
  $NGINX_TEMPLATE /etc/nginx/nginx.tmpl

# RUN \
#   envsubst "\$DOMAIN" \
#   < /etc/nginx/nginx.tmpl \
#   > /etc/nginx/nginx.conf

RUN envsubst '${DOMAIN}' < \
/etc/nginx/nginx.tmpl > /etc/nginx/nginx.conf \
&& cat /etc/nginx/nginx.conf

COPY  ./nginx/*.crt                       /etc/ssl/certs/
COPY  ./nginx/*.key ./nginx/*.dhparam.pem /etc/ssl/private/

RUN ln -sf /dev/stdout /var/log/nginx/access.log \
  && ln -sf /dev/stderr /var/log/nginx/error.log


CMD ["nginx", "-g", "daemon off;"]