import axios from 'axios';

// Configure your FastAPI base URL here
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  scanEmail: async (data) => {
    // data: { sender, subject, content }
    const response = await api.post('/scan-email', data);
    return response.data;
  },
  
  scanMessage: async (message) => {
    // message: string
    const response = await api.post('/scan-message', { message });
    return response.data;
  },
  
  scanURL: async (url) => {
    // url: string
    const response = await api.post('/scan-url', { url });
    return response.data;
  },
  
  scanImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);
    const response = await api.post('/scan-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  scanVideo: async (videoFile) => {
    const formData = new FormData();
    formData.append('file', videoFile);
    const response = await api.post('/scan-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  scanAudio: async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const response = await api.post('/scan-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  scanPrompt: async (prompt) => {
    // prompt: string
    const response = await api.post('/scan-prompt', { prompt });
    return response.data;
  }
};
