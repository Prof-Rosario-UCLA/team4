import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

export default axios.create({
    baseURL: BASE_URL
});

export const axiosPrivate =  axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json'},
    withCredentials: true
});

export const axiosAI = axios.create({
    baseURL: AI_SERVICE_URL,
    headers: { 'Content-Type': 'application/json' }
})