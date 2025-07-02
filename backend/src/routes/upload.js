const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { bucket, db } = require('../config/firebase');
const path = require('path');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload single file
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uid } = req.user;
    const { title, description, tags, isPublic } = req.body;
    
    const file = req.file;
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = `uploads/${uid}/${fileName}`;

    // Upload to Firebase Storage
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: uid
        }
      }
    });

    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    });

    blobStream.on('finish', async () => {
      try {
        // Make file publicly accessible
        await fileUpload.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        // Save metadata to Firestore
        const mediaDoc = {
          id: fileId,
          fileName,
          originalName: file.originalname,
          filePath,
          publicUrl,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: uid,
          title: title || file.originalname,
          description: description || '',
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          isPublic: isPublic === 'true',
          uploadedAt: new Date(),
          views: 0,
          downloads: 0
        };

        await db.collection('media').doc(fileId).set(mediaDoc);

        // Update user's storage usage
        const userRef = db.collection('users').doc(uid);
        await userRef.update({
          storageUsed: admin.firestore.FieldValue.increment(file.size)
        });

        res.status(201).json({
          message: 'File uploaded successfully',
          media: mediaDoc
        });
      } catch (error) {
        console.error('Metadata save error:', error);
        res.status(500).json({ error: 'Failed to save file metadata' });
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error('Upload route error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { uid } = req.user;
    const { title, description, tags, isPublic } = req.body;
    
    const uploadPromises = req.files.map(async (file) => {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = `uploads/${uid}/${fileName}`;

      const fileUpload = bucket.file(filePath);
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: uid
          }
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          try {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

            const mediaDoc = {
              id: fileId,
              fileName,
              originalName: file.originalname,
              filePath,
              publicUrl,
              mimeType: file.mimetype,
              size: file.size,
              uploadedBy: uid,
              title: title || file.originalname,
              description: description || '',
              tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
              isPublic: isPublic === 'true',
              uploadedAt: new Date(),
              views: 0,
              downloads: 0
            };

            await db.collection('media').doc(fileId).set(mediaDoc);
            resolve(mediaDoc);
          } catch (error) {
            reject(error);
          }
        });
        blobStream.end(file.buffer);
      });
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    
    // Update user's storage usage
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      storageUsed: admin.firestore.FieldValue.increment(totalSize)
    });

    res.status(201).json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Generate thumbnail for image
router.post('/thumbnail/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { width = 300, height = 300, quality = 80 } = req.body;

    const mediaDoc = await db.collection('media').doc(fileId).get();
    if (!mediaDoc.exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const media = mediaDoc.data();
    if (!media.mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Thumbnails only supported for images' });
    }

    // Download original file
    const file = bucket.file(media.filePath);
    const [buffer] = await file.download();

    // Generate thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(parseInt(width), parseInt(height), { fit: 'cover' })
      .jpeg({ quality: parseInt(quality) })
      .toBuffer();

    // Upload thumbnail
    const thumbnailFileName = `thumb_${media.fileName}`;
    const thumbnailPath = `thumbnails/${media.uploadedBy}/${thumbnailFileName}`;
    
    const thumbnailUpload = bucket.file(thumbnailPath);
    await thumbnailUpload.save(thumbnailBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          originalFile: fileId
        }
      }
    });

    await thumbnailUpload.makePublic();
    const thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

    // Update media document with thumbnail URL
    await db.collection('media').doc(fileId).update({
      thumbnailUrl,
      thumbnailPath
    });

    res.json({
      message: 'Thumbnail generated successfully',
      thumbnailUrl
    });
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

module.exports = router; 