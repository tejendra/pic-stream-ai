const express = require('express');
const { db, bucket } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const router = express.Router();

// Get all media for an album
router.get('/album/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { uid } = req.user;
    const { page = 1, limit = 20, sortBy = 'uploadedAt', sortOrder = 'desc' } = req.query;

    // Verify user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists || !memberDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied to this album' });
    }

    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(albumId).get();
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = albumDoc.data();
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ 
        error: 'Album has expired',
        expired: true
      });
    }

    const offset = (page - 1) * limit;
    
    let query = db.collection('media')
      .where('albumId', '==', albumId)
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
      .where('albumId', '==', albumId)
      .get();
    
    const total = totalSnapshot.size;

    res.json({
      media,
      album,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get album media error:', error);
    res.status(500).json({ error: 'Failed to fetch album media' });
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

    // Check if user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${media.albumId}_${uid}`)
      .get();

    if (!memberDoc.exists || !memberDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(media.albumId).get();
    if (albumDoc.exists) {
      const album = albumDoc.data();
      if (album.expirationDate.toDate() < new Date()) {
        return res.status(410).json({ 
          error: 'Album has expired',
          expired: true
        });
      }
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

// Delete media file (user can delete their own uploads, admin can delete any)
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaDoc.data();

    // Check if user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${media.albumId}_${uid}`)
      .get();

    if (!memberDoc.exists || !memberDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const memberData = memberDoc.data();

    // Check if user can delete this media
    // User can delete their own uploads, admin can delete any
    if (media.uploadedBy !== uid && memberData.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from Firebase Storage
    const file = bucket.file(media.filePath);
    await file.delete();

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      const thumbnailPath = media.thumbnailUrl.split('/').slice(-2).join('/');
      const thumbnailFile = bucket.file(thumbnailPath);
      await thumbnailFile.delete();
    }

    // Delete preview if exists
    if (media.previewUrl) {
      const previewPath = media.previewUrl.split('/').slice(-2).join('/');
      const previewFile = bucket.file(previewPath);
      await previewFile.delete();
    }

    // Delete from Firestore
    await db.collection('media').doc(fileId).delete();

    // Update album media count
    await db.collection('albums').doc(media.albumId).update({
      mediaCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: Timestamp.now()
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

    // Check if user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${media.albumId}_${uid}`)
      .get();

    if (!memberDoc.exists || !memberDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(media.albumId).get();
    if (albumDoc.exists) {
      const album = albumDoc.data();
      if (album.expirationDate.toDate() < new Date()) {
        return res.status(410).json({ 
          error: 'Album has expired',
          expired: true
        });
      }
    }

    // Increment download count
    await db.collection('media').doc(fileId).update({
      downloads: media.downloads + 1
    });

    // Return download URL for original file
    res.json({
      downloadUrl: media.publicUrl,
      fileName: media.originalName,
      mimeType: media.mimeType
    });
  } catch (error) {
    console.error('Download media error:', error);
    res.status(500).json({ error: 'Failed to get download link' });
  }
});

module.exports = router; 