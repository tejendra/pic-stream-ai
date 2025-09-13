import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';
import { useAlbumDetails } from '../hooks/useAlbums';
import { getDaysUntilExpiry } from '../utils/dateUtils';
import { 
  ArrowLeft,
  Share2,
  Users,
  Image as ImageIcon,
  Trash2,
  Clock} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InlineUpload from '../components/InlineUpload';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme
} from '@mui/material';
import ShareAlbumDialog from '../components/ShareAlbumDialog';
import DeleteAlbumDialog from '../components/DeleteAlbumDialog';
import MediaList from '../components/MediaList';

const Album = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const theme = useTheme();

  const { 
    media, 
    loading, 
    error, 
    refetch: fetchAlbumMedia 
  } = useAlbumMediaQuery(albumId);
  
  const { 
    album, 
    loading: albumLoading, 
    error: albumError 
  } = useAlbumDetails(albumId);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);

  const openDeleteAlbumModal = () => {
    setShowDeleteAlbumModal(true);
  };

  const closeDeleteAlbumModal = () => {
    setShowDeleteAlbumModal(false);
  };

  const handleUploadComplete = () => {
    // Refresh the media list after upload
    if (fetchAlbumMedia) {
      fetchAlbumMedia();
    }
  };

  const openShareAlbumModal = () => {
    setShowShareModal(true);
  };

  const closeShareAlbumModal = () => {
    setShowShareModal(false);
  };

  if (albumLoading || loading || authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (albumError || error || !album) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'error.main', mb: 1, fontWeight: 'semibold' }}>
            Album Not Found
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            {albumError || error || 'The requested album could not be found.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowLeft size={20} />}
            onClick={() => navigate('/dashboard')}
            sx={{ fontWeight: 'medium' }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(album.expirationDate);
  const isExpired = daysUntilExpiry <= 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowLeft size={20} />}
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2, color: 'text.secondary' }}
          >
            Back to Dashboard
          </Button>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 2, md: 0 }
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'text.primary',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                  wordBreak: 'break-word'
                }}
              >
                {album.title}
              </Typography>
              <Box sx={{ 
                mt: 1, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 1, sm: 3 },
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Users size={16} style={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {album.memberCount} Members
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ImageIcon size={16} style={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {album.mediaCount} Items
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Clock size={16} style={{ color: theme.palette.text.secondary }} />
                  {isExpired ? (
                    <Typography variant="body2" sx={{ color: 'error.main' }}>
                      Expired
                    </Typography>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: daysUntilExpiry <= 7 ? 'warning.main' : 'text.secondary' 
                      }}
                    >
                      Expires in {daysUntilExpiry} days
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 1 },
              width: { xs: '100%', sm: 'auto' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <Button
                variant="outlined"
                startIcon={<Share2 size={20} />}
                onClick={openShareAlbumModal}
                sx={{ 
                  fontWeight: 'medium',
                  minWidth: { xs: 'auto', sm: '120px' }
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Share Album
                </Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Share
                </Box>
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={20} />}
                onClick={openDeleteAlbumModal}
                sx={{ 
                  fontWeight: 'medium',
                  minWidth: { xs: 'auto', sm: '120px' }
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Delete Album
                </Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Delete
                </Box>
              </Button>
              <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
            </Box>
          </Box>
        </Box>

        {/* View Mode Toggle */}
        {/* {media.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                View:
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newValue) => newValue && setViewMode(newValue)}
                size="small"
              >
                <ToggleButton value="grouped">
                  Grouped by User
                </ToggleButton>
                <ToggleButton value="grid">
                  Grid View
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        )} */}

        <MediaList media={media} album={album} handleUploadComplete={handleUploadComplete} />
      </Container>
      <ShareAlbumDialog open={showShareModal} onClose={closeShareAlbumModal} albumId={albumId} />
      <DeleteAlbumDialog open={showDeleteAlbumModal} onClose={closeDeleteAlbumModal} albumId={albumId} />
    </Box>
  );
};

export default Album; 