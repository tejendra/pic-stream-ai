import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, IconButton, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useState } from 'react';
import { useAlbums } from '../hooks';

const CreateAlbumDialog = ({ open, onClose }) => {
  const [albumTitle, setAlbumTitle] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');

  const { createAlbum, isCreatingAlbum } = useAlbums();

  const handleCreateAlbumSubmit = async (e) => {
    e.preventDefault();
    
    if (!albumTitle.trim()) {
      return;
    }

    const days = parseInt(expirationDays);
    if (![14, 30, 60].includes(days)) {
      return;
    }

    try {
      await createAlbum(albumTitle.trim(),days);
      setAlbumTitle('');
      setExpirationDays('30');
      onClose();
    } catch (error) {
      console.error('Failed to create album:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            Create New Album
          </Typography>
          <IconButton onClick={onClose}>
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
        <Button onClick={onClose} disabled={isCreatingAlbum}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateAlbumSubmit}
          variant="contained"
          disabled={isCreatingAlbum || !albumTitle.trim()}
        >
          {isCreatingAlbum ? 'Creating...' : 'Create Album'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAlbumDialog;