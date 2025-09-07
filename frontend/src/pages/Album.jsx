// AI Generated - Needs Review
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';
import { useAlbum } from '../contexts/AlbumContext';
import { 
  ArrowLeft,
  Share2,
  Calendar,
  Users,
  Image as ImageIcon,
  Trash2,
  Clock,
  Copy
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InlineUpload from '../components/InlineUpload';
import GroupedMediaGrid from '../components/GroupedMediaGrid';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const Album = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const theme = useTheme();
  
  // Add a useEffect to track when the component mounts
  React.useEffect(() => {
    console.log('Album component mounted with albumId:', albumId);
  }, [albumId]);

  const { 
    media, 
    loading, 
    error, 
    deleteMedia, 
    downloadSingleMedia,
    downloadMultipleMedia, 
    refetch: fetchAlbumMedia 
  } = useAlbumMediaQuery(albumId);
  const { deleteAlbum, isDeletingAlbum } = useAlbum();
  const [album, setAlbum] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grouped' or 'grid'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlbumModal, setShowDeleteAlbumModal] = useState(false);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const response = await fetch(`/api/albums/${albumId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch album: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setAlbum(data.album);
        setAlbumError(null); // Clear any previous errors
      } catch (error) {
        setAlbumError(error.message);
      } finally {
        setAlbumLoading(false);
      }
    };

    if (user && albumId && !authLoading) {
      setAlbumLoading(true);
      setAlbumError(null);
      fetchAlbum();
    }
  }, [albumId, user?.uid, user?.token, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDaysUntilExpiry = (expirationDate) => {
    if (!expirationDate) {
      return -1; // Treat as expired
    }
    
    let expiryDate;
    if (typeof expirationDate.toDate === 'function') {
      // Firestore Timestamp object
      expiryDate = expirationDate.toDate();
    } else if (expirationDate._seconds) {
      // Plain object with _seconds and _nanoseconds
      expiryDate = new Date(expirationDate._seconds * 1000);
    } else if (expirationDate instanceof Date) {
      // JavaScript Date object
      expiryDate = expirationDate;
    } else {
      console.error('Invalid expiration date format:', expirationDate);
      return -1; // Treat as expired
    }
    
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDeleteMedia = (mediaId, mediaName) => {
    setMediaToDelete({ id: mediaId, name: mediaName });
    setShowDeleteModal(true);
  };

  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteMedia({ mediaId: mediaToDelete.id });
      setShowDeleteModal(false);
      setMediaToDelete(null);
    } catch (error) {
      console.error('Failed to delete media:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteMedia = () => {
    setShowDeleteModal(false);
    setMediaToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteAlbum = () => {
    setShowDeleteAlbumModal(true);
  };

  const confirmDeleteAlbum = async () => {
    try {
      await deleteAlbum(albumId);
      setShowDeleteAlbumModal(false);
      // Navigate back to dashboard after successful deletion
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete album:', error);
    }
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteAlbumModal(false);
  };

  const handleUploadComplete = () => {
    // Refresh the media list after upload
    if (fetchAlbumMedia) {
      fetchAlbumMedia();
    }
  };

  const handleDownloadMedia = async (mediaItems) => {
    try {
      downloadMultipleMedia({ mediaItems });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadSingleMedia = async (mediaItem) => {
    try {
      downloadSingleMedia({ 
        mediaId: mediaItem.id, 
        fileName: mediaItem.originalName 
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShareAlbum = async () => {
    try {
      const response = await fetch(`/api/albums/${albumId}/share`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get share link');
      }
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error getting share link:', error);
      alert('Failed to get share link');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {album.title}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Users size={16} style={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {album.memberCount} members
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ImageIcon size={16} style={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {album.mediaCount} photos/videos
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar size={16} style={{ color: theme.palette.text.secondary }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Created {formatDate(album.createdAt)}
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
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Share2 size={20} />}
                onClick={handleShareAlbum}
                sx={{ fontWeight: 'medium' }}
              >
                Share Album
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={20} />}
                onClick={handleDeleteAlbum}
                disabled={isDeletingAlbum}
                sx={{ fontWeight: 'medium' }}
              >
                Delete Album
              </Button>
              <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
            </Box>
          </Box>
        </Box>

        {/* View Mode Toggle */}
        {media.length > 0 && (
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
        )}

        {/* Media Grid */}
        {media.length === 0 ? (
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ py: 6, textAlign: 'center' }}>
              <ImageIcon size={48} style={{ color: theme.palette.text.secondary, margin: '0 auto 16px' }} />
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>
                No photos yet
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                Get started by adding photos to this album.
              </Typography>
              <InlineUpload albumId={album.id} onUploadComplete={handleUploadComplete} />
            </CardContent>
          </Card>
        ) : viewMode === 'grouped' ? (
          <GroupedMediaGrid 
            media={media} 
            currentUserId={user.uid}
            onDeleteMedia={handleDeleteMedia}
            onDownloadMedia={handleDownloadMedia}
            onDownloadSingleMedia={handleDownloadSingleMedia}
          />
        ) : (
          <Grid container spacing={2}>
            {media.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={item.id}>
                <Card sx={{ 
                  height: '100%',
                  '&:hover': { boxShadow: 4 },
                  transition: 'box-shadow 0.2s ease-in-out'
                }}>
                  <Link to={`/media/${item.id}`} style={{ textDecoration: 'none' }}>
                    <Box sx={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                      {item.mimeType?.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={item.thumbnailUrl || item.publicUrl}
                          alt={item.originalName}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              transition: 'transform 0.2s ease-in-out'
                            }
                          }}
                        />
                      ) : (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: theme.palette.grey[100] }}>
                          <Box
                            component="img"
                            src={item.thumbnailUrl || item.publicUrl}
                            alt={item.originalName}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Avatar sx={{ bgcolor: 'rgba(0,0,0,0.5)' }}>
                              <Typography variant="h6" sx={{ color: 'white' }}>▶</Typography>
                            </Avatar>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Link>
                  
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadSingleMedia(item)}
                        title="Download"
                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      >
                        <Typography variant="h6">↓</Typography>
                      </IconButton>
                      {item.uploadedBy === user.uid && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteMedia(item.id, item.originalName)}
                          title="Delete media"
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Share Modal */}
      <Dialog open={showShareModal} onClose={() => setShowShareModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Share Album
            </Typography>
            <IconButton onClick={() => setShowShareModal(false)}>
              <Typography variant="h6">×</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1, color: 'text.primary' }}>
              Share Link
            </Typography>
            <Box sx={{ display: 'flex' }}>
              <TextField
                value={shareUrl}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
              />
              <Button
                onClick={() => copyToClipboard(shareUrl)}
                variant="outlined"
                sx={{ 
                  borderTopLeftRadius: 0, 
                  borderBottomLeftRadius: 0,
                  borderLeft: 'none'
                }}
              >
                <Copy size={16} />
              </Button>
            </Box>
            {copied && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Link copied to clipboard!
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareModal(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Media Modal */}
      <Dialog open={showDeleteModal} onClose={cancelDeleteMedia} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Delete Media
            </Typography>
            <IconButton onClick={cancelDeleteMedia}>
              <Typography variant="h6">×</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: theme.palette.error[100],
                color: 'error.main',
                mx: 'auto',
                mb: 2
              }}
            >
              <Typography variant="h6">!</Typography>
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
              Delete "{mediaToDelete?.name}"?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This action cannot be undone. The file will be permanently deleted from the album.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteMedia} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteMedia}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Album Modal */}
      <Dialog open={showDeleteAlbumModal} onClose={cancelDeleteAlbum} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Delete Album
            </Typography>
            <IconButton onClick={cancelDeleteAlbum}>
              <Typography variant="h6">×</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: theme.palette.error[100],
                color: 'error.main',
                mx: 'auto',
                mb: 2
              }}
            >
              <Typography variant="h6">!</Typography>
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
              Delete "{album?.title}"?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This action cannot be undone. The album and all its media will be permanently deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteAlbum} disabled={isDeletingAlbum}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteAlbum}
            variant="contained"
            color="error"
            disabled={isDeletingAlbum}
          >
            {isDeletingAlbum ? 'Deleting...' : 'Delete Album'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Album; 