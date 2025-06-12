# team4 – CS144 Final Project

## 🛠️ Setup Instructions

```bash
# Clone the repository
git clone https://github.com/Prof-Rosario-UCLA/team4.git
cd team4

# -------------------------------
# AI Agent (Python)
# -------------------------------
cd ai-service
python3 -m venv venv
source venv/bin/activate   # For Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env for ai-service
# (Place this in ai-service/.env)
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_API_VERSION=your_version_here
AZURE_SEARCH_SERVICE_ENDPOINT=your_search_endpoint
AZURE_SEARCH_API_KEY=your_search_key

# -------------------------------
# Server (Node.js/Express)
# -------------------------------
cd ../server
npm install

# Create .env for server
# (Place this in server/.env)
MONGO_URI=your_mongoURI_here
PORT=your_port_here
ACCESS_TOKEN_SECRET=your_secret_here
REFRESH_TOKEN_SECRET=your_secret_here

# -------------------------------
# Client (Vite)
# -------------------------------
cd ../client
npm install

# -------------------------------
# Root
# -------------------------------
cd ..
npm install
```

## Single Container Deployment

This project now ships with a single Docker container that bundles the React client, Node.js API and Python AI service. Build and run the container with Docker Compose:

```bash
docker compose up --build
```

Set `REDIS_HOST` and `REDIS_PORT` to the address of your Google Cloud Memorystore instance so no Redis container is required.

The separate Dockerfiles inside `client/`, `server/` and `ai-service/` have been removed. The root `Dockerfile` now builds the entire application. Docker Compose is provided for convenience, but you can also build and run the container directly:

```bash
docker build -t oversea-app .
docker run -p 3000:3000 -p 8000:8000 --env-file .env oversea-app
```

Build to GKE

```bash
docker buildx build --platform linux/amd64 \
-t us-west1-docker.pkg.dev/cs144-25s-jlin18/oversea-app/oversea-app:latest \--push ./
```

Set image

```bash
kubectl set image deployment/oversea-app app=us-west1-docker.pkg.dev/cs144-25s-jlin18/oversea-app/oversea-app:latest
```

Rollout image

```bash
kubectl rollout restart deployment/oversea-app
```

Create secrets directly from .env file (if kubectl supports it)

```bash
kubectl create secret generic oversea-secrets --from-env-file=.env
```
