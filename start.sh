#!/bin/sh

# start node server
node server/server.js &

# start python AI service
exec uvicorn ai-service.api_server:app --host 0.0.0.0 --port 8000
