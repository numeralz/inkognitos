#!/bin/bash

apt-get update -y \
&& apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
&& rm -rf /var/cache/apt/lists/* \

# Disable SWAP
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

function installDocker {
# Docker
curl -fsSL \
  https://get.docker.com \
  -o get-docker.sh \
  && sh get-docker.sh \
  && rm get-docker.sh

usermod -aG docker ubuntu \
  && service docker start
}


# Kubernetes
function installKubernetes {

cat <<EOF | tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

sysctl --system

curl -fsSLo \
  /usr/share/keyrings/kubernetes-archive-keyring.gpg \
  https://packages.cloud.google.com/apt/doc/apt-key.gpg

echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" \
  | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update \
&& apt-get install -y \
  kubelet kubeadm kubectl \
&& rm -rf /var/cache/apt/lists/* \
&& apt-mark hold \
  kubelet kubeadm kubectl

# systemctl daemon-reload
service kubelet start
}

installDocker
installKubernetes


# master
# sudo kubeadm reset
# sudo kubeadm init