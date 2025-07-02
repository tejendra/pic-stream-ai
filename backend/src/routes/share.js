const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/firebase');
const { optionalAuth } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { bucket } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const router = express.Router();

// Generate share link
router.post('/generate', async (req, res) => {
  try {
    const { uid } = req.user;
    const { fileId, expiresAt, password, allowDownload = true } = req.body;

    // Verify file exists and user owns it
    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate share token
    const shareToken = uuidv4();
    const shareId = uuidv4();

    // Create share record
    const shareData = {
      id: shareId,
      shareToken,
      fileId,
      uploadedBy: uid,
      createdAt: Timestamp.now(),
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      password: password ? await bcrypt.hash(password, 10) : null,
      allowDownload,
      views: 0,
      downloads: 0,
      isActive: true
    };

    await db.collection('shares').doc(shareId).set(shareData);

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`;

    res.status(201).json({
      message: 'Share link created successfully',
      shareUrl,
      shareId,
      shareToken,
      expiresAt: shareData.expiresAt
    });
  } catch (error) {
    console.error('Generate share error:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// Get shared content (public endpoint)
router.get('/:shareToken', optionalAuth, async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { password } = req.query;

    // Find share record
    const sharesSnapshot = await db.collection('shares')
      .where('shareToken', '==', shareToken)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (sharesSnapshot.empty) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const shareDoc = sharesSnapshot.docs[0];
    const share = shareDoc.data();

    // Check if share has expired
    if (share.expiresAt && new Date() > share.expiresAt.toDate()) {
      await db.collection('shares').doc(share.id).update({ isActive: false });
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check password if required
    if (share.password && !password) {
      return res.status(401).json({ error: 'Password required' });
    }

    if (share.password && password) {
      const isValidPassword = await bcrypt.compare(password, share.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get media file
    const mediaDoc = await db.collection('media').doc(share.fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Shared file not found' });
    }

    const media = mediaDoc.data();

    // Increment view count
    await db.collection('shares').doc(share.id).update({
      views: share.views + 1
    });

    res.json({
      media: {
        ...media,
        id: share.fileId
      },
      share: {
        allowDownload: share.allowDownload,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt
      }
    });
  } catch (error) {
    console.error('Get shared content error:', error);
    res.status(500).json({ error: 'Failed to get shared content' });
  }
});

// Download shared file
router.get('/:shareToken/download', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { password } = req.query;

    // Find share record
    const sharesSnapshot = await db.collection('shares')
      .where('shareToken', '==', shareToken)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (sharesSnapshot.empty) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    const shareDoc = sharesSnapshot.docs[0];
    const share = shareDoc.data();

    // Check if share has expired
    if (share.expiresAt && new Date() > share.expiresAt.toDate()) {
      await db.collection('shares').doc(share.id).update({ isActive: false });
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check if downloads are allowed
    if (!share.allowDownload) {
      return res.status(403).json({ error: 'Downloads not allowed for this share' });
    }

    // Check password if required
    if (share.password && !password) {
      return res.status(401).json({ error: 'Password required' });
    }

    if (share.password && password) {
      const isValidPassword = await bcrypt.compare(password, share.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get media file
    const mediaDoc = await db.collection('media').doc(share.fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'Shared file not found' });
    }

    const media = mediaDoc.data();

    // Increment download count
    await db.collection('shares').doc(share.id).update({
      downloads: share.downloads + 1
    });

    // Generate signed download URL
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
    console.error('Download shared file error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Get user's share links
router.get('/my/shares', async (req, res) => {
  try {
    const { uid } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    
    const sharesSnapshot = await db.collection('shares')
      .where('uploadedBy', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .get();

    const shares = [];
    
    for (const doc of sharesSnapshot.docs) {
      const share = doc.data();
      
      // Get media info
      const mediaDoc = await db.collection('media').doc(share.fileId).get();
      if (mediaDoc.exists) {
        const media = mediaDoc.data();
        shares.push({
          ...share,
          media: {
            title: media.title,
            originalName: media.originalName,
            mimeType: media.mimeType,
            size: media.size
          }
        });
      }
    }

    // Get total count
    const totalSnapshot = await db.collection('shares')
      .where('uploadedBy', '==', uid)
      .get();
    
    const total = totalSnapshot.size;

    res.json({
      shares,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user shares error:', error);
    res.status(500).json({ error: 'Failed to fetch share links' });
  }
});

// Update share settings
router.put('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { uid } = req.user;
    const { expiresAt, password, allowDownload, isActive } = req.body;

    const shareDoc = await db.collection('shares').doc(shareId).get();
    if (!shareDoc.exists) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const share = shareDoc.data();
    if (share.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (expiresAt !== undefined) updateData.expiresAt = Timestamp.fromDate(new Date(expiresAt));
    if (password !== undefined) {
      updateData.password = password ? await bcrypt.hash(password, 10) : null;
    }
    if (allowDownload !== undefined) updateData.allowDownload = allowDownload;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    updateData.updatedAt = Timestamp.now();

    await db.collection('shares').doc(shareId).update(updateData);

    res.json({ message: 'Share settings updated successfully' });
  } catch (error) {
    console.error('Update share error:', error);
    res.status(500).json({ error: 'Failed to update share settings' });
  }
});

// Delete share link
router.delete('/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { uid } = req.user;

    const shareDoc = await db.collection('shares').doc(shareId).get();
    if (!shareDoc.exists) {
      return res.status(404).json({ error: 'Share not found' });
    }

    const share = shareDoc.data();
    if (share.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('shares').doc(shareId).delete();

    res.json({ message: 'Share link deleted successfully' });
  } catch (error) {
    console.error('Delete share error:', error);
    res.status(500).json({ error: 'Failed to delete share link' });
  }
});

module.exports = router; 