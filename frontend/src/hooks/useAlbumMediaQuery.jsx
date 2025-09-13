import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import createApiClient from '../utils/apiClient';

// Fetch album media function
const fetchAlbumMedia = async ({ albumId, page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc' }) => {
  const api = createApiClient();
  const response = await api.get(`/media/album/${albumId}`, {
    params: { page, limit, sortBy, sortOrder }
  });
  return response.data;
};

// Upload single file function
const uploadFile = async ({ file, albumId }) => {
  const api = createApiClient();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('albumId', albumId);

  const response = await api.post('/upload/single', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Upload multiple files function
const uploadMultipleFiles = async ({ files, albumId }) => {
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
  return response.data;
};

// Delete media function
const deleteMedia = async ({ mediaId }) => {
  const api = createApiClient();
  await api.delete(`/media/${mediaId}`);
};

// Download single media function
const downloadSingleMedia = async ({ mediaId }) => {
  const api = createApiClient();
  
  // Download the original file directly from the API
  const response = await api.get(`/media/${mediaId}/download`, {
    responseType: 'blob'
  });
  
  return response.data;
};

// Download multiple media function
const downloadMultipleMedia = async ({ mediaItems }) => {
  const api = createApiClient();
  const response = await api.post('/media/download-multiple', {
    mediaIds: mediaItems.map(item => item.id)
  }, {
    responseType: 'blob'
  });
  return response.data;
};

export const useAlbumMediaQuery = (albumId, page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc') => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for album media
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['albumMedia', albumId, user?.uid, page, limit, sortBy, sortOrder],
    queryFn: () => fetchAlbumMedia({ albumId, page, limit, sortBy, sortOrder }),
    enabled: !!user && !!albumId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 403, 404, or 410 errors
      if (error?.response?.status === 403 || error?.response?.status === 404 || error?.response?.status === 410) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Upload single file mutation
  const uploadFileMutation = useMutation({
    mutationFn: ({ file }) => uploadFile({ file, albumId }),
    onSuccess: (data) => {
      toast.success('File uploaded successfully!');
      // Invalidate and refetch album media
      queryClient.invalidateQueries(['albumMedia', albumId]);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else if (error.response?.status === 400 && error.response.data.error?.includes('250MB')) {
        toast.error('File size exceeds 250MB limit');
      } else {
        toast.error('Upload failed');
      }
    }
  });

  // Upload multiple files mutation
  const uploadMultipleFilesMutation = useMutation({
    mutationFn: ({ files }) => uploadMultipleFiles({ files, albumId }),
    onSuccess: (data) => {
      toast.success(`${data.files.length} files uploaded successfully!`);
      // Invalidate and refetch album media
      queryClient.invalidateQueries(['albumMedia', albumId]);
    },
    onError: (error) => {
      console.error('Multiple upload error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else if (error.response?.status === 400 && error.response.data.error?.includes('250MB')) {
        toast.error('Some files exceed 250MB limit');
      } else {
        toast.error('Upload failed');
      }
    }
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: ({ mediaId }) => deleteMedia({ mediaId }),
    onSuccess: () => {
      toast.success('Media deleted successfully');
      // Invalidate and refetch album media
      queryClient.invalidateQueries(['albumMedia', albumId]);
    },
    onError: (error) => {
      console.error('Delete media error:', error);
      if (error.response?.status === 403) {
        toast.error('You can only delete your own uploads');
      } else {
        toast.error('Failed to delete media');
      }
    }
  });

  // Download single media mutation
  const downloadSingleMediaMutation = useMutation({
    mutationFn: ({ mediaId }) => downloadSingleMedia({ mediaId }),
    onSuccess: (data, variables) => {
      // Create download link for single file
      const blob = new Blob([data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = variables.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('File downloaded successfully');
    },
    onError: (error) => {
      console.error('Download single error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Download failed');
      }
    }
  });

  // Download multiple media mutation
  const downloadMultipleMediaMutation = useMutation({
    mutationFn: ({ mediaItems }) => downloadMultipleMedia({ mediaItems }),
    onSuccess: (data, variables) => {
      // Create download link for zip file
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `download_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${variables.mediaItems.length} files downloaded as zip`);
    },
    onError: (error) => {
      console.error('Download multiple error:', error);
      if (error.response?.status === 410) {
        toast.error('Album has expired');
      } else {
        toast.error('Download failed');
      }
    }
  });

  return {
    // Query data
    media: data?.media || [],
    album: data?.album,
    pagination: data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    },
    loading: isLoading,
    error: error?.message || null,
    
    // Mutations
    uploadFile: uploadFileMutation.mutate,
    uploadMultipleFiles: uploadMultipleFilesMutation.mutate,
    deleteMedia: deleteMediaMutation.mutate,
    downloadSingleMedia: downloadSingleMediaMutation.mutate,
    downloadMultipleMedia: downloadMultipleMediaMutation.mutate,
    
    // Loading states
    isUploading: uploadFileMutation.isLoading,
    isUploadingMultiple: uploadMultipleFilesMutation.isLoading,
    isDeleting: deleteMediaMutation.isLoading,
    isDownloadingSingle: downloadSingleMediaMutation.isLoading,
    isDownloading: downloadMultipleMediaMutation.isLoading,
    
    // Refetch function
    refetch
  };
}; 