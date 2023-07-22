

# https://coder.com/docs/code-server/latest/FAQ

# curl -fsSL https://code-server.dev/install.sh | sh

user="coder"
password=$( < /dev/urandom tr -dc _A-Z-a-z-0-9 | head -c"${1:-32}";echo; )

echo "[Unit]
Description=code-server
After=nginx.service
[Service]
Type=simple
User=$user
Environment=PASSWORD=$password
Environment=EXTENSIONS_GALLERY='{\"serviceUrl\": \"https://marketplace.visualstudio.com/apis/public/gallery\"}'
ExecStart=/usr/lib/code-server/code-server --bind-addr 0.0.0.0:8080 --user-data-dir /var/lib/code-server --auth password
Restart=always

[Install]
WantedBy=multi-user.target" > /lib/systemd/system/code-server.service

echo 'alias code="/var/tmp/coder/code-server/bin/code-server -r"' >> ~/.profile

# Code together
function startCodeServer {
  SERVICE_URL=https://open-vsx.org/vscode/gallery \
  ITEM_URL=https://open-vsx.org/vscode/item \
  code-server --install-extension genuitecllc.codetogether

  code-server --enable-proposed-api genuitecllc.codetogether
}

# Wirh reverse proxy
# code-server --proxy-domain "test.decentfactory.xyz"

function codeShare {
  SERVICE_URL=https://open-vsx.org/vscode/gallery \
  ITEM_URL=https://open-vsx.org/vscode/item \
  code-server --install-extension gitduck.code-streaming
}


function vueDev {
  echo "
  module.exports = {
    devServer: {
      port: 3454,
      sockPath: "sockjs-node",
    },
    publicPath: "/absproxy/3454",
  }"

  PUBLIC_URL=/absproxy/3000 \
    WDS_SOCKET_PATH=$PUBLIC_URL/sockjs-node \
    BROWSER=none yarn start
}

function snibox  {
  git clone https://github.com/snibox/snibox-docker.git
  cd snibox-docker || exit
  ./bin/setup
  ./bin/start
}


