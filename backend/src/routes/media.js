const express = require('express');
const { db, bucket } = require('../config/firebase');

const router = express.Router();

// Get user's media files
router.get('/my', async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;

    const offset = (page - 1) * limit;
    
    let query = db.collection('media')
      .where('uploadedBy', '==', uid)
      .orderBy(sortBy, sortOrder)
      .limit(parseInt(limit))
      .offset(offset);

    const snapshot = await query.get();
    const media = [];
    
    snapshot.forEach(doc => {
      media.push({ id: doc.id, ...doc.data() });
    });

    // Get total count
    const totalSnapshot = await db.collection('media')
      .where('uploadedBy', '==', uid)
      .get();
    
    const total = totalSnapshot.size;

    res.json({
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Get public media files
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc', tags } = req.query;

    const offset = (page - 1) * limit;
    
    let query = db.collection('media')
      .where('isPublic', '==', true)
      .orderBy(sortBy, sortOrder)
      .limit(parseInt(limit))
      .offset(offset);

    // Filter by tags if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.where('tags', 'array-contains-any', tagArray);
    }

    const snapshot = await query.get();
    const media = [];
    
    snapshot.forEach(doc => {
      media.push({ id: doc.id, ...doc.data() });
    });

    // Get total count
    let totalQuery = db.collection('media').where('isPublic', '==', true);
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      totalQuery = totalQuery.where('tags', 'array-contains-any', tagArray);
    }
    
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

    res.json({
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get public media error:', error);
    res.status(500).json({ error: 'Failed to fetch public media' });
  }
});

// Get single media file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaDoc.data();

    // Check if user can access this media
    if (!media.isPublic && media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment view count
    await db.collection('media').doc(fileId).update({
      views: media.views + 1
    });

    res.json({
      ...media,
      id: fileId
    });
  } catch (error) {
    console.error('Get single media error:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Update media metadata
router.put('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;
    const { title, description, tags, isPublic } = req.body;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaDoc.data();

    // Check if user owns this media
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true';
    
    updateData.updatedAt = new Date();

    await db.collection('media').doc(fileId).update(updateData);

    res.json({ message: 'Media updated successfully' });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Delete media file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaDoc.data();

    // Check if user owns this media
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from Firebase Storage
    const file = bucket.file(media.filePath);
    await file.delete();

    // Delete thumbnail if exists
    if (media.thumbnailPath) {
      const thumbnailFile = bucket.file(media.thumbnailPath);
      await thumbnailFile.delete();
    }

    // Delete from Firestore
    await db.collection('media').doc(fileId).delete();

    // Update user's storage usage
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      storageUsed: admin.firestore.FieldValue.increment(-media.size)
    });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Download media file
router.get('/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaDoc.data();

    // Check if user can access this media
    if (!media.isPublic && media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Increment download count
    await db.collection('media').doc(fileId).update({
      downloads: media.downloads + 1
    });

    // Get signed URL for download
    const file = bucket.file(media.filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      responseDisposition: `attachment; filename="${media.originalName}"`
    });

    res.json({
      downloadUrl: signedUrl,
      fileName: media.originalName
    });
  } catch (error) {
    console.error('Download media error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Search media
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20, tags, uploadedBy } = req.query;
    const { uid } = req.user;

    const offset = (page - 1) * limit;
    
    let query = db.collection('media');

    // Build query based on filters
    if (uploadedBy) {
      query = query.where('uploadedBy', '==', uploadedBy);
    } else {
      // If no specific user, only show public media or user's own
      query = query.where('isPublic', '==', true);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query = query.where('tags', 'array-contains-any', tagArray);
    }

    query = query.orderBy('uploadedAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    const snapshot = await query.get();
    const media = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Filter by search query if provided
      if (!q || 
          data.title.toLowerCase().includes(q.toLowerCase()) ||
          data.description.toLowerCase().includes(q.toLowerCase()) ||
          data.tags.some(tag => tag.toLowerCase().includes(q.toLowerCase()))) {
        media.push({ id: doc.id, ...data });
      }
    });

    res.json({
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: media.length
      }
    });
  } catch (error) {
    console.error('Search media error:', error);
    res.status(500).json({ error: 'Failed to search media' });
  }
});

module.exports = router; 