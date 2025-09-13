import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';
import { 
  Download, 
  Calendar, 
  User, 
  ArrowLeft
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  useTheme,
  Stack
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const MediaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const theme = useTheme();
  const { downloadSingleMedia } = useAlbumMediaQuery();
  const { media, loading, error } = useMediaQuery(id);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = () => {
    if (media) {
      downloadSingleMedia({ mediaId: id });
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
        <Grid size={{ xs:12, lg: 8 }}>
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
        </Grid>

        {/* Media Info */}
        <Grid size={{ xs:12, lg: 4 }}>
          <Stack direction="column" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Download size={16} />}
              onClick={handleDownload}
              sx={{ fontWeight: 'medium' }}
            >
              Download Original
            </Button>

            <Card>
              <CardContent >
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
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MediaDetail;