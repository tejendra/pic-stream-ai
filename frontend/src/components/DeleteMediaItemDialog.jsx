import React, {  } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button
} from '@mui/material';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';

const DeleteMediaItemDialog = ({open, onClose, albumId, mediaId, mediaName}) => {
  const { deleteMedia, isDeleting } = useAlbumMediaQuery(albumId);

  const onDeleteMediaItem = async () => {
    try {
      await deleteMedia({ mediaId });
      onClose();
    } catch (error) {
      console.error('Failed to delete media item:', error);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Delete "{mediaName}"
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          This item will be permanently deleted from the album.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button 
          onClick={onDeleteMediaItem}
          color="error"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMediaItemDialog;