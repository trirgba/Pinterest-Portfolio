/**
 * Vercel Serverless Function — Dynamic Sitemap Generator
 * Endpoint: GET /api/sitemap (được rewrite từ /sitemap.xml)
 * Tự động lấy danh sách tất cả projects từ Firestore để tạo sitemap động chuẩn SEO
 */

const FIRESTORE_PROJECT_ID = 'portfolio-pinterest-style';
const SITE_URL = 'https://tringuyen.io.vn';

export default async function handler(req, res) {
  try {
    // 1. Fetch danh sách projects từ Firestore REST API
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/projects?pageSize=100`;
    const response = await fetch(firestoreUrl);
    
    let projects = [];
    if (response.ok) {
      const data = await response.json();
      projects = (data.documents || []).map(doc => {
        const id = doc.name.split('/').pop();
        const fields = doc.fields || {};
        const slug = fields.slug?.stringValue || id;
        const updateTime = doc.updateTime ? doc.updateTime.split('T')[0] : new Date().toISOString().split('T')[0];
        return { id, slug, updateTime };
      });
    }

    // 2. Tạo XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Trang chủ
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Trang công cụ WebP Converter
    xml += `  <url>\n`;
    xml += `    <loc>${SITE_URL}/tools/</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // Từng trang chi tiết dự án (project.html?slug=...)
    projects.forEach(p => {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/project.html?slug=${encodeURIComponent(p.slug)}</loc>\n`;
      xml += `    <lastmod>${p.updateTime}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    // 3. Trả về XML với cache header trên Vercel Edge Cache (1 tiếng)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Fallback sitemap tĩnh cơ bản nếu có lỗi
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tools/</loc>
    <priority>0.9</priority>
  </url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(fallbackXml);
  }
}
