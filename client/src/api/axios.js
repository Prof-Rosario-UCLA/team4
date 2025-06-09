import axios from 'axios';

// Detect the current host dynamically
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // If accessing from the same host (production), use relative URL
    if (import.meta.env.PROD) {
      return '';  // Empty string means use relative URLs
    }
    
    // Development
    return 'http://localhost:3000';
  }
  
  return 'http://localhost:3000';
};

// AI Service URL - port 8000
const getAIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (import.meta.env.PROD) {
      // In production, AI service runs on port 8000 of the same host
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      return `${protocol}//${host}:8000`;
    }
    
    // Development - AI service on localhost:8000
    return 'http://localhost:8000';
  }
  
  return 'http://localhost:8000';
};

const BASE_URL = getBaseURL();
const AI_BASE_URL = getAIBaseURL();

export default axios.create({
    baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json'},
    withCredentials: true
});

export const axiosAI = axios.create({
  baseURL: AI_BASE_URL,  // ✅ Now points to port 8000!
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});