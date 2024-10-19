#!/bin/bash

# Exit on any error
set -e

# Function to output colored text
print() {
  echo -e "\033[1;34m$1\033[0m"
}

# Step 1: Start Minikube with hyperkit driver
print "Checking if Minikube is running..."
if minikube status | grep -q "Running"; then
  print "Minikube is already running. Skipping step 1."
else
  print "Starting Minikube..."
  minikube start --driver=hyperkit
fi

# Step 2: Enable Ingress Addon
print "Checking if Ingress addon is enabled..."
if minikube addons list | grep ingress | grep -q "enabled"; then
  print "Ingress addon is already enabled. Skipping step 2."
else
  print "Enabling Minikube Ingress Add-on..."
  minikube addons enable ingress
fi

# Step 3: Get Minikube IP and update /etc/hosts
print "Checking if /etc/hosts contains the Minikube IP entry..."
MINIKUBE_IP=$(minikube ip)
HOST_ENTRY="backend.local"
if grep -q "$MINIKUBE_IP $HOST_ENTRY" /etc/hosts; then
  print "/etc/hosts already contains the correct entry. Skipping step 3."
else
  print "Updating /etc/hosts file..."
  sudo sed -i.bak "/$HOST_ENTRY/d" /etc/hosts
  echo "$MINIKUBE_IP $HOST_ENTRY" | sudo tee -a /etc/hosts > /dev/null
fi

# Step 4: Docker login (optional)
print "Checking if Docker is logged in..."
if docker info | grep -q "Username"; then
  print "Already logged into Docker. Skipping step 4."
else
  print "Logging into Docker..."
  docker login
fi

# Step 5: Build backend Docker image (skipping if no changes in ./server)
print "Checking for changes in backend code..."
if git diff --quiet ./server && git diff --cached --quiet ./server; then
  print "No changes in backend code. Skipping step 5."
else
  print "Building backend Docker image..."
  docker build -t ashishnimrot/chat-app-backend-image:latest ./server
fi

# Step 6: Push backend Docker image (skipping if no changes in ./server)
if git diff --quiet ./server && git diff --cached --quiet ./server; then
  print "No changes in backend code. Skipping step 6."
else
  print "Pushing backend Docker image to Docker Hub..."
  docker push ashishnimrot/chat-app-backend-image:latest
fi

# Step 7: Deploy the backend using backend-deployment.yaml
print "Applying backend deployment..."
kubectl apply -f backend-deployment.yaml

# Step 8: Build frontend Docker image (skipping if no changes in ./app)
print "Checking for changes in frontend code..."
if git diff --quiet ./app && git diff --cached --quiet ./app; then
  print "No changes in frontend code. Skipping step 8."
else
  print "Building frontend Docker image..."
  docker build -t ashishnimrot/chat-app-frontend-image:latest ./app
fi

# Step 9: Push frontend Docker image (skipping if no changes in ./app)
if git diff --quiet ./app && git diff --cached --quiet ./app; then
  print "No changes in frontend code. Skipping step 9."
else
  print "Pushing frontend Docker image to Docker Hub..."
  docker push ashishnimrot/chat-app-frontend-image:latest
fi

# Step 10: Deploy the frontend using frontend-deployment.yaml
print "Applying frontend deployment..."
kubectl apply -f frontend-deployment.yaml

# Step 11: Get frontend URL
print "Retrieving frontend URL..."
NODE_PORT=$(kubectl get service frontend-service -o=jsonpath='{.spec.ports[0].nodePort}')
FRONTEND_URL="http://$(minikube ip):$NODE_PORT"

print "Deployment complete. Access the frontend application at: $FRONTEND_URL"
