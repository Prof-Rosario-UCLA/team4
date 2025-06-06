FROM python:3.12-slim AS base

# Install Node.js
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package info for concurrently script
COPY package*.json ./
RUN npm install --omit=dev

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Install python dependencies
COPY ai-service/requirements.txt ./ai-service/requirements.txt
RUN pip install --no-cache-dir -r ai-service/requirements.txt

# Build client
COPY client/package*.json ./client/
RUN cd client && npm install && npm run build

# Copy source code
COPY server ./server
COPY ai-service ./ai-service
# Copy client build into server/public
RUN mkdir -p server/public && cp -r client/dist/* server/public/

COPY start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000 8000
CMD ["./start.sh"]
