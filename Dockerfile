# Build stage
FROM node:23.11.0-alpine AS builder

WORKDIR /app

# Install dependencies and build
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source and build
COPY . .
RUN cd client && npm run build

# Production stage
FROM python:3.12.3-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy built files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/ai-service ./ai-service

# Set up Python
RUN python -m venv /app/ai-service/venv
RUN . /app/ai-service/venv/bin/activate && pip install -r /app/ai-service/requirements.txt

# Create a simple server to serve the client
RUN echo 'const express = require("express"); const path = require("path"); const app = express(); app.use(express.static(path.join(__dirname, "client/dist"))); app.listen(5173, "0.0.0.0", () => console.log("Client server running on port 5173"));' > /app/serve-client.js

# Start services
CMD ["/bin/bash", "-c", "node /app/serve-client.js & cd /app/server && npm start & cd /app/ai-service && /app/ai-service/venv/bin/uvicorn api_server:app --host 0.0.0.0 --port 5000 & wait"]

EXPOSE 5173 3000 5000