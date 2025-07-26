import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Create axios instance with auth token and refresh logic
const createApiClient = () => {
  const client = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000
  });

  // Add auth token to requests
  client.interceptors.request.use((config) => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      // Get the current token
      return user.getIdToken().then((token) => {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }
    
    return config;
  });

  // Handle token refresh on 401 errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          
          if (user) {
            // Force refresh the token
            const newToken = await user.getIdToken(true);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request
            return client.request(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, redirect to login
          window.location.href = '/';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

export default createApiClient; 