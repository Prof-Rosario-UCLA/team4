Team4 – CS144 Final Project
Overview
This project consists of a multi-service application with a React frontend, Node.js/Express backend, and Python AI service. The application can be deployed locally for development or as a single container for production.
🏗️ Architecture

Client: React application built with Vite
Server: Node.js/Express API backend
AI Service: Python-based AI agent service
Database: MongoDB
Cache: Redis (Google Cloud Memorystore)

🛠️ Development Setup
Prerequisites

Node.js (v16+ recommended)
Python 3.8+
Docker and Docker Compose (for containerized deployment)
MongoDB instance
Redis instance

1. Clone Repository
bashgit clone https://github.com/Prof-Rosario-UCLA/team4.git
cd team4
2. AI Service Setup
bashcd ai-service

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env  # Edit with your values
AI Service Environment Variables (ai-service/.env):
bashAZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_API_VERSION=your_version_here
AZURE_SEARCH_SERVICE_ENDPOINT=your_search_endpoint
AZURE_SEARCH_API_KEY=your_search_key
3. Server Setup
bashcd ../server

# Install dependencies
npm install

# Create environment file
cp .env.example .env  # Edit with your values
Server Environment Variables (server/.env):
bashMONGO_URI=your_mongoURI_here
PORT=8000
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
4. Client Setup
bashcd ../client

# Install dependencies
npm install
5. Root Dependencies
bashcd ..

# Install root-level dependencies
npm install
🐳 Docker Deployment
Single Container Deployment (Recommended)
The project uses a unified Docker container that bundles all services together.
Using Docker Compose
bash# Build and run all services
docker compose up --build

# Run in detached mode
docker compose up -d --build

# Stop services
docker compose down
Using Docker Directly
bash# Build the container
docker build -t oversea-app .

# Run the container
docker run -p 3000:3000 -p 8000:8000 --env-file .env oversea-app
Environment Configuration for Docker
Create a .env file in the root directory with all required environment variables:
bash# MongoDB
MONGO_URI=your_mongoURI_here

# Server Configuration
PORT=8000
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

# Redis Configuration
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_API_VERSION=your_version_here

# Azure Search Configuration
AZURE_SEARCH_SERVICE_ENDPOINT=your_search_endpoint
AZURE_SEARCH_API_KEY=your_search_key
☁️ Google Kubernetes Engine (GKE) Deployment
Build and Push to Google Container Registry
bash# Build for AMD64 architecture and push to GCR
docker buildx build --platform linux/amd64 \
  -t us-west1-docker.pkg.dev/cs144-25s-jlin18/oversea-app/oversea-app:latest \
  --push ./
Deploy to Kubernetes
bash# Update deployment with new image
kubectl set image deployment/oversea-app \
  app=us-west1-docker.pkg.dev/cs144-25s-jlin18/oversea-app/oversea-app:latest

# Restart deployment to pull new image
kubectl rollout restart deployment/oversea-app

# Check deployment status
kubectl rollout status deployment/oversea-app
Manage Secrets
bash# Create secrets from .env file
kubectl create secret generic oversea-secrets --from-env-file=.env

# Update existing secrets
kubectl delete secret oversea-secrets
kubectl create secret generic oversea-secrets --from-env-file=.env
🚀 Running the Application
Development Mode

Start each service in separate terminals:

bash# Terminal 1: AI Service
cd ai-service
source venv/bin/activate
python app.py

# Terminal 2: Server
cd server
npm run dev

# Terminal 3: Client
cd client
npm run dev

Access the application:

Frontend: http://localhost:3000
API: http://localhost:8000
AI Service: http://localhost:5000



Production Mode (Docker)
bashdocker compose up -d --build
Access the application at http://localhost:3000
