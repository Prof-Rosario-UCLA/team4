import axios from 'axios';

// Temporarily hardcode your LoadBalancer IP for testing
const BASE_URL = 'http://35.233.161.58';  // Replace with your actual LoadBalancer IP
const AI_SERVICE_URL = 'http://35.233.161.58:8000';  // Same IP, port 8000

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