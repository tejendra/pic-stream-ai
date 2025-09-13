import React, { useState } from 'react';
import { useAlbums } from '../hooks';
import { Plus} from 'lucide-react';
import {
  Typography,
  Button,
  Stack,
} from '@mui/material';
import CreateAlbumDialog from '../components/CreateAlbumDialog';
import AlbumList from '../components/AlbumList';

const Header = ({numberOfAlbums, onCreateAlbum}) => {
  if (numberOfAlbums === 0) {
    return null;
  }

  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center'}}>
      <Typography variant="h5" sx={{  display: 'inline-block' }}>
        Your Albums
      </Typography>
      <Button
        variant="contained"
        startIcon={<Plus size={20} />}
        onClick={onCreateAlbum}
      >
        New Album
      </Button>
    </Stack>
  )
}

const Dashboard = () => {
  const { albums, loading, error } = useAlbums();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const handleCreateAlbum = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <Typography variant="h5" color='text.primary' sx={{textAlign: 'center', p: 2 }}>
        Fetching your memories...
      </Typography>
    );
  }

  if (error) {
    return (
      <Stack direction="column" sx={{ textAlign: 'center', p:2 }} gap={2}>
        <Typography variant="h5" color='error.main'>
          Error Loading Albums
        </Typography>
        <Typography color='text.primary'>{error}</Typography>
      </Stack>
    );
  }

  return (
    <Stack sx={{ p: 2 }} gap={2}>
      <Header numberOfAlbums={albums.length} onCreateAlbum={handleCreateAlbum} />
      <AlbumList />
      <CreateAlbumDialog open={showCreateModal} onClose={closeCreateModal} />
    </Stack>
  );
};

export default Dashboard; 