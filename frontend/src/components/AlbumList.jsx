import React, { useState } from 'react';
import { Box, Typography, Button, Grid, Card, Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Alert,
  Stack} from '@mui/material';
import { Plus, Copy } from 'lucide-react';
import AlbumCard from './AlbumCard';
import { useAlbums } from '../hooks';
import createApiClient from '../utils/apiClient';
import CreateAlbumDialog from './CreateAlbumDialog';

const AlbumList = () => {
  const { albums } = useAlbums();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
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


  if (albums.length === 0) {
    return (
      <Stack direction="column" sx={{ textAlign: 'center'}} gap={2}>
        <Typography variant="h5" color='text.primary'>
          No albums yet
        </Typography>
        <Typography color='text.secondary' sx={{ flexGrow: 2}}>
          Get started by creating your first album to share photos with friends and family.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={openCreateDialog}
        >
          New Album
        </Button>
        <CreateAlbumDialog open={showCreateDialog} onClose={closeCreateDialog} />
      </Stack>
    );
  }

  return (
    <Grid container spacing={2}>
      {albums.map((album) => (
        <Grid size={{ xs:12, sm: 6, md: 4, lg: 3 }} key={album.id}>
          <Card sx={{ 
            height: '100%',
            '&:hover': { boxShadow: 4 },
            transition: 'box-shadow 0.2s ease-in-out'
          }}>
            <AlbumCard album={album} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AlbumList;