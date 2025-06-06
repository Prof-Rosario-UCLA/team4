#!/bin/sh

# start node server
node server/server.js &

# start python AI service with correct working directory
cd ai-service && exec uvicorn api_server:app --host 0.0.0.0 --port 8000