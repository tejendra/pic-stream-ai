const express = require('express');
const { db, bucket } = require('../config/firebase');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Timestamp } = require('firebase-admin/firestore');

const router = express.Router();

// Create a new album
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 100 }),
  body('expirationDays').isIn([14, 30, 60])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { uid } = req.user;
    const { title, expirationDays = 30 } = req.body;

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);

    // Generate unique share token
    const shareToken = uuidv4();

    const albumData = {
      id: uuidv4(),
      title,
      expirationDays,
      expirationDate: Timestamp.fromDate(expirationDate),
      shareToken,
      createdBy: uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      memberCount: 1,
      mediaCount: 0
    };

    // Save album to Firestore
    await db.collection('albums').doc(albumData.id).set(albumData);

    // Add creator as admin member
    await db.collection('albumMembers').doc(`${albumData.id}_${uid}`).set({
      albumId: albumData.id,
      userId: uid,
      role: 'admin', // admin, member
      joinedAt: Timestamp.now()
    });

    res.status(201).json({
      message: 'Album created successfully',
      album: albumData
    });
  } catch (error) {
    console.error('Album creation error:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// Get user's albums (created and joined)
router.get('/', async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 20 } = req.query;

    // Get albums where user is a member
    const membersSnapshot = await db.collection('albumMembers')
      .where('userId', '==', uid)
      .get();

    const albumIds = membersSnapshot.docs.map(doc => doc.data().albumId);

    if (albumIds.length === 0) {
      return res.json({
        albums: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    }

    // Get album details
    const albumsQuery = db.collection('albums')
      .orderBy('updatedAt', 'desc');

    const albumsSnapshot = await albumsQuery.get();
    
    const albums = albumsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(album => albumIds.includes(album.id))
      .filter(album => album.expirationDate.toDate() > new Date()); // Only non-expired albums

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAlbums = albums.slice(startIndex, endIndex);

    res.json({
      albums: paginatedAlbums,
      total: albums.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// Get specific album details
router.get('/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { uid } = req.user;

    // Check if user is a member of this album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = { id: albumDoc.id, ...albumDoc.data() };

    // Check if album has expired
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ 
        error: 'Album has expired',
        expired: true,
        expirationDate: album.expirationDate
      });
    }

    // Get album members
    const membersSnapshot = await db.collection('albumMembers')
      .where('albumId', '==', albumId)
      .get();

    const members = membersSnapshot.docs.map(doc => doc.data());

    // Get media count
    const mediaSnapshot = await db.collection('media')
      .where('albumId', '==', albumId)
      .get();

    album.memberCount = members.length;
    album.mediaCount = mediaSnapshot.size;
    album.members = members;

    res.json({ album });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Join album via share token
router.post('/join/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { uid } = req.user;

    // Find album by share token
    const albumsSnapshot = await db.collection('albums')
      .where('shareToken', '==', shareToken)
      .limit(1)
      .get();

    if (albumsSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid or expired share link' });
    }

    const albumDoc = albumsSnapshot.docs[0];
    const album = { id: albumDoc.id, ...albumDoc.data() };

    // Check if album has expired
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ 
        error: 'This album has expired and its contents are no longer available',
        expired: true
      });
    }

    // Check if user is already a member
    const existingMember = await db.collection('albumMembers')
      .doc(`${album.id}_${uid}`)
      .get();

    if (existingMember.exists) {
      return res.status(409).json({ 
        error: 'You are already a member of this album',
        albumId: album.id
      });
    }

    // Add user as member
    await db.collection('albumMembers').doc(`${album.id}_${uid}`).set({
      albumId: album.id,
      userId: uid,
      role: 'member',
      joinedAt: Timestamp.now()
    });

    // Update album member count
    await db.collection('albums').doc(album.id).update({
      memberCount: album.memberCount + 1,
      updatedAt: Timestamp.now()
    });

    res.json({
      message: 'Successfully joined album',
      albumId: album.id,
      album: album
    });
  } catch (error) {
    console.error('Join album error:', error);
    res.status(500).json({ error: 'Failed to join album' });
  }
});

// Delete album (admin only)
router.delete('/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { uid } = req.user;

    // Check if user is admin of this album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists || memberDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Only album admin can delete album' });
    }

    // Get all media in the album to delete files from storage
    const mediaSnapshot = await db.collection('media')
      .where('albumId', '==', albumId)
      .get();

    const deletePromises = [];

    // Delete all media files from storage
    mediaSnapshot.docs.forEach(mediaDoc => {
      const media = mediaDoc.data();
      
      // Delete original file
      if (media.filePath) {
        deletePromises.push(
          bucket.file(media.filePath).delete().catch(err => 
            console.log(`Failed to delete original file ${media.filePath}:`, err)
          )
        );
      }

      // Delete thumbnail if exists
      if (media.thumbnailUrl) {
        const urlParts = media.thumbnailUrl.split('/');
        const thumbnailPath = urlParts.slice(-3).join('/'); // Get last 3 parts (thumbnails/albumId/filename)
        deletePromises.push(
          bucket.file(thumbnailPath).delete().catch(err => 
            console.log(`Failed to delete thumbnail ${thumbnailPath}:`, err)
          )
        );
      }

      // Delete preview if exists
      if (media.previewUrl) {
        const urlParts = media.previewUrl.split('/');
        const previewPath = urlParts.slice(-3).join('/'); // Get last 3 parts (previews/albumId/filename)
        deletePromises.push(
          bucket.file(previewPath).delete().catch(err => 
            console.log(`Failed to delete preview ${previewPath}:`, err)
          )
        );
      }
    });

    // Wait for all storage deletions to complete
    await Promise.all(deletePromises);

    // Delete all media documents
    const mediaBatch = db.batch();
    mediaSnapshot.docs.forEach(doc => {
      mediaBatch.delete(doc.ref);
    });

    // Delete all album members
    const membersSnapshot = await db.collection('albumMembers')
      .where('albumId', '==', albumId)
      .get();

    membersSnapshot.docs.forEach(doc => {
      mediaBatch.delete(doc.ref);
    });

    // Delete the album document
    mediaBatch.delete(db.collection('albums').doc(albumId));

    // Commit all deletions
    await mediaBatch.commit();

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Get album share link
router.get('/:albumId/share', async (req, res) => {
  try {
    const { albumId } = req.params;
    const { uid } = req.user;

    // Check if user is a member of this album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = { id: albumDoc.id, ...albumDoc.data() };

    // Check if album has expired
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ 
        error: 'Album has expired',
        expired: true
      });
    }

    const shareUrl = `${process.env.FRONTEND_URL}/join/${album.shareToken}`;

    res.json({
      shareUrl,
      shareToken: album.shareToken,
      expirationDate: album.expirationDate
    });
  } catch (error) {
    console.error('Get share link error:', error);
    res.status(500).json({ error: 'Failed to get share link' });
  }
});

module.exports = router; 