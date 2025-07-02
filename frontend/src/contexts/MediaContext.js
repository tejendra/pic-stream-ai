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

  // Fetch album media
  const fetchAlbumMedia = async (albumId, page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc') => {
    setLoading(true);
    try {
      const api = createApiClient();
      const response = await api.get(`/media/album/${albumId}`, {
        params: { page, limit, sortBy, sortOrder }
      });

      setMedia(response.data.media);
      setPagination(response.data.pagination);
      return response.data;
    } catch (error) {
      console.error('Fetch album media error:', error);
      if (error.response?.status === 410) {
        toast.error('This album has expired');
      } else {
        toast.error('Failed to fetch album media');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Upload single file to album
  const uploadFile = async (file, albumId) => {
    try {
      const api = createApiClient();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('albumId', albumId);

      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('File uploaded successfully!');
      
      // Add new media to local state
      setMedia(prev => [response.data.media, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else if (error.response?.status === 400 && error.response.data.error?.includes('250MB')) {
        toast.error('File size exceeds 250MB limit');
      } else {
        toast.error('Upload failed');
      }
      throw error;
    }
  };

  // Upload multiple files to album
  const uploadMultipleFiles = async (files, albumId) => {
    try {
      const api = createApiClient();
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      formData.append('albumId', albumId);

      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`${files.length} files uploaded successfully!`);
      
      // Add new media to local state
      setMedia(prev => [...response.data.files, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Multiple upload error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else if (error.response?.status === 400 && error.response.data.error?.includes('250MB')) {
        toast.error('Some files exceed 250MB limit');
      } else {
        toast.error('Upload failed');
      }
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
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Failed to fetch media');
      }
      throw error;
    }
  };

  // Delete media (user can delete their own, admin can delete any)
  const deleteMedia = async (id) => {
    try {
      const api = createApiClient();
      await api.delete(`/media/${id}`);
      toast.success('Media deleted successfully');
      
      // Remove from local state
      setMedia(prev => prev.filter(item => item.id !== id));
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (error) {
      console.error('Delete media error:', error);
      if (error.response?.status === 403) {
        toast.error('You can only delete your own uploads');
      } else {
        toast.error('Failed to delete media');
      }
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
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Download failed');
      }
      throw error;
    }
  };

  // Clear media state
  const clearMedia = () => {
    setMedia([]);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    });
  };

  const value = {
    media,
    loading,
    pagination,
    fetchAlbumMedia,
    uploadFile,
    uploadMultipleFiles,
    getMedia,
    deleteMedia,
    downloadMedia,
    clearMedia
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}; 