import React, { useState } from 'react';
import { CardContent, Typography, Box, IconButton, Button, Card, Stack } from '@mui/material';
import { Share2, Users, Image, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { formatDate, getDaysUntilExpiry } from '../utils/dateUtils';
import ShareAlbumDialog from './ShareAlbumDialog';

const AlbumCard = ({album}) => {
  const theme = useTheme();
  const [showShareDialog, setShowShareDialog] = useState(false);

  const openShareDialog = () => {
    setShowShareDialog(true);
  };

  const closeShareDialog = () => {
    setShowShareDialog(false);
  };

  const daysUntilExpiry = getDaysUntilExpiry(album.expirationDate);
  const isExpired = daysUntilExpiry <= 0;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
              {album.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={openShareDialog}
                title="Share album"
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <Share2 size={16} />
              </IconButton>
          </Box>
        </Stack>
        
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
      <ShareAlbumDialog open={showShareDialog} onClose={closeShareDialog} albumId={album.id} />
    </Card>
  )
}

export default AlbumCard