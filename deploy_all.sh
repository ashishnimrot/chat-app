#!/bin/bash

# Exit on any error
set -e

# Function to output colored text
print() {
  echo -e "\033[1;34m$1\033[0m"
}

# Step 1: Start Minikube with hyperkit driver
print "Starting Minikube..."
minikube start --driver=hyperkit

# Step 2: Enable Ingress Addon
print "Enabling Minikube Ingress Add-on..."
minikube addons enable ingress

# Step 3: Get Minikube IP and update /etc/hosts
print "Updating /etc/hosts file..."
MINIKUBE_IP=$(minikube ip)
HOST_ENTRY="backend.local"
sudo sed -i.bak "/$HOST_ENTRY/d" /etc/hosts
echo "$MINIKUBE_IP $HOST_ENTRY" | sudo tee -a /etc/hosts > /dev/null

# Step 4: Docker login (optional)
print "Logging into Docker..."
docker login

# Step 5: Build backend Docker image
print "Building backend Docker image..."
docker build -t ashishnimrot/chat-app-backend-image:latest ./server

# Step 6: Push backend Docker image
print "Pushing backend Docker image to Docker Hub..."
docker push ashishnimrot/chat-app-backend-image:latest

# Step 7: Deploy the backend using backend-deployment.yaml
print "Applying backend deployment..."
kubectl apply -f backend-deployment.yaml

# Step 8: Build frontend Docker image
print "Building frontend Docker image..."
docker build -t ashishnimrot/chat-app-frontend-image:latest ./app

# Step 9: Push frontend Docker image
print "Pushing frontend Docker image to Docker Hub..."
docker push ashishnimrot/chat-app-frontend-image:latest

# Step 10: Deploy the frontend using frontend-deployment.yaml
print "Applying frontend deployment..."
kubectl apply -f frontend-deployment.yaml

# Step 11: Get frontend URL
print "Retrieving frontend URL..."
NODE_PORT=$(kubectl get service frontend-service -o=jsonpath='{.spec.ports[0].nodePort}')
FRONTEND_URL="http://$(minikube ip):$NODE_PORT"

print "Deployment complete. Access the frontend application at: $FRONTEND_URL"
