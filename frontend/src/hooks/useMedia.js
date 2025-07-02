import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMedia } from '../contexts/MediaContext';

// Custom hook for managing album media with loading states
export const useAlbumMedia = (albumId) => {
  const { user } = useAuth();
  const { 
    media, 
    loading, 
    pagination, 
    fetchAlbumMedia, 
    uploadFile, 
    uploadMultipleFiles,
    deleteMedia,
    downloadMedia,
    clearMedia
  } = useMedia();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch album media when user or albumId changes
  useEffect(() => {
    if (user && albumId) {
      setIsLoading(true);
      setError(null);
      
      fetchAlbumMedia(albumId)
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [user, albumId]);

  // Clear media when albumId changes
  useEffect(() => {
    if (albumId) {
      clearMedia();
    }
  }, [albumId]);

  // Clear error when media is successfully fetched
  useEffect(() => {
    if (media.length > 0 && error) {
      setError(null);
    }
  }, [media, error]);

  const handleUploadFile = async (file) => {
    try {
      setError(null);
      await uploadFile(file, albumId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleUploadMultipleFiles = async (files) => {
    try {
      setError(null);
      await uploadMultipleFiles(files, albumId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      setError(null);
      await deleteMedia(mediaId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleDownloadMedia = async (mediaId) => {
    try {
      setError(null);
      await downloadMedia(mediaId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    media,
    loading: loading || isLoading,
    error,
    pagination,
    uploadFile: handleUploadFile,
    uploadMultipleFiles: handleUploadMultipleFiles,
    deleteMedia: handleDeleteMedia,
    downloadMedia: handleDownloadMedia,
    refetch: () => fetchAlbumMedia(albumId).catch(err => setError(err.message))
  };
};

// Custom hook for a specific media item
export const useMediaDetails = (mediaId) => {
  const { user } = useAuth();
  const { getMedia, downloadMedia } = useMedia();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && mediaId) {
      setLoading(true);
      setError(null);
      
      getMedia(mediaId)
        .then(data => {
          setMedia(data);
        })
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, mediaId]);

  const handleDownload = async () => {
    try {
      setError(null);
      await downloadMedia(mediaId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    media,
    loading,
    error,
    download: handleDownload,
    refetch: () => getMedia(mediaId).then(setMedia).catch(err => setError(err.message))
  };
}; 