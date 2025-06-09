FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# Install Python dependencies
COPY ai-service/requirements.txt ./ai-service/requirements.txt
RUN pip install --no-cache-dir -r ai-service/requirements.txt

# Build client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client ./client
RUN cd client && npm run build

# Copy source code
COPY server ./server
COPY ai-service ./ai-service

# Copy client build into server/public
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# Copy and make start script executable
COPY start.sh ./start.sh
RUN chmod +x start.sh

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["./start.sh"]