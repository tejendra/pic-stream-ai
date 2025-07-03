const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Cloud Function to expire albums
exports.expireAlbums = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const now = new Date();
    
    // Find all expired albums
    const expiredAlbumsSnapshot = await db.collection('albums')
      .where('expirationDate', '<', now)
      .get();

    if (expiredAlbumsSnapshot.empty) {
      console.log('No expired albums found');
      return null;
    }

    console.log(`Found ${expiredAlbumsSnapshot.size} expired albums`);

    // Process each expired album
    const batch = db.batch();
    const deletePromises = [];

    for (const albumDoc of expiredAlbumsSnapshot.docs) {
      const album = albumDoc.data();
      
      // Get all media in the album
      const mediaSnapshot = await db.collection('media')
        .where('albumId', '==', album.id)
        .get();

      // Delete media files from storage
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

        // Delete media document
        batch.delete(mediaDoc.ref);
      });

      // Delete all album members
      const membersSnapshot = await db.collection('albumMembers')
        .where('albumId', '==', album.id)
        .get();

      membersSnapshot.docs.forEach(memberDoc => {
        batch.delete(memberDoc.ref);
      });

      // Delete the album document
      batch.delete(albumDoc.ref);

      console.log(`Processed expired album: ${album.title} (${album.id})`);
    }

    // Commit all Firestore changes
    await batch.commit();

    // Wait for all storage deletions to complete
    await Promise.all(deletePromises);

    console.log('Album expiration cleanup completed successfully');
    return null;
  } catch (error) {
    console.error('Error in expireAlbums function:', error);
    throw error;
  }
});

// Optional: Function to manually expire a specific album (for testing)
exports.manuallyExpireAlbum = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { albumId } = data;
  
  if (!albumId) {
    throw new functions.https.HttpsError('invalid-argument', 'Album ID is required');
  }

  try {
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Album not found');
    }

    const album = albumDoc.data();

    // Check if user is admin of the album
    const memberDoc = await db.collection('albumMembers')
      .doc(`${albumId}_${context.auth.uid}`)
      .get();

    if (!memberDoc.exists || memberDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only album admin can expire album');
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
    const batch = db.batch();
    mediaSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete all album members
    const membersSnapshot = await db.collection('albumMembers')
      .where('albumId', '==', albumId)
      .get();

    membersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the album document
    batch.delete(albumDoc.ref);

    // Commit all deletions
    await batch.commit();

    return { message: 'Album expired successfully' };
  } catch (error) {
    console.error('Error in manuallyExpireAlbum function:', error);
    throw new functions.https.HttpsError('internal', 'Failed to expire album');
  }
}); 