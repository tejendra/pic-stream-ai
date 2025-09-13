import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trash2} from 'lucide-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Avatar,
  Stack} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import DeleteMediaItemDialog from '../components/DeleteMediaItemDialog';
import { useAlbumMediaQuery } from '../hooks/useAlbumMediaQuery';

const MediaCard = ({item, albumId}) => {
  const { user } = useAuth();
  const { 
    downloadSingleMedia
  } = useAlbumMediaQuery(albumId);
  const [showDeleteMediaItemModal, setShowDeleteMediaItemModal] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);

  const closeDeleteMediaItemModal = () => {
    setShowDeleteMediaItemModal(false);
  };

  const openDeleteMediaItemModal = (id, name) => {
    setMediaToDelete({ id, name });
    setShowDeleteMediaItemModal(true);
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

  return (
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
      
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
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
              onClick={() => openDeleteMediaItemModal(item.id, item.originalName)}
              title="Delete media"
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <Trash2 size={16} />
            </IconButton>
          )}
        </Stack>
      </CardContent>
      <DeleteMediaItemDialog open={showDeleteMediaItemModal} onClose={closeDeleteMediaItemModal} albumId={albumId} mediaId={mediaToDelete?.id} mediaName={mediaToDelete?.name} />
    </Card>
  )
}

export default MediaCard;