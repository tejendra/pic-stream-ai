import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Alert,
  Link,
  Stack
} from '@mui/material';
import createApiClient from '../utils/apiClient';

const ShareAlbumDialog = ({open, onClose, albumId}) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShareAlbum = useCallback(async (albumId) => {
    if (!albumId) return;
    
    try {
      const api = createApiClient();
      const response = await api.get(`/albums/${albumId}/share`);
      
      setShareUrl(response.data.shareUrl);
    } catch (error) {
      console.error('Error getting share link:', error);
      alert('Failed to get share link');
    }
  }, []);

  useEffect(() => {
    if (open && albumId) {
      handleShareAlbum(albumId);
    }
  }, [open, albumId, handleShareAlbum]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Share Album
      </DialogTitle>
      <DialogContent sx={{ overflowX: 'clip'}}>
        <Stack gap={2}>
          <Typography variant="body1" >
            Copy and share the link to invite others to view your album.
          </Typography>
         
          <Typography variant="body2" component={Link}>
            {shareUrl}
          </Typography>
          <div>
            <Button
              onClick={() => copyToClipboard(shareUrl)}
              variant="contained"
            >
              Copy Link
            </Button>
          </div>
          {copied && (
            <Alert severity="success">
              Link copied to clipboard!
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareAlbumDialog;