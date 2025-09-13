import React, {  } from 'react';
import { 
  Image as ImageIcon} from 'lucide-react';
import InlineUpload from '../components/InlineUpload';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme} from '@mui/material';
import MediaCard from '../components/MediaCard';

const MediaList = ({ media, album, handleUploadComplete }) => {
  const theme = useTheme();

  if (media.length === 0) {
    return (
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
    )
  }

  return (
    <Grid container spacing={2}>
      {media.map((item) => (
        <Grid size={{ xs:12, sm: 6, md: 4, lg: 3, xl: 2.4 }} key={item.id}>
          <MediaCard item={item} albumId={album.id} />
        </Grid>
      ))}
    </Grid>
  );
};

export default MediaList;