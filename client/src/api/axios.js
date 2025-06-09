import axios from 'axios';

// Detect the current host dynamically
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Use the current browser location
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const port = window.location.port;
    
    // If accessing from the same host (production), use relative URL
    if (import.meta.env.PROD) {
      return '';  // Empty string means use relative URLs
    }
    
    // Development
    return 'http://localhost:3000';
  }
  
  return 'http://localhost:3000';
};

const BASE_URL = getBaseURL();

export default axios.create({
    baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json'},
    withCredentials: true
});

export const axiosAI = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});