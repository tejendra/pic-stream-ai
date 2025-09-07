// AI Generated - Needs Review
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Download, 
  Calendar, 
  User, 
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { sanitizeFilename } from '../utils/fileUtils';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  useTheme
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const MediaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();

  const { data: media, isLoading: loading, error } = useQuery({
    queryKey: ['media', id],
    queryFn: async () => {
      const response = await axios.get(`/api/media/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return response.data;
    },
    enabled: !!user && !!user.token && !!id && !authLoading
  });

  const download = async () => {
    try {
      // Download the original file directly from the API
      const response = await axios.get(`/api/media/${id}/download`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = encodeURIComponent(sanitizeFilename(media.originalName));
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    try {
      await download();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error || !media) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'error.main', mb: 1, fontWeight: 'semibold' }}>
            Media Not Found
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            {error ? (error.message || 'An error occurred while loading the media.') : 'The requested media could not be found.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
            sx={{ fontWeight: 'medium' }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
            sx={{ 
              color: 'text.secondary', 
              mb: 2,
              '&:hover': { color: 'text.primary' }
            }}
          >
            Back to Album
          </Button>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {media.originalName || 'Untitled'}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Media Display */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ overflow: 'hidden', boxShadow: 2 }}>
              {media.mimeType?.startsWith('image/') ? (
                <Box
                  component="img"
                  src={media.previewUrl || media.publicUrl}
                  alt={media.originalName || 'Image'}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <Box
                  component="video"
                  src={media.previewUrl || media.publicUrl}
                  controls
                  preload="metadata"
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: 400
                  }}
                >
                  Your browser does not support the video tag.
                </Box>
              )}
            </Card>
          </Grid>

          {/* Media Info */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Actions */}
              <Card sx={{ boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                    Actions
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Download size={16} />}
                    onClick={handleDownload}
                    sx={{ fontWeight: 'medium' }}
                  >
                    Download Original
                  </Button>
                </CardContent>
              </Card>

              {/* File Information */}
              <Card sx={{ boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                    File Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <User size={16} style={{ color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Uploaded by
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {media.uploadedByEmail || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} style={{ color: theme.palette.text.secondary }} />
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Uploaded
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {formatDate(media.uploadedAt, {format:{
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }})}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        File Size
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {formatFileSize(media.size)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                        File Type
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {media.mimeType}
                      </Typography>
                    </Box>
                    {media.album && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                          Album
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>
                          <Link 
                            to={`/album/${media.album.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {media.album.title}
                          </Link>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Album Navigation */}
              {media.album && (
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
                      Album Navigation
                    </Typography>
                    <Button
                      component={Link}
                      to={`/album/${media.album.id}`}
                      variant="outlined"
                      fullWidth
                      sx={{ fontWeight: 'medium' }}
                    >
                      View All Photos
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default MediaDetail;