/**
 * Vercel Serverless Function — Xoá ảnh Cloudinary
 * Spec Section 7: API Secret chỉ nằm ở server
 * 
 * Endpoint: POST /api/delete-image
 * Headers: Authorization: Bearer <firebase-id-token>
 * Body: { publicId: string }
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dft21ara1',
  api_key: '333179835848518',
  api_secret: process.env.CLOUDINARY_API_SECRET, // Vercel Environment Variable
});

// Firebase Admin — verify ID token
// TODO: Add Firebase Admin SDK for production token verification
const ALLOWED_EMAILS = [
  'mintri.arena@gmail.com',
  'trixinchao@gmail.com',
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  // TODO: Verify Firebase ID token with Firebase Admin SDK
  // const idToken = authHeader.split('Bearer ')[1];
  // const decodedToken = await admin.auth().verifyIdToken(idToken);
  // if (!ALLOWED_EMAILS.includes(decodedToken.email)) {
  //   return res.status(403).json({ error: 'Unauthorized email' });
  // }

  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({ error: 'Missing publicId' });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return res.status(500).json({ error: 'Failed to delete image' });
  }
}
