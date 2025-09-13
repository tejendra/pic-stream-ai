import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button} from '@mui/material';

const NotFound = () => {
  return (
    <Container maxWidth="sm" sx={{ mt: 20 }}>
      <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 'semibold', mb: 1 }}>
        Page Not Found
      </Typography>
      <Typography sx={{ color: 'text.secondary', mb: 3 }}>
        Sorry, the page you are looking for does not exist.
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        sx={{ fontWeight: 'medium' }}
      >
        Go Home
      </Button>
    </Container>
  );
};

export default NotFound; 