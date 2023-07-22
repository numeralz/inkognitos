


# Deployment


## AWS EC2 Server


##### ubuntu-server-setup.sh

```sh
#!/bin/bash

# Prepare
apgist aws ec2 user-data fail2bant-get update && apt-get install \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Key
mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update && apt-get install -y \
  docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Docker Group
groupadd docker \
  && usermod -aG docker ubuntu

apt autoremove -y

docker version
docker compose version

# Fail2Ban

apt -y install fail2ban

```


##### Update a service
```sh
docker compose build --no-cache $serviceName
docker compose up --no-deps -d $serviceName
```


## Git filter

```sh
function gfb {
  FILTER_BRANCH_SQUELCH_WARNING=1 \
  git filter-branch --index-filter \
  "git rm --cached --ignore-unmatch --quiet --force '$1'" \
  --prune-empty  -- HEAD
}

gfb "Contract/soljson-v0.8.13+commit.abaa5c0e.js"

rm -Rf .git/refs/original
rm -Rf .git/logs/
git gc --prune

```


## Factory

