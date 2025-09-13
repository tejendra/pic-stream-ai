import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const api = createApiClient();

  // Query keys
  const albumKeys = {
    all: ['albums'],
    lists: () => [...albumKeys.all, 'list'],
    list: (filters) => [...albumKeys.lists(), filters],
    details: () => [...albumKeys.all, 'detail'],
    detail: (id) => [...albumKeys.details(), id],
  };

  // Fetch albums query
  const albumsQuery = useQuery({
    queryKey: albumKeys.list({ page: 1, limit: 20 }),
    queryFn: async () => {
      const response = await api.get('/albums', {
        params: { page: 1, limit: 20 }
      });
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create album mutation
  const createAlbumMutation = useMutation({
    mutationFn: async ({ title, expirationDays = 30 }) => {
      const response = await api.post('/albums', {
        title,
        expirationDays
      });
      return response.data.album;
    },
    onSuccess: (newAlbum) => {
      toast.success('Album created successfully!');
      // Invalidate and refetch albums list
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
    },
    onError: (error) => {
      console.error('Create album error:', error);
      toast.error('Failed to create album');
    }
  });

  // Get specific album query
  const albumDetailQuery = useQuery({
    queryKey: albumKeys.detail(null),
    queryFn: async () => null, // This will be overridden when albumId is provided
    enabled: false, // Disabled by default, will be enabled when albumId is provided
  });

  // Join album mutation
  const joinAlbumMutation = useMutation({
    mutationFn: async (shareToken) => {
      const response = await api.post(`/albums/join/${shareToken}`);
      console.log('response', response);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Successfully joined album!');
      // Invalidate albums list to refresh with new album
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
    },
    onError: (error) => {
      if (error.response?.status === 410) {
        toast.error('This album has expired');
      } else if (error.response?.status === 409) {
        // User is already a member, this is not an error
        return error.response.data;
      } else {
        toast.error('Failed to join album');
      }
    }
  });

  // Delete album mutation
  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId) => {
      await api.delete(`/albums/${albumId}`);
      return albumId;
    },
    onSuccess: (albumId) => {
      toast.success('Album deleted successfully');
      
      // Invalidate and refetch albums list
      queryClient.invalidateQueries({ queryKey: albumKeys.lists() });
      
      // Also invalidate album details if it was the current album
      queryClient.invalidateQueries({ queryKey: albumKeys.details() });
    },
    onError: (error) => {
      console.error('Delete album error:', error);
      if (error.response?.status === 403) {
        toast.error('Only album admin can delete album');
      } else {
        toast.error('Failed to delete album');
      }
    }
  });

  // Get share link mutation
  const getShareLinkMutation = useMutation({
    mutationFn: async (albumId) => {
      const response = await api.get(`/albums/${albumId}/share`);
      return response.data;
    },
    onError: (error) => {
      console.error('Get share link error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Failed to get share link');
      }
    }
  });

  // Helper function to get album details
  const getAlbum = async (albumId) => {
    if (!albumId) return null;
    
    try {
      const response = await api.get(`/albums/${albumId}`);
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

  // Helper function to fetch albums with pagination
  const fetchAlbums = async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/albums', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Fetch albums error:', error);
      toast.error('Failed to fetch albums');
      throw error;
    }
  };

  // Clear album state
  const clearAlbums = () => {
    queryClient.removeQueries({ queryKey: albumKeys.all });
  };

  const value = {
    // Query data
    albums: albumsQuery.data?.albums || [],
    currentAlbum: albumDetailQuery.data,
    loading: albumsQuery.isLoading,
    pagination: albumsQuery.data || { page: 1, limit: 20, total: 0, pages: 0 },
    
    // Query states
    albumsQuery,
    albumDetailQuery,
    
    // Mutations
    createAlbum: createAlbumMutation.mutate,
    joinAlbum: joinAlbumMutation.mutateAsync,
    deleteAlbum: deleteAlbumMutation.mutate,
    getShareLink: getShareLinkMutation.mutate,
    
    // Helper functions
    getAlbum,
    fetchAlbums,
    clearAlbums,
    
    // Mutation states
    isCreatingAlbum: createAlbumMutation.isPending,
    isJoiningAlbum: joinAlbumMutation.isPending,
    isDeletingAlbum: deleteAlbumMutation.isPending,
    isGettingShareLink: getShareLinkMutation.isPending,
  };

  return (
    <AlbumContext.Provider value={value}>
      {children}
    </AlbumContext.Provider>
  );
}; 