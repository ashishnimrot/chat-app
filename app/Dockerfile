# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if present)
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite application
RUN npm run build

# Stage 2: Serve the application using an Nginx server
FROM nginx:alpine

# Copy the built files from the previous stage to the Nginx web directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to allow traffic to the server
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
