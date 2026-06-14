/**
 * Cấu hình thông tin cá nhân và SEO
 * Thông tin này sẽ được dùng để tạo thẻ meta, context upload, và JSON-LD Schema
 */

export const SITE_CONFIG = {
  authorName: "Trí Xin Chào",
  designerName: "Nguyễn Minh Trí",
  email: "trixinchao@gmail.com",
  linkedin: "https://www.linkedin.com/in/trixinchao/",
  website: "https://tringuyen.io.vn/",
  role: "Designer",
  title: "Trí Xin Chào Portfolio",
  description: "Portfolio nhiếp ảnh và thiết kế của Designer Nguyễn Minh Trí (Trí Xin Chào). Khám phá các dự án sáng tạo và bộ sưu tập nghệ thuật.",
  googleAnalyticsId: "G-9VMLRBGTGF", // Điền mã đo lường Google Analytics của bạn vào đây (vd: "G-XXXXXXXXXX")
};

/**
 * Tạo thẻ JSON-LD Schema cho Person
 */
export function getPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": SITE_CONFIG.authorName,
    "alternateName": SITE_CONFIG.designerName,
    "jobTitle": SITE_CONFIG.role,
    "email": SITE_CONFIG.email,
    "url": SITE_CONFIG.website,
    "sameAs": [
      SITE_CONFIG.linkedin
    ]
  };
}

/**
 * Inject JSON-LD vào Head của trang web
 */
export function injectSEO() {
  // Inject Schema
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(getPersonSchema());
  document.head.appendChild(script);

  // Cập nhật Meta Tags
  const metaAuthor = document.createElement('meta');
  metaAuthor.name = 'author';
  metaAuthor.content = `${SITE_CONFIG.authorName} (${SITE_CONFIG.designerName})`;
  document.head.appendChild(metaAuthor);

  const metaDesc = document.createElement('meta');
  metaDesc.name = 'description';
  metaDesc.content = SITE_CONFIG.description;
  document.head.appendChild(metaDesc);

  // Inject Google Analytics (chỉ chạy nếu có mã ID)
  if (SITE_CONFIG.googleAnalyticsId) {
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.googleAnalyticsId}`;
    document.head.appendChild(gtagScript);

    const inlineScript = document.createElement('script');
    inlineScript.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${SITE_CONFIG.googleAnalyticsId}');
    `;
    document.head.appendChild(inlineScript);
  }
}
