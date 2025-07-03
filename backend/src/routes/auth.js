const express = require('express');
const { auth, db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { Timestamp } = require('firebase-admin/firestore');

const router = express.Router();

// Simple email sending function using console.log for development
const sendEmail = async (to, subject, html) => {
  console.log('📧 Email would be sent:');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Content:', html);
  console.log('---');
  
  // In production, you would integrate with a service like SendGrid, Mailgun, etc.
  // For now, we'll just log the email details
  return true;
};

// Send magic link email
router.post('/send-login-link', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    const { email, returnTo } = req.body;

    // Generate unique token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Store token in Firestore
    await db.collection('loginTokens').doc(token).set({
      email,
      returnTo,
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false,
      createdAt: Timestamp.now()
    });

    // Create magic link
    const magicLink = returnTo 
      ? `${process.env.FRONTEND_URL}/login/verify?token=${token}&returnTo=${encodeURIComponent(returnTo)}`
      : `${process.env.FRONTEND_URL}/login/verify?token=${token}`;

    // Send email with magic link
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to PicStream</h2>
        <p>Click the button below to log in to your account:</p>
        <a href="${magicLink}" 
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Log In to PicStream
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${magicLink}" style="color: #2563eb;">${magicLink}</a>
        </p>
      </div>
    `;

    await sendEmail(email, 'Login to PicStream', emailHtml);

    res.json({ 
      message: 'Login link sent to your email',
      email: email
    });
  } catch (error) {
    console.error('Send login link error:', error);
    res.status(500).json({ error: 'Failed to send login link' });
  }
});

// Verify magic link token
router.post('/verify-token', [
  body('token').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    const { token } = req.body;

    // Get token from Firestore
    const tokenDoc = await db.collection('loginTokens').doc(token).get();
    
    if (!tokenDoc.exists) {
      return res.status(400).json({ error: 'Invalid or expired login link' });
    }

    const tokenData = tokenDoc.data();

    // Check if token is expired
    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.delete(); // Clean up expired token
      return res.status(400).json({ error: 'Login link has expired' });
    }

    // Check if token has been used
    if (tokenData.used) {
      return res.status(400).json({ error: 'Login link has already been used' });
    }

    // Mark token as used
    await tokenDoc.ref.update({ used: true });

    const email = tokenData.email;

    // Get or create user
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: email,
          emailVerified: true
        });

        // Create user profile in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          email: email,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now()
        });
      } else {
        throw error;
      }
    }

    // Update last login
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: Timestamp.now()
    });

    // Create custom token for client
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      message: 'Login successful',
      customToken,
      returnTo: tokenData.returnTo,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify login link' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { uid } = req.user;
    
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      ...userDoc.data(),
      uid
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router; 