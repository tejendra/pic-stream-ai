import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 16,
    md: 32,
    lg: 48,
    xl: 64
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <CircularProgress size={sizeMap[size]} />
    </Box>
  );
};

export default LoadingSpinner; 