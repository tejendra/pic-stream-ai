import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  User, 
  CheckSquare, 
  Square,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const GroupedMediaGrid = ({ media, currentUserId, onDeleteMedia, onDownloadMedia, onDownloadSingleMedia }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

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
    <div className="space-y-6">
      {/* Download Selected Button */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={downloadSelected}
              disabled={downloading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : `Download ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Grouped Media */}
      {Object.entries(groupedMedia).map(([uploaderId, groupItems]) => {
        const isExpanded = expandedGroups.has(uploaderId);
        const isSelected = isGroupSelected(uploaderId);
        const isPartiallySelected = isGroupPartiallySelected(uploaderId);
        const isCurrentUser = uploaderId === currentUserId;
        
        return (
          <div key={uploaderId} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Group Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleGroup(uploaderId)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleGroupSelection(uploaderId)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : isPartiallySelected ? (
                      <div className="h-5 w-5 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                        <div className="h-2 w-2 bg-white rounded-sm"></div>
                      </div>
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">
                      {isCurrentUser ? 'Your uploads' : `Uploaded by ${groupItems[0]?.uploadedByEmail || uploaderId}`}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({groupItems.length} item{groupItems.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadGroup(uploaderId)}
                    disabled={downloading}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download All
                  </button>
                </div>
              </div>
            </div>

            {/* Group Content */}
            {isExpanded && (
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {groupItems.map((item) => (
                    <div key={item.id} className="relative bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <button
                          onClick={() => toggleItemSelection(item.id)}
                          className="text-gray-400 hover:text-gray-600 bg-white bg-opacity-80 rounded"
                        >
                          {selectedItems.has(item.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Media Item */}
                      <Link to={`/media/${item.id}`}>
                        <div className="aspect-square overflow-hidden">
                          {item.mimeType?.startsWith('image/') ? (
                            <img
                              src={item.thumbnailUrl || item.publicUrl}
                              alt={item.originalName}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="relative w-full h-full bg-gray-100">
                              <img
                                src={item.thumbnailUrl || item.publicUrl}
                                alt={item.originalName}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black bg-opacity-50 rounded-full p-2">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      {/* Actions */}
                      <div className="p-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => onDownloadSingleMedia(item)}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          {isCurrentUser && (
                            <button
                              onClick={() => onDeleteMedia(item.id, item.originalName)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete media"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GroupedMediaGrid; 