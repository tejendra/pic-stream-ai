import React, {  } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAlbum } from '../contexts/AlbumContext';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';

const DeleteAlbumDialog = ({open, onClose, albumId}) => {
  const { deleteAlbum, isDeletingAlbum } = useAlbum();
  const navigate = useNavigate();
  const { album } = useAlbumMediaQuery(albumId);

  const onDeleteAlbum = async () => {
    try {
      await deleteAlbum(albumId);
      onClose();
      // Navigate back to dashboard after successful deletion
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete album:', error);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Delete Album "{album?.title}"
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          The album and all its media will be permanently deleted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={onDeleteAlbum}
          variant="text"
          color="error"
          disabled={isDeletingAlbum}
        >
          {isDeletingAlbum ? 'Deleting...' : 'Delete Album'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAlbumDialog;