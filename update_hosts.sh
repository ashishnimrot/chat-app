#!/bin/bash

MINIKUBE_IP=$(minikube ip)
HOST_ENTRY="backend.local"

# Remove old entry if it exists
sudo sed -i.bak "/$HOST_ENTRY/d" /etc/hosts

# Add new entry
echo "$MINIKUBE_IP $HOST_ENTRY" | sudo tee -a /etc/hosts
echo "Updated /etc/hosts with Minikube IP: $MINIKUBE_IP"
