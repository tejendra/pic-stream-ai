import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useAlbum } from '../contexts/AlbumContext';
import createApiClient from '../utils/apiClient';

// Custom hook for managing albums with loading states
export const useAlbums = () => {
  const { user } = useAuth();
  const { 
    albums, 
    loading, 
    pagination, 
    createAlbum, 
    deleteAlbum,
    albumsQuery,
    isCreatingAlbum,
    isDeletingAlbum
  } = useAlbum();

  const handleCreateAlbum = async (title, expirationDays) => {
    try {
      await createAlbum({ title, expirationDays });
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    try {
      await deleteAlbum(albumId);
    } catch (err) {
      throw err;
    }
  };

  return {
    albums,
    loading,
    error: albumsQuery.error,
    pagination,
    createAlbum: handleCreateAlbum,
    deleteAlbum: handleDeleteAlbum,
    refetch: albumsQuery.refetch,
    isCreatingAlbum,
    isDeletingAlbum
  };
};

// Custom hook for a specific album using React Query
export const useAlbumDetails = (albumId) => {
  const { user } = useAuth();
  const api = createApiClient();

  const albumQuery = useQuery({
    queryKey: ['album', albumId],
    queryFn: async () => {
      if (!albumId) return null;
      const response = await api.get(`/albums/${albumId}`);
      return response.data.album;
    },
    enabled: !!user && !!albumId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    album: albumQuery.data,
    loading: albumQuery.isLoading,
    error: albumQuery.error,
    refetch: albumQuery.refetch
  };
}; 