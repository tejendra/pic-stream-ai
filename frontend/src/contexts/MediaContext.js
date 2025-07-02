import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const MediaContext = createContext();

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};

export const MediaProvider = ({ children }) => {
  const { user, refreshToken } = useAuth();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Create axios instance with auth token
  const createApiClient = () => {
    const client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 30000
    });

    // Add auth token to requests
    client.interceptors.request.use((config) => {
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
      return config;
    });

    // Handle token refresh on 401 errors
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          try {
            const newToken = await refreshToken();
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return client.request(error.config);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return client;
  };

  // Fetch user's media
  const fetchMyMedia = async (page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc') => {
    setLoading(true);
    try {
      const api = createApiClient();
      const response = await api.get('/media/my', {
        params: { page, limit, sortBy, sortOrder }
      });

      setMedia(response.data.media);
      setPagination(response.data.pagination);
      return response.data;
    } catch (error) {
      console.error('Fetch media error:', error);
      toast.error('Failed to fetch media');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch public media
  const fetchPublicMedia = async (page = 1, limit = 20, tags = null) => {
    setLoading(true);
    try {
      const api = createApiClient();
      const response = await api.get('/media/public', {
        params: { page, limit, tags }
      });

      setMedia(response.data.media);
      setPagination(response.data.pagination);
      return response.data;
    } catch (error) {
      console.error('Fetch public media error:', error);
      toast.error('Failed to fetch public media');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload single file
  const uploadFile = async (file, metadata = {}) => {
    try {
      const api = createApiClient();
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('File uploaded successfully!');
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      throw error;
    }
  };

  // Upload multiple files
  const uploadMultipleFiles = async (files, metadata = {}) => {
    try {
      const api = createApiClient();
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`${files.length} files uploaded successfully!`);
      return response.data;
    } catch (error) {
      console.error('Multiple upload error:', error);
      toast.error('Upload failed');
      throw error;
    }
  };

  // Get single media
  const getMedia = async (id) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/media/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get media error:', error);
      toast.error('Failed to fetch media');
      throw error;
    }
  };

  // Update media
  const updateMedia = async (id, updates) => {
    try {
      const api = createApiClient();
      const response = await api.put(`/media/${id}`, updates);
      toast.success('Media updated successfully');
      return response.data;
    } catch (error) {
      console.error('Update media error:', error);
      toast.error('Failed to update media');
      throw error;
    }
  };

  // Delete media
  const deleteMedia = async (id) => {
    try {
      const api = createApiClient();
      await api.delete(`/media/${id}`);
      toast.success('Media deleted successfully');
      
      // Remove from local state
      setMedia(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Delete media error:', error);
      toast.error('Failed to delete media');
      throw error;
    }
  };

  // Download media
  const downloadMedia = async (id) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/media/${id}/download`);
      
      // Create download link
      const link = document.createElement('a');
      link.href = response.data.downloadUrl;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
      return response.data;
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
      throw error;
    }
  };

  // Search media
  const searchMedia = async (query, page = 1, limit = 20, tags = null) => {
    setLoading(true);
    try {
      const api = createApiClient();
      const response = await api.get('/media/search', {
        params: { q: query, page, limit, tags }
      });

      setMedia(response.data.media);
      setPagination(response.data.pagination);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate share link
  const generateShareLink = async (fileId, options = {}) => {
    try {
      const api = createApiClient();
      const response = await api.post('/share/generate', {
        fileId,
        ...options
      });
      
      toast.success('Share link created successfully');
      return response.data;
    } catch (error) {
      console.error('Generate share error:', error);
      toast.error('Failed to create share link');
      throw error;
    }
  };

  // Get shared content
  const getSharedContent = async (shareToken, password = null) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/share/${shareToken}`, {
        params: { password }
      });
      return response.data;
    } catch (error) {
      console.error('Get shared content error:', error);
      throw error;
    }
  };

  // AI Enhance image
  const enhanceImage = async (fileId, options = {}) => {
    try {
      const api = createApiClient();
      const response = await api.post(`/ai/enhance/${fileId}`, options);
      toast.success('Image enhanced successfully');
      return response.data;
    } catch (error) {
      console.error('Enhance image error:', error);
      toast.error('Failed to enhance image');
      throw error;
    }
  };

  // Generate resized versions
  const generateResizedVersions = async (fileId, sizes = [300, 600, 1200]) => {
    try {
      const api = createApiClient();
      const response = await api.post(`/ai/resize/${fileId}`, { sizes });
      toast.success('Resized versions generated successfully');
      return response.data;
    } catch (error) {
      console.error('Resize error:', error);
      toast.error('Failed to generate resized versions');
      throw error;
    }
  };

  // Create collage
  const createCollage = async (fileIds, options = {}) => {
    try {
      const api = createApiClient();
      const response = await api.post('/ai/collage', {
        fileIds,
        ...options
      });
      toast.success('Collage created successfully');
      return response.data;
    } catch (error) {
      console.error('Collage error:', error);
      toast.error('Failed to create collage');
      throw error;
    }
  };

  const value = {
    media,
    loading,
    pagination,
    fetchMyMedia,
    fetchPublicMedia,
    uploadFile,
    uploadMultipleFiles,
    getMedia,
    updateMedia,
    deleteMedia,
    downloadMedia,
    searchMedia,
    generateShareLink,
    getSharedContent,
    enhanceImage,
    generateResizedVersions,
    createCollage
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}; 