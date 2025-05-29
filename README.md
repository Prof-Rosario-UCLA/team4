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
# Root (Optional if using shared tools or scripts)
# -------------------------------
cd ..
npm install
```
