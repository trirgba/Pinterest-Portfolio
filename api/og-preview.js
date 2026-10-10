/**
 * Vercel Serverless Function — Dynamic Open Graph Preview for Social Bots
 * Endpoint: /api/og-preview
 * Phục vụ riêng cho các crawler: Facebook, Zalo, Twitter/X, LinkedIn, Telegram, WhatsApp...
 * Khi người dùng chia sẻ link project lên MXH, bot sẽ nhận được đúng thẻ og:title, og:image (ảnh đầu hoặc ảnh custom)
 */

const FIRESTORE_PROJECT_ID = 'portfolio-pinterest-style';
const SITE_URL = 'https://tringuyen.io.vn';
const DEFAULT_OG_IMAGE = 'https://res.cloudinary.com/dft21ara1/image/upload/f_auto,q_auto,w_1200/v1781341495/Favicon_irrmrx.webp';
const AUTHOR_NAME = 'Trí Xin Chào';
const DESIGNER_NAME = 'Nguyễn Minh Trí';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  const queryParam = req.query.slug || req.query.id;
  const originalUrl = `${SITE_URL}/project.html${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  let project = null;
  let docId = null;

  if (queryParam) {
    try {
      // 1. Thử lấy theo Document ID trực tiếp
      const directUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/projects/${encodeURIComponent(queryParam)}`;
      const directRes = await fetch(directUrl);
      
      if (directRes.ok) {
        const docData = await directRes.json();
        project = docData.fields || {};
        docId = docData.name.split('/').pop();
      } else {
        // 2. Nếu không tìm thấy, truy vấn theo trường 'slug'
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents:runQuery`;
        const qRes = await fetch(queryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'projects' }],
              where: {
                fieldFilter: {
                  field: { fieldPath: 'slug' },
                  op: 'EQUAL',
                  value: { stringValue: queryParam }
                }
              },
              limit: 1
            }
          })
        });

        if (qRes.ok) {
          const qData = await qRes.json();
          if (Array.isArray(qData) && qData[0] && qData[0].document) {
            project = qData[0].document.fields || {};
            docId = qData[0].document.name.split('/').pop();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching project from Firestore:', err);
    }
  }

  // Nếu không tìm thấy project, trả về meta mặc định
  if (!project) {
    const defaultHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${AUTHOR_NAME} | Multimedia Designer Portfolio</title>
  <meta name="description" content="Portfolio của Nguyễn Minh Trí (Trí Xin Chào) — Multimedia Designer.">
  <meta property="og:title" content="${AUTHOR_NAME} | Portfolio">
  <meta property="og:description" content="Portfolio của Multimedia Designer Trí Xin Chào.">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta property="og:url" content="${originalUrl}">
  <meta http-equiv="refresh" content="0;url=${originalUrl}">
</head>
<body>
  <p>Đang chuyển hướng đến portfolio...</p>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(defaultHtml);
  }

  // 3. Trích xuất thông tin Project
  const projectName = project.name?.stringValue || 'Dự án';
  const projectExcerpt = project.excerpt?.stringValue || `Bộ sưu tập ảnh "${projectName}" bởi ${DESIGNER_NAME} — Multimedia Designer.`;
  const pageTitle = `${projectName} — ${AUTHOR_NAME}`;

  // 4. Xác định OG Image:
  // Ưu tiên 1: ogImageCloudinaryId nếu admin đã gán riêng
  let ogImageUrl = null;
  const customOgId = project.ogImageCloudinaryId?.stringValue;
  if (customOgId) {
    ogImageUrl = `https://res.cloudinary.com/dft21ara1/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,g_auto/${customOgId}`;
  } else if (docId) {
    // Ưu tiên 2: Ảnh đầu tiên trong subcollection images của project (không phải YouTube)
    try {
      const imagesUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/projects/${docId}/images?pageSize=20`;
      const imgRes = await fetch(imagesUrl);
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const validImages = (imgData.documents || [])
          .map(d => {
            const f = d.fields || {};
            return {
              cloudinaryId: f.cloudinaryId?.stringValue,
              order: parseInt(f.order?.integerValue || '0', 10),
              isYoutube: f.type?.stringValue === 'youtube' || !!f.youtubeId?.stringValue
            };
          })
          .filter(img => !img.isYoutube && img.cloudinaryId);

        validImages.sort((a, b) => a.order - b.order);
        if (validImages.length > 0) {
          ogImageUrl = `https://res.cloudinary.com/dft21ara1/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,g_auto/${validImages[0].cloudinaryId}`;
        }
      }
    } catch (err) {
      console.error('Error fetching project images:', err);
    }
  }

  // Fallback nếu không có ảnh nào
  if (!ogImageUrl) {
    ogImageUrl = DEFAULT_OG_IMAGE;
  }

  // 5. Render HTML hoàn chỉnh cho Social Crawlers
  const safeTitle = escapeHtml(pageTitle);
  const safeDesc = escapeHtml(projectExcerpt);
  const safeOgImage = escapeHtml(ogImageUrl);
  const safeUrl = escapeHtml(originalUrl);

  const html = `<!DOCTYPE html>
<html lang="vi" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="author" content="${AUTHOR_NAME}">
  <meta name="robots" content="index, follow">

  <!-- Open Graph / Facebook / Zalo / LinkedIn -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="trixinchao Portfolio">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:image" content="${safeOgImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="vi_VN">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeOgImage}">

  <!-- Canonical -->
  <link rel="canonical" href="${safeUrl}">

  <!-- Tự động chuyển tiếp nếu là người dùng thật mở link -->
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
</head>
<body>
  <article>
    <h1>${safeTitle}</h1>
    <p>${safeDesc}</p>
    <img src="${safeOgImage}" alt="${safeTitle}" width="1200" height="630">
  </article>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  return res.status(200).send(html);
}
