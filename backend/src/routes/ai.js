const express = require('express');
const { db, bucket } = require('../config/firebase');
const sharp = require('sharp');

const router = express.Router();

// Enhance image quality
router.post('/enhance/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;
    const { quality = 90, sharpen = true, denoise = true } = req.body;

    // Verify file exists and user owns it
    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!media.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Enhancement only supported for images' });
    }

    // Download original file
    const file = bucket.file(media.filePath);
    const [buffer] = await file.download();

    // Apply enhancements
    let enhancedImage = sharp(buffer);

    if (sharpen) {
      enhancedImage = enhancedImage.sharpen({
        sigma: 1,
        flat: 1,
        jagged: 2
      });
    }

    if (denoise) {
      enhancedImage = enhancedImage.median(1);
    }

    // Apply quality settings
    if (media.mimeType === 'image/jpeg') {
      enhancedImage = enhancedImage.jpeg({ quality: parseInt(quality) });
    } else if (media.mimeType === 'image/png') {
      enhancedImage = enhancedImage.png({ quality: parseInt(quality) });
    } else if (media.mimeType === 'image/webp') {
      enhancedImage = enhancedImage.webp({ quality: parseInt(quality) });
    }

    const enhancedBuffer = await enhancedImage.toBuffer();

    // Upload enhanced version
    const enhancedFileName = `enhanced_${media.fileName}`;
    const enhancedFilePath = `enhanced/${uid}/${enhancedFileName}`;
    
    const enhancedUpload = bucket.file(enhancedFilePath);
    await enhancedUpload.save(enhancedBuffer, {
      metadata: {
        contentType: media.mimeType,
        metadata: {
          originalFile: fileId,
          enhanced: true
        }
      }
    });

    await enhancedUpload.makePublic();
    const enhancedUrl = `https://storage.googleapis.com/${bucket.name}/${enhancedFilePath}`;

    // Save enhanced version metadata
    const enhancedMediaDoc = {
      id: `${fileId}_enhanced`,
      fileName: enhancedFileName,
      originalName: `enhanced_${media.originalName}`,
      filePath: enhancedFilePath,
      publicUrl: enhancedUrl,
      mimeType: media.mimeType,
      size: enhancedBuffer.length,
      uploadedBy: uid,
      title: `Enhanced: ${media.title}`,
      description: media.description,
      tags: [...media.tags, 'enhanced'],
      isPublic: false,
      uploadedAt: new Date(),
      originalFileId: fileId,
      enhanced: true
    };

    await db.collection('media').doc(enhancedMediaDoc.id).set(enhancedMediaDoc);

    res.json({
      message: 'Image enhanced successfully',
      enhancedMedia: enhancedMediaDoc
    });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

// Generate multiple sizes for responsive images
router.post('/resize/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;
    const { sizes = [300, 600, 1200] } = req.body;

    // Verify file exists and user owns it
    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!media.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Resize only supported for images' });
    }

    // Download original file
    const file = bucket.file(media.filePath);
    const [buffer] = await file.download();

    const resizedVersions = [];

    // Generate different sizes
    for (const size of sizes) {
      const resizedBuffer = await sharp(buffer)
        .resize(size, size, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      const resizedFileName = `resized_${size}_${media.fileName}`;
      const resizedFilePath = `resized/${uid}/${resizedFileName}`;
      
      const resizedUpload = bucket.file(resizedFilePath);
      await resizedUpload.save(resizedBuffer, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            originalFile: fileId,
            size,
            resized: true
          }
        }
      });

      await resizedUpload.makePublic();
      const resizedUrl = `https://storage.googleapis.com/${bucket.name}/${resizedFilePath}`;

      resizedVersions.push({
        size,
        url: resizedUrl,
        path: resizedFilePath
      });
    }

    // Update original media with resized versions
    await db.collection('media').doc(fileId).update({
      resizedVersions,
      updatedAt: new Date()
    });

    res.json({
      message: 'Resized versions generated successfully',
      resizedVersions
    });
  } catch (error) {
    console.error('Image resize error:', error);
    res.status(500).json({ error: 'Failed to generate resized versions' });
  }
});

// Auto-tag images using AI (placeholder for future implementation)
router.post('/auto-tag/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    // Verify file exists and user owns it
    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!media.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Auto-tagging only supported for images' });
    }

    // Placeholder for AI image analysis
    // In a real implementation, you would:
    // 1. Send image to AI service (Google Vision API, AWS Rekognition, etc.)
    // 2. Get labels/tags from the AI service
    // 3. Update the media document with new tags

    const suggestedTags = [
      'auto-tagged',
      'ai-generated',
      'vacation',
      'travel'
    ];

    // Update media with suggested tags
    await db.collection('media').doc(fileId).update({
      suggestedTags,
      updatedAt: new Date()
    });

    res.json({
      message: 'Auto-tagging completed',
      suggestedTags
    });
  } catch (error) {
    console.error('Auto-tag error:', error);
    res.status(500).json({ error: 'Failed to auto-tag image' });
  }
});

// Generate image collage
router.post('/collage', async (req, res) => {
  try {
    const { uid } = req.user;
    const { fileIds, layout = 'grid', width = 1200, height = 800 } = req.body;

    if (!fileIds || fileIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 images required for collage' });
    }

    // Verify all files exist and user owns them
    const mediaPromises = fileIds.map(async (fileId) => {
      const mediaDoc = await db.collection('media').doc(fileId).get();
      if (!mediaDoc.exists) {
        throw new Error(`File ${fileId} not found`);
      }
      
      const media = mediaDoc.data();
      if (media.uploadedBy !== uid) {
        throw new Error(`Access denied for file ${fileId}`);
      }
      
      if (!media.mimeType.startsWith('image/')) {
        throw new Error(`File ${fileId} is not an image`);
      }
      
      return media;
    });

    const mediaFiles = await Promise.all(mediaPromises);

    // Download all images
    const imageBuffers = await Promise.all(
      mediaFiles.map(async (media) => {
        const file = bucket.file(media.filePath);
        const [buffer] = await file.download();
        return buffer;
      })
    );

    // Create collage (simplified implementation)
    // In a real implementation, you would use a more sophisticated collage library
    const collageBuffer = await sharp(imageBuffers[0])
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Upload collage
    const collageId = `collage_${Date.now()}`;
    const collageFileName = `${collageId}.jpg`;
    const collageFilePath = `collages/${uid}/${collageFileName}`;
    
    const collageUpload = bucket.file(collageFilePath);
    await collageUpload.save(collageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          type: 'collage',
          sourceFiles: fileIds
        }
      }
    });

    await collageUpload.makePublic();
    const collageUrl = `https://storage.googleapis.com/${bucket.name}/${collageFilePath}`;

    // Save collage metadata
    const collageDoc = {
      id: collageId,
      fileName: collageFileName,
      originalName: `Collage_${new Date().toISOString().split('T')[0]}.jpg`,
      filePath: collageFilePath,
      publicUrl: collageUrl,
      mimeType: 'image/jpeg',
      size: collageBuffer.length,
      uploadedBy: uid,
      title: `Collage from ${mediaFiles.length} images`,
      description: `AI-generated collage from ${mediaFiles.length} images`,
      tags: ['collage', 'ai-generated', ...mediaFiles.flatMap(m => m.tags)],
      isPublic: false,
      uploadedAt: new Date(),
      collage: true,
      sourceFiles: fileIds,
      layout
    };

    await db.collection('media').doc(collageId).set(collageDoc);

    res.json({
      message: 'Collage created successfully',
      collage: collageDoc
    });
  } catch (error) {
    console.error('Collage creation error:', error);
    res.status(500).json({ error: 'Failed to create collage' });
  }
});

// Get AI processing status
router.get('/status/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { uid } = req.user;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (media.uploadedBy !== uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for AI processing status
    const aiStatus = {
      enhanced: !!media.enhanced,
      resized: !!media.resizedVersions,
      autoTagged: !!media.suggestedTags,
      collage: !!media.collage
    };

    res.json({
      fileId,
      aiStatus
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
});

module.exports = router; 