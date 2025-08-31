// AI Generated - Needs Review
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material';

const NotFound = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
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
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default NotFound; 