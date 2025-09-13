import React, { useState } from 'react';
import { 
  Plus
} from 'lucide-react';
import {
  Button} from '@mui/material';
import UploadDialog from './UploadDialog';

const InlineUpload = ({ albumId, onUploadComplete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Plus size={20} />}
        onClick={() => setIsOpen(true)}
        sx={{ fontWeight: 'medium' }}
      >
        Add Photos
      </Button>
      <UploadDialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        albumId={albumId}
        onUploadComplete={onUploadComplete}
      />
    </>
  );
};

export default InlineUpload; 