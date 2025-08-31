// AI Generated - Needs Review
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlbums } from '../hooks';
import { 
  Image, 
  Calendar,
  Plus,
  Users,
  Clock,
  Trash2,
  Share2,
  Copy
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import createApiClient from '../utils/apiClient';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';

const Dashboard = () => {
  const { albums, loading, error, createAlbum, deleteAlbum } = useAlbums();
  const [shareUrl, setShareUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = useTheme();

  const formatDate = (date) => {
    if (!date) {
      return 'Invalid Date';
    }
    
    let dateObj;
    if (typeof date.toDate === 'function') {
      // Firestore Timestamp object
      dateObj = date.toDate();
    } else if (date._seconds) {
      // Plain object with _seconds and _nanoseconds
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      // JavaScript Date object
      dateObj = date;
    } else {
      console.error('Invalid date format:', date);
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString();
  };

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

  const handleCreateAlbum = () => {
    setShowCreateModal(true);
  };

  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    
    if (!albumTitle.trim()) {
      return;
    }

    const days = parseInt(expirationDays);
    if (![14, 30, 60].includes(days)) {
      return;
    }

    setIsCreating(true);
    try {
      await createAlbum(albumTitle.trim(), days);
      setShowCreateModal(false);
      setAlbumTitle('');
      setExpirationDays('30');
    } catch (error) {
      console.error('Failed to create album:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setAlbumTitle('');
    setExpirationDays('30');
    setIsCreating(false);
  };

  const handleDeleteAlbum = (albumId, albumTitle) => {
    setAlbumToDelete({ id: albumId, title: albumTitle });
    setShowDeleteModal(true);
  };

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAlbum(albumToDelete.id);
      setShowDeleteModal(false);
      setAlbumToDelete(null);
    } catch (error) {
      console.error('Failed to delete album:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteAlbum = () => {
    setShowDeleteModal(false);
    setAlbumToDelete(null);
    setIsDeleting(false);
  };

  const handleShareAlbum = async (albumId) => {
    try {
      const api = createApiClient();
      const response = await api.get(`/albums/${albumId}/share`);
      
      setShareUrl(response.data.shareUrl);
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

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'error.main', mb: 1, fontWeight: 'semibold' }}>
            Error Loading Albums
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Welcome to PicStream!
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            Create and manage your temporary photo sharing albums
          </Typography>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleCreateAlbum}
            sx={{ fontWeight: 'medium' }}
          >
            Create New Album
          </Button>
        </Box>

        {/* Albums List */}
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 2 }}>
              Your Albums
            </Typography>
            
            {albums.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Image size={48} style={{ color: theme.palette.text.secondary, margin: '0 auto 16px' }} />
                <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary', mb: 1 }}>
                  No albums yet
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                  Get started by creating your first album to share photos with friends and family.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus size={20} />}
                  onClick={handleCreateAlbum}
                  sx={{ fontWeight: 'medium' }}
                >
                  Create Album
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {albums.map((album) => {
                  const daysUntilExpiry = getDaysUntilExpiry(album.expirationDate);
                  const isExpired = daysUntilExpiry <= 0;
                  
                  return (
                    <Grid item xs={12} md={6} lg={4} key={album.id}>
                      <Card sx={{ 
                        height: '100%',
                        '&:hover': { boxShadow: 4 },
                        transition: 'box-shadow 0.2s ease-in-out'
                      }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                              {album.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleShareAlbum(album.id)}
                                title="Share album"
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                              >
                                <Share2 size={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAlbum(album.id, album.title)}
                                title="Delete album"
                                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Users size={16} style={{ color: theme.palette.text.secondary }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {album.memberCount} members
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Image size={16} style={{ color: theme.palette.text.secondary }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {album.mediaCount} photos/videos
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Calendar size={16} style={{ color: theme.palette.text.secondary }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Created {formatDate(album.createdAt)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          
                          <Button
                            component={Link}
                            to={`/album/${album.id}`}
                            variant="contained"
                            fullWidth
                            sx={{ fontWeight: 'medium' }}
                          >
                            View Album
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </CardContent>
        </Card>
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

      {/* Create Album Modal */}
      <Dialog open={showCreateModal} onClose={closeCreateModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Create New Album
            </Typography>
            <IconButton onClick={closeCreateModal}>
              <Typography variant="h6">×</Typography>
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateAlbumSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Album Title"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Enter album title"
              required
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Expiration Days</InputLabel>
              <Select
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                label="Expiration Days"
                required
              >
                <MenuItem value="14">14 days</MenuItem>
                <MenuItem value="30">30 days</MenuItem>
                <MenuItem value="60">60 days</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateModal} disabled={isCreating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAlbumSubmit}
            variant="contained"
            disabled={isCreating || !albumTitle.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Album'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Album Modal */}
      <Dialog open={showDeleteModal} onClose={cancelDeleteAlbum} maxWidth="sm" fullWidth>
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
              Delete "{albumToDelete?.title}"?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This action cannot be undone. The album and all its media will be permanently deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteAlbum} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteAlbum}
            variant="contained"
            color="error"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 