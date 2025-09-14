const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { bucket, db } = require('../config/firebase');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const path = require('path');
const VideoProcessor = require('../utils/videoProcessor');
const fs = require('fs');
const os = require('os');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 250 * 1024 * 1024, // 250MB limit (matching the route validation)
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv',
      'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv',
      'video/webm', 'video/3gpp', 'video/3gpp2', 'video/x-matroska'
    ];
    
    // Also check file extension as fallback
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.3gp', '.mkv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    console.log('File upload attempt:', {
      originalName: file.originalname,
      mimetype: file.mimetype,
      extension: fileExtension
    });
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      console.log('File rejected:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        extension: fileExtension
      });
      cb(new Error(`Invalid file type: ${file.mimetype} (${fileExtension})`), false);
    }
  }
});

// Upload single file to album
router.post('/single', upload.single('file'), async (req, res) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  if (req.fileFilterError) {
    return res.status(400).json({ error: req.fileFilterError.message });
  }
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uid } = req.user;
    const { albumId } = req.body;
    
    if (!albumId) {
      return res.status(400).json({ error: 'Album ID is required' });
    }

    // Verify user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied to this album' });
    }

    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(albumId).get();
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = albumDoc.data();
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ error: 'Album has expired' });
    }

    const file = req.file;
    
    // Check file size limit (250MB per spec)
    if (file.size > 250 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 250MB limit' });
    }

    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = `albums/${albumId}/${fileName}`;

    // Upload original file to Firebase Storage
    const fileUpload = bucket.file(filePath);
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: uid,
          albumId: albumId
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

        // Generate thumbnails and previews
        let thumbnailUrl = null;
        let previewUrl = null;
        let videoMetadata = null;

        if (file.mimetype.startsWith('image/')) {
          // Generate 400x400 thumbnail
          const thumbnailBuffer = await sharp(file.buffer)
            .resize(400, 400, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();

          const thumbnailFileName = `thumb_${fileName}`;
          const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
          const thumbnailUpload = bucket.file(thumbnailPath);
          
          await thumbnailUpload.save(thumbnailBuffer, {
            metadata: { contentType: 'image/jpeg' }
          });
          await thumbnailUpload.makePublic();
          thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

          // Generate 1920px preview
          const previewBuffer = await sharp(file.buffer)
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

          const previewFileName = `preview_${fileName}`;
          const previewPath = `previews/${albumId}/${previewFileName}`;
          const previewUpload = bucket.file(previewPath);
          
          await previewUpload.save(previewBuffer, {
            metadata: { contentType: 'image/jpeg' }
          });
          await previewUpload.makePublic();
          previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;
        } else if (file.mimetype.startsWith('video/')) {
          // Process video files
          const videoProcessor = new VideoProcessor();
          
          try {
            // Get video metadata
            videoMetadata = await videoProcessor.getVideoMetadata(file.buffer);
            
            // Generate thumbnail from first frame
            const tempThumbnailPath = path.join(os.tmpdir(), `thumb_${fileId}.jpg`);
            const thumbnailBuffer = await videoProcessor.generateThumbnail(file.buffer, tempThumbnailPath, 400, 400);
            
            const thumbnailFileName = `thumb_${fileId}.jpg`;
            const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
            const thumbnailUpload = bucket.file(thumbnailPath);
            
            await thumbnailUpload.save(thumbnailBuffer, {
              metadata: { contentType: 'image/jpeg' }
            });
            await thumbnailUpload.makePublic();
            thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

            // Generate compressed preview video
            const tempPreviewPath = path.join(os.tmpdir(), `preview_${fileId}.mp4`);
            const previewBuffer = await videoProcessor.generatePreview(file.buffer, tempPreviewPath, 1280, 720, 1000);
            
            const previewFileName = `preview_${fileId}.mp4`;
            const previewPath = `previews/${albumId}/${previewFileName}`;
            const previewUpload = bucket.file(previewPath);
            
            await previewUpload.save(previewBuffer, {
              metadata: { contentType: 'video/mp4' }
            });
            await previewUpload.makePublic();
            previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;
            
          } catch (error) {
            console.error('Video processing error:', error);
            // Continue without thumbnail/preview if video processing fails
          }
        }

        // Save metadata to Firestore
        const mediaDoc = {
          id: fileId,
          fileName,
          originalName: file.originalname,
          filePath,
          publicUrl,
          thumbnailUrl,
          previewUrl,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: uid,
          uploadedByEmail: req.user.email,
          albumId: albumId,
          uploadedAt: Timestamp.now(),
          views: 0,
          downloads: 0,
          ...(videoMetadata && {
            duration: videoMetadata.duration,
            width: videoMetadata.width,
            height: videoMetadata.height,
            fps: videoMetadata.fps,
            bitrate: videoMetadata.bitrate
          })
        };

        await db.collection('media').doc(fileId).set(mediaDoc);

        // Update album media count
        await db.collection('albums').doc(albumId).set({
          mediaCount: FieldValue.increment(1),
          updatedAt: Timestamp.now()
        }, { merge: true });

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

// Upload multiple files to album
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  if (req.fileFilterError) {
    return res.status(400).json({ error: req.fileFilterError.message });
  }
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { uid } = req.user;
    const { albumId } = req.body;
    
    if (!albumId) {
      return res.status(400).json({ error: 'Album ID is required' });
    }

    // Verify user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied to this album' });
    }

    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(albumId).get();
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const album = albumDoc.data();
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ error: 'Album has expired' });
    }

    // Check file sizes
    const oversizedFiles = req.files.filter(file => file.size > 250 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({ 
        error: 'Some files exceed 250MB limit',
        oversizedFiles: oversizedFiles.map(f => f.originalname)
      });
    }
    
    const uploadPromises = req.files.map(async (file) => {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = `albums/${albumId}/${fileName}`;

      const fileUpload = bucket.file(filePath);
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: uid,
            albumId: albumId
          }
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          try {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

            // Generate thumbnails and previews
            let thumbnailUrl = null;
            let previewUrl = null;
            let videoMetadata = null;

            if (file.mimetype.startsWith('image/')) {
              // Generate 400x400 thumbnail
              const thumbnailBuffer = await sharp(file.buffer)
                .resize(400, 400, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toBuffer();

              const thumbnailFileName = `thumb_${fileName}`;
              const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
              const thumbnailUpload = bucket.file(thumbnailPath);
              
              await thumbnailUpload.save(thumbnailBuffer, {
                metadata: { contentType: 'image/jpeg' }
              });
              await thumbnailUpload.makePublic();
              thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

              // Generate 1920px preview
              const previewBuffer = await sharp(file.buffer)
                .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();

              const previewFileName = `preview_${fileName}`;
              const previewPath = `previews/${albumId}/${previewFileName}`;
              const previewUpload = bucket.file(previewPath);
              
              await previewUpload.save(previewBuffer, {
                metadata: { contentType: 'image/jpeg' }
              });
              await previewUpload.makePublic();
              previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;
            } else if (file.mimetype.startsWith('video/')) {
              // Process video files
              const videoProcessor = new VideoProcessor();
              
              try {
                // Get video metadata
                videoMetadata = await videoProcessor.getVideoMetadata(file.buffer);
                
                // Generate thumbnail from first frame
                const tempThumbnailPath = path.join(os.tmpdir(), `thumb_${fileId}.jpg`);
                const thumbnailBuffer = await videoProcessor.generateThumbnail(file.buffer, tempThumbnailPath, 400, 400);
                
                const thumbnailFileName = `thumb_${fileId}.jpg`;
                const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
                const thumbnailUpload = bucket.file(thumbnailPath);
                
                await thumbnailUpload.save(thumbnailBuffer, {
                  metadata: { contentType: 'image/jpeg' }
                });
                await thumbnailUpload.makePublic();
                thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

                // Generate compressed preview video
                const tempPreviewPath = path.join(os.tmpdir(), `preview_${fileId}.mp4`);
                const previewBuffer = await videoProcessor.generatePreview(file.buffer, tempPreviewPath, 1280, 720, 1000);
                
                const previewFileName = `preview_${fileId}.mp4`;
                const previewPath = `previews/${albumId}/${previewFileName}`;
                const previewUpload = bucket.file(previewPath);
                
                await previewUpload.save(previewBuffer, {
                  metadata: { contentType: 'video/mp4' }
                });
                await previewUpload.makePublic();
                previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;
                
              } catch (error) {
                console.error('Video processing error:', error);
                // Continue without thumbnail/preview if video processing fails
              }
            }

            const mediaDoc = {
              id: fileId,
              fileName,
              originalName: file.originalname,
              filePath,
              publicUrl,
              thumbnailUrl,
              previewUrl,
              mimeType: file.mimetype,
              size: file.size,
              uploadedBy: uid,
              uploadedByEmail: req.user.email,
              albumId: albumId,
              uploadedAt: Timestamp.now(),
              views: 0,
              downloads: 0,
              ...(videoMetadata && {
                duration: videoMetadata.duration,
                width: videoMetadata.width,
                height: videoMetadata.height,
                fps: videoMetadata.fps,
                bitrate: videoMetadata.bitrate
              })
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
    
    // Update album media count
    await db.collection('albums').doc(albumId).set({
      mediaCount: FieldValue.increment(uploadedFiles.length),
      updatedAt: Timestamp.now()
    }, { merge: true });

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

// Upload single file directly to Firebase Storage (bypasses timeout limits)
router.post('/single-direct', upload.single('file'), async (req, res) => {
  console.log('Single-direct route hit, processing request...');
  
  // Set a longer timeout for this specific route
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  
  // Handle multer errors
  if (req.fileValidationError) {
    console.error('Multer validation error:', req.fileValidationError);
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  if (req.fileFilterError) {
    console.error('Multer filter error:', req.fileFilterError.message);
    return res.status(400).json({ error: req.fileFilterError.message });
  }
  
  // Check for multer errors in the request
  if (req.multerError) {
    console.error('Multer error:', req.multerError);
    return res.status(400).json({ error: 'File upload error: ' + req.multerError.message });
  }
  
  console.log('Multer processing completed, checking file...');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uid } = req.user;
    const { albumId } = req.body;
    console.log('Album ID:', albumId);
    if (!albumId) {
      return res.status(400).json({ error: 'Album ID is required' });
    }

    // Verify user is a member of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${uid}`)
      .get();

    if (!memberDoc.exists) {
      return res.status(403).json({ error: 'Access denied to this album' });
    }
    console.log(`User is a member of the album`);
    // Check if album has expired
    const albumDoc = await db.collection('albums').doc(albumId).get();
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'Album not found' });
    }
    console.log(`Album found`);
    const album = albumDoc.data();
    if (album.expirationDate.toDate() < new Date()) {
      return res.status(410).json({ error: 'Album has expired' });
    }
    console.log(`Album not expired`);
    const file = req.file;
    
    // Check file size limit (250MB per spec)
    if (file.size > 250 * 1024 * 1024) {
      console.log(`File size limit exceeded`);
      return res.status(400).json({ error: 'File size exceeds 250MB limit' });
    }
    
    const fileId = uuidv4();
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = `albums/${albumId}/${fileName}`;

    // Upload file directly to Firebase Storage
    const fileUpload = bucket.file(filePath);
    console.log(`File upload object created`);
      try {
        // Upload the file buffer directly to Firebase Storage
        console.log(`Starting Firebase Storage upload for file: ${fileId}`);
        console.log(`File buffer size: ${file.buffer.length} bytes`);
        
        // Upload the file buffer directly to Firebase Storage
        await fileUpload.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: uid,
              albumId: albumId,
              fileId: fileId
            }
          }
        });
      console.log(`File uploaded to: ${filePath}`);
      
      // Make file publicly accessible
      await fileUpload.makePublic();
      console.log(`File made publicly accessible`);
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      // Save initial metadata to Firestore (without thumbnails/previews)
      const initialMediaDoc = {
        id: fileId,
        fileName,
        originalName: file.originalname,
        filePath,
        publicUrl,
        thumbnailUrl: null, // Will be updated after processing
        previewUrl: null,  // Will be updated after processing
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: uid,
        uploadedByEmail: req.user.email,
        albumId: albumId,
        uploadedAt: Timestamp.now(),
        views: 0,
        downloads: 0,
        processingStatus: 'uploaded' // Track processing status
      };
      console.log(`Initial media document set`);
      await db.collection('media').doc(fileId).set(initialMediaDoc);
      console.log(`Initial media document set`);
      // Update album media count
      await db.collection('albums').doc(albumId).set({
        mediaCount: FieldValue.increment(1),
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log(`Album media count updated`);
      // Process thumbnails and metadata asynchronously using setTimeout
      setTimeout(() => {
        processMediaAsync(fileId, filePath, file.mimetype, albumId, uid).catch(error => {
          console.error(`Async processing failed for ${fileId}:`, error);
        });
      }, 0);
      console.log(`Async processing started`);
      
      res.status(201).json({
        message: 'File uploaded successfully',
        media: initialMediaDoc
      });
      console.log(`File uploaded successfully`);
    } catch (uploadError) {
      console.error('Firebase Storage upload error:', uploadError);
      return res.status(500).json({ error: 'Upload failed' });
    }

  } catch (error) {
    console.error('Upload route error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

// Async function to process media after upload
async function processMediaAsync(fileId, filePath, mimeType, albumId, uid) {
  try {
    console.log(`Starting async processing for file: ${fileId}, type: ${mimeType}`);
    
    // For large files (>50MB), skip processing to avoid timeouts
    const fileUpload = bucket.file(filePath);
    const [metadata] = await fileUpload.getMetadata();
    
    // Download the file from Firebase Storage for processing
    console.log(`Downloading file from: ${filePath}`);
    const [fileBuffer] = await fileUpload.download();
    console.log(`Downloaded file buffer size: ${fileBuffer.length} bytes`);
    
    let thumbnailUrl = null;
    let previewUrl = null;
    let videoMetadata = null;

    if (mimeType.startsWith('image/')) {
      // Process image files
      try {
        // Generate 400x400 thumbnail
        const thumbnailBuffer = await sharp(fileBuffer)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 85 })
          .toBuffer();

        const thumbnailFileName = `thumb_${fileId}.jpg`;
        const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
        const thumbnailUpload = bucket.file(thumbnailPath);
        
        await thumbnailUpload.save(thumbnailBuffer, {
          metadata: { contentType: 'image/jpeg' }
        });
        await thumbnailUpload.makePublic();
        thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;

        // Generate 1920px preview
        const previewBuffer = await sharp(fileBuffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();

        const previewFileName = `preview_${fileId}.jpg`;
        const previewPath = `previews/${albumId}/${previewFileName}`;
        const previewUpload = bucket.file(previewPath);
        
        await previewUpload.save(previewBuffer, {
          metadata: { contentType: 'image/jpeg' }
        });
        await previewUpload.makePublic();
        previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;

        console.log(`Image processing completed for: ${fileId}`);
      } catch (imageError) {
        console.error(`Image processing error for ${fileId}:`, imageError);
      }

    } else if (mimeType.startsWith('video/')) {
      // Process video files
      console.log(`Processing video file: ${fileId}`);
      const videoProcessor = new VideoProcessor();
      
      try {
        // Get video metadata
        console.log(`Getting video metadata for: ${fileId}`);
        videoMetadata = await videoProcessor.getVideoMetadata(fileBuffer);
        console.log(`Video metadata retrieved:`, videoMetadata);
        
        // Generate thumbnail from first frame
        console.log(`Generating thumbnail for: ${fileId}`);
        const tempThumbnailPath = path.join(os.tmpdir(), `thumb_${fileId}.jpg`);
        const thumbnailBuffer = await videoProcessor.generateThumbnail(fileBuffer, tempThumbnailPath, 400, 400);
        console.log(`Thumbnail generated, size: ${thumbnailBuffer.length} bytes`);
        
        const thumbnailFileName = `thumb_${fileId}.jpg`;
        const thumbnailPath = `thumbnails/${albumId}/${thumbnailFileName}`;
        const thumbnailUpload = bucket.file(thumbnailPath);
        
        console.log(`Uploading thumbnail to: ${thumbnailPath}`);
        await thumbnailUpload.save(thumbnailBuffer, {
          metadata: { contentType: 'image/jpeg' }
        });
        await thumbnailUpload.makePublic();
        thumbnailUrl = `https://storage.googleapis.com/${bucket.name}/${thumbnailPath}`;
        console.log(`Thumbnail uploaded: ${thumbnailUrl}`);

        // Generate compressed preview video
        console.log(`Generating preview video for: ${fileId}`);
        const tempPreviewPath = path.join(os.tmpdir(), `preview_${fileId}.mp4`);
        const previewBuffer = await videoProcessor.generatePreview(fileBuffer, tempPreviewPath, 1280, 720, 1000);
        console.log(`Preview video generated, size: ${previewBuffer.length} bytes`);
        
        const previewFileName = `preview_${fileId}.mp4`;
        const previewPath = `previews/${albumId}/${previewFileName}`;
        const previewUpload = bucket.file(previewPath);
        
        console.log(`Uploading preview to: ${previewPath}`);
        await previewUpload.save(previewBuffer, {
          metadata: { contentType: 'video/mp4' }
        });
        await previewUpload.makePublic();
        previewUrl = `https://storage.googleapis.com/${bucket.name}/${previewPath}`;
        console.log(`Preview uploaded: ${previewUrl}`);

        console.log(`Video processing completed for: ${fileId}`);
      } catch (videoError) {
        console.error(`Video processing error for ${fileId}:`, videoError);
        console.error(`Video processing error stack:`, videoError.stack);
      }
    }

    // Update the media document with processed data
    const updateData = {
      thumbnailUrl,
      previewUrl,
      processingStatus: 'completed',
      processedAt: Timestamp.now(),
      ...(videoMetadata && {
        duration: videoMetadata.duration,
        width: videoMetadata.width,
        height: videoMetadata.height,
        fps: videoMetadata.fps,
        bitrate: videoMetadata.bitrate
      })
    };

    console.log(`Updating media document for ${fileId} with:`, updateData);
    await db.collection('media').doc(fileId).update(updateData);
    console.log(`Media processing completed and updated for: ${fileId}`);

  } catch (error) {
    console.error(`Async processing error for ${fileId}:`, error);
    
    // Update status to failed
    try {
      await db.collection('media').doc(fileId).update({
        processingStatus: 'failed',
        processingError: error.message,
        processedAt: Timestamp.now()
      });
    } catch (updateError) {
      console.error(`Failed to update error status for ${fileId}:`, updateError);
    }
  }
}


module.exports = router; 