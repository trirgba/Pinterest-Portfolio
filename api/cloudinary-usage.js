/**
 * Vercel Serverless Function — Lấy dung lượng Cloudinary
 * Endpoint: GET /api/cloudinary-usage
 * Headers: Authorization: Bearer <firebase-id-token>
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dft21ara1',
  api_key: '333179835848518',
  api_secret: process.env.CLOUDINARY_API_SECRET, // Vercel Environment Variable
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  // TODO: Verify Firebase ID token if needed for higher security
  // const idToken = authHeader.split('Bearer ')[1];
  
  try {
    const usage = await cloudinary.api.usage();
    return res.status(200).json({ success: true, data: usage });
  } catch (error) {
    console.error('Cloudinary usage error:', error);
    return res.status(500).json({ error: 'Failed to fetch usage data' });
  }
}
