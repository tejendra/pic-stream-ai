import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import createApiClient from '../utils/apiClient';

const getMedia = async ({ mediaId }) => {
  const api = createApiClient();
  const response = await api.get(`/media/${mediaId}`);
  return response.data;
};

// Hook for fetching individual media by ID
export const useMediaQuery = (mediaId) => {
  const { user } = useAuth();

  const {
    data: media,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['media', mediaId, user?.uid],
    queryFn: () => getMedia({ mediaId }),
    enabled: !!user && !!mediaId,
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

  return {
    media,
    loading: isLoading,
    error: error?.message || null,
    refetch
  };
};