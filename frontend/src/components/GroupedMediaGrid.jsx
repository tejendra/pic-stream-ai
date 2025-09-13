// AI Generated - Needs Review
// This component is not used yet
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  User, 
  CheckSquare, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Avatar,
  Checkbox,
  Collapse,
  useTheme
} from '@mui/material';

const GroupedMediaGrid = ({ media, currentUserId, onDeleteMedia, onDownloadMedia, onDownloadSingleMedia }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const theme = useTheme();

  // Group media by uploader
  const groupedMedia = media.reduce((groups, item) => {
    const uploaderId = item.uploadedBy;
    if (!groups[uploaderId]) {
      groups[uploaderId] = [];
    }
    groups[uploaderId].push(item);
    return groups;
  }, {});

  const toggleGroup = (uploaderId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(uploaderId)) {
      newExpanded.delete(uploaderId);
    } else {
      newExpanded.add(uploaderId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleItemSelection = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleGroupSelection = (uploaderId) => {
    const groupItems = groupedMedia[uploaderId];
    const groupItemIds = groupItems.map(item => item.id);
    const allSelected = groupItemIds.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      groupItemIds.forEach(id => newSelected.delete(id));
    } else {
      groupItemIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const downloadSelected = async () => {
    if (selectedItems.size === 0) return;
    
    setDownloading(true);
    try {
      const selectedMedia = media.filter(item => selectedItems.has(item.id));
      await onDownloadMedia(selectedMedia);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const downloadGroup = async (uploaderId) => {
    const groupItems = groupedMedia[uploaderId];
    setDownloading(true);
    try {
      await onDownloadMedia(groupItems);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const isGroupSelected = (uploaderId) => {
    const groupItems = groupedMedia[uploaderId];
    return groupItems.length > 0 && groupItems.every(item => selectedItems.has(item.id));
  };

  const isGroupPartiallySelected = (uploaderId) => {
    const groupItems = groupedMedia[uploaderId];
    const selectedCount = groupItems.filter(item => selectedItems.has(item.id)).length;
    return selectedCount > 0 && selectedCount < groupItems.length;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Download Selected Button */}
      {selectedItems.size > 0 && (
        <Card sx={{ bgcolor: theme.palette.primary[50], border: `1px solid ${theme.palette.primary[200]}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckSquare size={20} style={{ color: theme.palette.primary.main, marginRight: 8 }} />
                <Typography sx={{ color: theme.palette.primary[800], fontWeight: 'medium' }}>
                  {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Download size={16} />}
                onClick={downloadSelected}
                disabled={downloading}
                sx={{ fontWeight: 'medium' }}
              >
                {downloading ? 'Downloading...' : `Download ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''}`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Grouped Media */}
      {Object.entries(groupedMedia).map(([uploaderId, groupItems]) => {
        const isExpanded = expandedGroups.has(uploaderId);
        const isSelected = isGroupSelected(uploaderId);
        const isPartiallySelected = isGroupPartiallySelected(uploaderId);
        const isCurrentUser = uploaderId === currentUserId;
        
        return (
          <Card key={uploaderId} sx={{ overflow: 'hidden' }}>
            {/* Group Header */}
            <CardContent sx={{ borderBottom: `1px solid ${theme.palette.divider}`, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => toggleGroup(uploaderId)}
                    sx={{ color: 'text.secondary' }}
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </IconButton>
                  
                  <Checkbox
                    checked={isSelected}
                    indeterminate={isPartiallySelected}
                    onChange={() => toggleGroupSelection(uploaderId)}
                    sx={{ color: 'primary.main' }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <User size={20} style={{ color: theme.palette.text.secondary, marginRight: 8 }} />
                    <Typography sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                      {isCurrentUser ? 'Your uploads' : `Uploaded by ${groupItems[0]?.uploadedByEmail || uploaderId}`}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                      ({groupItems.length} item{groupItems.length !== 1 ? 's' : ''})
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download size={16} />}
                  onClick={() => downloadGroup(uploaderId)}
                  disabled={downloading}
                  sx={{ fontWeight: 'medium' }}
                >
                  Download All
                </Button>
              </Box>
            </CardContent>

            {/* Group Content */}
            <Collapse in={isExpanded}>
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {groupItems.map((item) => (
                    <Grid item size={{ xs:12, sm: 6, md: 4, lg: 3, xl: 2.4 }} key={item.id}>
                      <Card sx={{ 
                        position: 'relative',
                        bgcolor: 'grey.50',
                        '&:hover': { boxShadow: 2 },
                        transition: 'box-shadow 0.2s ease-in-out'
                      }}>
                        {/* Selection Checkbox */}
                        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.8)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                            }}
                          />
                        </Box>

                        {/* Media Item */}
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
                        
                        {/* Actions */}
                        <CardContent sx={{ p: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <IconButton
                              size="small"
                              onClick={() => onDownloadSingleMedia(item)}
                              title="Download"
                              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                            >
                              <Download size={16} />
                            </IconButton>
                            
                            {isCurrentUser && (
                              <IconButton
                                size="small"
                                onClick={() => onDeleteMedia(item.id, item.originalName)}
                                title="Delete media"
                                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Collapse>
          </Card>
        );
      })}
    </Box>
  );
};

export default GroupedMediaGrid; 