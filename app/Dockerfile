# Stage 1: Build the React app
FROM node:18-alpine AS build

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock (or package-lock.json if using npm)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the app
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build -- --mode docker

# Stage 2: Serve the app with a lightweight web server
FROM nginx:alpine

# Copy the build output to the Nginx html directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
