import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlbum } from '../contexts/AlbumContext';

// Custom hook for managing albums with loading states
export const useAlbums = () => {
  const { user } = useAuth();
  const { 
    albums, 
    loading, 
    pagination, 
    fetchAlbums, 
    createAlbum, 
    deleteAlbum 
  } = useAlbum();
  const [error, setError] = useState(null);

  // Fetch albums when user changes
  useEffect(() => {
    if (user) {
      fetchAlbums().catch(err => {
        setError(err.message);
      });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear error when albums are successfully fetched
  useEffect(() => {
    if (albums.length > 0 && error) {
      setError(null);
    }
  }, [albums, error]);

  const handleCreateAlbum = async (title, expirationDays) => {
    try {
      setError(null);
      await createAlbum(title, expirationDays);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    try {
      setError(null);
      await deleteAlbum(albumId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    albums,
    loading,
    error,
    pagination,
    createAlbum: handleCreateAlbum,
    deleteAlbum: handleDeleteAlbum,
    refetch: () => fetchAlbums().catch(err => setError(err.message))
  };
};

// Custom hook for a specific album
export const useAlbumDetails = (albumId) => {
  const { user } = useAuth();
  const { currentAlbum, getAlbum, loading } = useAlbum();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && albumId) {
      setIsLoading(true);
      setError(null);
      
      getAlbum(albumId)
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, albumId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    album: currentAlbum,
    loading: loading || isLoading,
    error,
    refetch: () => getAlbum(albumId).catch(err => setError(err.message))
  };
}; 