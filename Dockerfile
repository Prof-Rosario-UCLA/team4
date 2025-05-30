# Build stage for Node.js dependencies and client build
FROM node:18-alpine AS node-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source files
COPY . .

# Build client
RUN npm run build-client

# Python stage
FROM python:3.9-slim

WORKDIR /app

# Install Node.js for running the server
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy built client and server files from node-builder
COPY --from=node-builder /app/client/dist ./client/dist
COPY --from=node-builder /app/client/node_modules ./client/node_modules
COPY --from=node-builder /app/server ./server
COPY --from=node-builder /app/server/node_modules ./server/node_modules

# Copy AI service files
COPY ai-service ./ai-service

# Set up Python environment for AI service
RUN python -m venv /app/ai-service/venv
RUN . /app/ai-service/venv/bin/activate && \
    pip install --no-cache-dir -r /app/ai-service/requirements.txt

# Copy the main package.json and install production dependencies
COPY package*.json ./
RUN npm install --production

# Expose necessary ports
EXPOSE 3000 8000 5000

# Start all services
CMD ["npm", "start"] 