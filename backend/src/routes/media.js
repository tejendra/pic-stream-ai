const express = require('express');
const { db, bucket } = require('../config/firebase');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');

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
    let filePath = media.filePath;
    console.log('Original filePath from media:', filePath);
    console.log('Public URL from media:', media.publicUrl);
    
    // If filePath contains a full URL, extract just the path
    if (filePath && filePath.includes('https://')) {
      console.log('FilePath contains URL, extracting path...');
      const urlParts = filePath.split('/');
      // Find the index after the bucket name
      const bucketNameIndex = urlParts.findIndex(part => part.includes('firebasestorage.app'));
      if (bucketNameIndex !== -1) {
        filePath = urlParts.slice(bucketNameIndex + 1).join('/');
        console.log('Extracted filePath:', filePath);
      }
    } else if (!filePath && media.publicUrl) {
      // Extract path from public URL if filePath is missing
      console.log('No filePath, extracting from publicUrl...');
      const urlParts = media.publicUrl.split('/');
      filePath = urlParts.slice(-2).join('/'); // Get last two parts (albumId/filename)
      console.log('Extracted filePath from publicUrl:', filePath);
    }
    
    if (filePath) {
      try {
        console.log('Attempting to delete main file:', filePath);
        const file = bucket.file(filePath);
        await file.delete();
        console.log('Successfully deleted main file');
      } catch (error) {
        console.error('Error deleting main file:', error);
        console.error('Attempted path:', filePath);
        // Continue with deletion even if main file deletion fails
      }
    } else {
      console.log('No valid filePath found, skipping main file deletion');
    }

    // Delete thumbnail if exists
    if (media.thumbnailUrl) {
      try {
        // Extract path from thumbnail URL - should be thumbnails/albumId/filename
        const urlParts = media.thumbnailUrl.split('/');
        const thumbnailPath = urlParts.slice(-3).join('/'); // Get last 3 parts (thumbnails/albumId/filename)
        console.log('Deleting thumbnail:', thumbnailPath);
        const thumbnailFile = bucket.file(thumbnailPath);
        await thumbnailFile.delete();
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
        // Continue with deletion even if thumbnail deletion fails
      }
    }

    // Delete preview if exists
    if (media.previewUrl) {
      try {
        // Extract path from preview URL - should be previews/albumId/filename
        const urlParts = media.previewUrl.split('/');
        const previewPath = urlParts.slice(-3).join('/'); // Get last 3 parts (previews/albumId/filename)
        console.log('Deleting preview:', previewPath);
        const previewFile = bucket.file(previewPath);
        await previewFile.delete();
      } catch (error) {
        console.error('Error deleting preview:', error);
        // Continue with deletion even if preview deletion fails
      }
    }

    // Delete from Firestore
    await db.collection('media').doc(fileId).delete();

    // Update album media count
    await db.collection('albums').doc(media.albumId).update({
      mediaCount: FieldValue.increment(-1),
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

    // Get the original file from Firebase Storage
    console.log('Media filePath:', media.filePath);
    console.log('Media publicUrl:', media.publicUrl);
    
    // Ensure we have a valid file path
    let filePath = media.filePath;
    console.log('Download - Original filePath from media:', filePath);
    console.log('Download - Public URL from media:', media.publicUrl);
    
    // If filePath contains a full URL, extract just the path
    if (filePath && filePath.includes('https://')) {
      console.log('Download - FilePath contains URL, extracting path...');
      const urlParts = filePath.split('/');
      // Find the index after the bucket name
      const bucketNameIndex = urlParts.findIndex(part => part.includes('firebasestorage.app'));
      if (bucketNameIndex !== -1) {
        filePath = urlParts.slice(bucketNameIndex + 1).join('/');
        console.log('Download - Extracted filePath:', filePath);
      }
    } else if (!filePath && media.publicUrl) {
      // Extract path from public URL if filePath is missing
      console.log('Download - No filePath, extracting from publicUrl...');
      const urlParts = media.publicUrl.split('/');
      filePath = urlParts.slice(-2).join('/'); // Get last two parts (albumId/filename)
      console.log('Download - Extracted filePath from publicUrl:', filePath);
    }
    
    if (!filePath) {
      return res.status(500).json({ error: 'Invalid file path' });
    }
    
    const file = bucket.file(filePath);
    
    // Set response headers for file download
    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${media.originalName}"`);
    
    // Stream the original file directly to the response
    file.createReadStream()
      .on('error', (error) => {
        console.error('File stream error:', error);
        console.error('Attempted file path:', filePath);
        res.status(500).json({ error: 'Failed to download file' });
      })
      .pipe(res);
  } catch (error) {
    console.error('Download media error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Download multiple media files as ZIP
router.post('/download-multiple', async (req, res) => {
  try {
    const { mediaIds } = req.body;
    const { uid } = req.user;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ error: 'Media IDs are required' });
    }

    // Get all media documents
    const mediaDocs = await Promise.all(
      mediaIds.map(id => db.collection('media').doc(id).get())
    );

    const mediaItems = [];
    const albumIds = new Set();

    // Validate all media items and collect album IDs
    for (const doc of mediaDocs) {
      if (!doc.exists) {
        return res.status(404).json({ error: 'One or more media items not found' });
      }

      const media = doc.data();
      mediaItems.push({ id: doc.id, ...media });
      albumIds.add(media.albumId);
    }

    // Check if user is a member of all albums
    for (const albumId of albumIds) {
      const memberDoc = await db.collection('albumMembers')
        .doc(`${albumId}_${uid}`)
        .get();

      if (!memberDoc.exists || !memberDoc.data().isActive) {
        return res.status(403).json({ error: 'Access denied to one or more albums' });
      }

      // Check if album has expired
      const albumDoc = await db.collection('albums').doc(albumId).get();
      if (albumDoc.exists) {
        const album = albumDoc.data();
        if (album.expirationDate.toDate() < new Date()) {
          return res.status(410).json({ 
            error: 'One or more albums have expired',
            expired: true
          });
        }
      }
    }

    // Increment download counts
    await Promise.all(
      mediaIds.map(id => 
        db.collection('media').doc(id).update({
          downloads: FieldValue.increment(1)
        })
      )
    );

    // Create ZIP file with original files
    const archiver = require('archiver');
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    // Set response headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="picstream_download_${Date.now()}.zip"`);

    // Pipe archive to response
    archive.pipe(res);

    // Add each file to the ZIP
    for (const media of mediaItems) {
      try {
        // Ensure we have a valid file path
        let filePath = media.filePath;
        
        // If filePath contains a full URL, extract just the path
        if (filePath && filePath.includes('https://')) {
          const urlParts = filePath.split('/');
          // Find the index after the bucket name
          const bucketNameIndex = urlParts.findIndex(part => part.includes('firebasestorage.app'));
          if (bucketNameIndex !== -1) {
            filePath = urlParts.slice(bucketNameIndex + 1).join('/');
          }
        } else if (!filePath && media.publicUrl) {
          // Extract path from public URL if filePath is missing
          const urlParts = media.publicUrl.split('/');
          filePath = urlParts.slice(-2).join('/'); // Get last two parts (albumId/filename)
        }
        
        if (!filePath) {
          console.error(`Invalid file path for media ${media.id}`);
          continue;
        }
        
        const file = bucket.file(filePath);
        const [buffer] = await file.download();
        
        archive.append(buffer, { name: media.originalName });
      } catch (error) {
        console.error(`Error adding file ${media.id} to ZIP:`, error);
        console.error('Attempted file path:', media.filePath);
        // Continue with other files
      }
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Download multiple media error:', error);
    res.status(500).json({ error: 'Failed to create download package' });
  }
});

module.exports = router; 