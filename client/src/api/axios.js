import axios from 'axios';

// For production HTTPS
const BASE_URL = import.meta.env.PROD 
  ? 'https://team4.cs144.org/api'  // HTTPS with your domain
  : 'http://localhost:3000';

const AI_SERVICE_URL = import.meta.env.PROD
  ? 'https://team4.cs144.org/chat'  // Proxied through your server
  : 'http://localhost:8000';

export default axios.create({
    baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json'},
    withCredentials: true
});

export const axiosAI = axios.create({
    baseURL: AI_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' }
});