import React, { useState } from 'react';
import { Typography, Button, Grid, Card, Stack} from '@mui/material';
import { Plus } from 'lucide-react';
import AlbumCard from './AlbumCard';
import { useAlbums } from '../hooks';
import CreateAlbumDialog from './CreateAlbumDialog';

const AlbumList = () => {
  const { albums } = useAlbums();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
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
          sx={{
            maxWidth: { xs: '280px', sm: '200px' },
            width: 'auto',
            alignSelf: 'center'
          }}
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
          <Card>
            <AlbumCard album={album} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AlbumList;