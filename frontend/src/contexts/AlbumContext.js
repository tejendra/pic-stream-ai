import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import createApiClient from '../utils/apiClient';

const AlbumContext = createContext();

export const useAlbum = () => {
  const context = useContext(AlbumContext);
  if (!context) {
    throw new Error('useAlbum must be used within an AlbumProvider');
  }
  return context;
};

export const AlbumProvider = ({ children }) => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Use centralized API client
  const api = createApiClient();

  // Fetch user's albums
  const fetchAlbums = async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await api.get('/albums', {
        params: { page, limit }
      });

      setAlbums(response.data.albums);
      setPagination(response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch albums error:', error);
      toast.error('Failed to fetch albums');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create new album
  const createAlbum = async (title, expirationDays = 30) => {
    try {
      const response = await api.post('/albums', {
        title,
        expirationDays
      });

      toast.success('Album created successfully!');
      
      // Add new album to local state
      setAlbums(prev => [response.data.album, ...prev]);
      
      return response.data.album;
    } catch (error) {
      console.error('Create album error:', error);
      toast.error('Failed to create album');
      throw error;
    }
  };

  // Get specific album details
  const getAlbum = async (albumId) => {
    try {
      const response = await api.get(`/albums/${albumId}`);
      
      setCurrentAlbum(response.data.album);
      return response.data.album;
    } catch (error) {
      console.error('Get album error:', error);
      if (error.response?.status === 410) {
        toast.error('This album has expired');
      } else if (error.response?.status === 403) {
        toast.error('Access denied to this album');
      } else {
        toast.error('Failed to fetch album');
      }
      throw error;
    }
  };

  // Join album via share token
  const joinAlbum = async (shareToken) => {
    try {
      console.log('AlbumContext joinAlbum - shareToken:', shareToken);
      console.log('User token:', user?.token);
      
      console.log('API client created, making request to:', `/albums/join/${shareToken}`);
      
      const response = await api.post(`/albums/join/${shareToken}`);
      console.log('Join album response:', response.data);
      
      toast.success('Successfully joined album!');
      return response.data;
    } catch (error) {
      console.error('Join album error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 410) {
        toast.error('This album has expired');
      } else if (error.response?.status === 409) {
        // User is already a member, this is not an error
        return error.response.data;
      } else {
        toast.error('Failed to join album');
      }
      throw error;
    }
  };

  // Delete album (admin only)
  const deleteAlbum = async (albumId) => {
    try {
      await api.delete(`/albums/${albumId}`);
      
      toast.success('Album deleted successfully');
      
      // Remove from local state
      setAlbums(prev => prev.filter(album => album.id !== albumId));
      
      // Clear current album if it's the deleted one
      if (currentAlbum?.id === albumId) {
        setCurrentAlbum(null);
      }
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (error) {
      console.error('Delete album error:', error);
      if (error.response?.status === 403) {
        toast.error('Only album admin can delete album');
      } else {
        toast.error('Failed to delete album');
      }
      throw error;
    }
  };

  // Get album share link
  const getShareLink = async (albumId) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/albums/${albumId}/share`);
      return response.data;
    } catch (error) {
      console.error('Get share link error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Failed to get share link');
      }
      throw error;
    }
  };

  // Clear album state
  const clearAlbums = () => {
    setAlbums([]);
    setCurrentAlbum(null);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    });
  };

  const value = {
    albums,
    currentAlbum,
    loading,
    pagination,
    fetchAlbums,
    createAlbum,
    getAlbum,
    joinAlbum,
    deleteAlbum,
    getShareLink,
    clearAlbums,
    setCurrentAlbum
  };

  return (
    <AlbumContext.Provider value={value}>
      {children}
    </AlbumContext.Provider>
  );
}; 