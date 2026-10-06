/**
 * Cấu hình thông tin cá nhân và SEO
 * Thông tin này sẽ được dùng để tạo thẻ meta, context upload, và JSON-LD Schema
 */

export const SITE_CONFIG = {
  authorName:   'Trí Xin Chào',
  designerName: 'Nguyễn Minh Trí',
  email:        'trixinchao@gmail.com',
  linkedin:     'https://www.linkedin.com/in/trixinchao/',
  website:      'https://tringuyen.io.vn/',
  role:         'Multimedia Designer',
  title:        'Trí Xin Chào | Multimedia Designer Portfolio',
  description:  'Portfolio của Nguyễn Minh Trí (Trí Xin Chào) — Multimedia Designer với 8+ năm kinh nghiệm thiết kế đồ họa, photography, brand identity và motion design tại Việt Nam.',
  keywords:     'multimedia designer vietnam, thiết kế đồ họa, graphic designer, photography, brand identity, motion design, Nguyễn Minh Trí, trixinchao',
  googleAnalyticsId: 'G-9VMLRBGTGF',
  // OG image mặc định (dùng favicon/avatar của bạn làm fallback)
  defaultOgImage: 'https://res.cloudinary.com/dft21ara1/image/upload/f_auto,q_auto,w_1200/v1781341495/Favicon_irrmrx.webp',
};

/**
 * Tạo thẻ JSON-LD Schema cho Person + ProfilePage
 * Google Image Search ưu tiên trang có schema rõ ràng
 */
export function getPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type':    'ProfilePage',
    'name':     `${SITE_CONFIG.authorName} — Portfolio`,
    'url':      SITE_CONFIG.website,
    'mainEntity': {
      '@type':       'Person',
      'name':        SITE_CONFIG.authorName,
      'alternateName': SITE_CONFIG.designerName,
      'jobTitle':    SITE_CONFIG.role,
      'email':       SITE_CONFIG.email,
      'url':         SITE_CONFIG.website,
      'image':       SITE_CONFIG.defaultOgImage,
      'sameAs':      [SITE_CONFIG.linkedin],
      'knowsAbout':  ['Graphic Design', 'Photography', 'Brand Identity', 'Motion Design', 'Multimedia'],
    },
  };
}

/**
 * Tạo JSON-LD Schema cho một Project cụ thể (ImageGallery)
 * @param {{ name: string, description: string, images: Array<{cloudinaryId: string}> }} project
 */
export function getProjectSchema(project, firstImageUrl) {
  return {
    '@context':   'https://schema.org',
    '@type':      'ImageGallery',
    'name':       `${project.name} — ${SITE_CONFIG.authorName}`,
    'description': project.excerpt || `Bộ sưu tập ảnh "${project.name}" bởi ${SITE_CONFIG.designerName}`,
    'author': {
      '@type': 'Person',
      'name':  SITE_CONFIG.authorName,
      'url':   SITE_CONFIG.website,
    },
    'url':         window.location.href,
    ...(firstImageUrl && { 'image': firstImageUrl }),
    'copyrightHolder': {
      '@type': 'Person',
      'name':  SITE_CONFIG.designerName,
    },
    'copyrightYear': new Date().getFullYear(),
    'license':    'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  };
}

/**
 * Upsert (tạo mới hoặc cập nhật) 1 thẻ <meta>
 * Tránh tạo duplicate thẻ khi gọi nhiều lần
 */
function upsertMeta(attrs) {
  const selector = Object.entries(attrs)
    .filter(([k]) => k !== 'content')
    .map(([k, v]) => `[${k}="${v}"]`)
    .join('');
  let el = document.head.querySelector(`meta${selector}`);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'content') el.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  el.content = attrs.content;
  return el;
}

/**
 * Upsert thẻ <link>
 */
function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * Inject/update JSON-LD Script
 */
function upsertJsonLd(id, data) {
  let el = document.head.querySelector(`script#${id}`);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id   = id;
    document.head.appendChild(el);
  }
  el.text = JSON.stringify(data);
}

/**
 * Inject Google Analytics (chỉ chạy 1 lần)
 */
function injectGA() {
  if (!SITE_CONFIG.googleAnalyticsId || document.querySelector('#ga-script')) return;
  const s1 = document.createElement('script');
  s1.id    = 'ga-script';
  s1.async = true;
  s1.src   = `https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.googleAnalyticsId}`;
  document.head.appendChild(s1);

  const s2 = document.createElement('script');
  s2.text  = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${SITE_CONFIG.googleAnalyticsId}');`;
  document.head.appendChild(s2);
}

/**
 * SEO cho trang chủ (index.html)
 * Gọi 1 lần khi initHomePage()
 */
export function injectSEO() {
  // ─── Cập nhật title ───────────────────────────────────────────────────────
  document.title = SITE_CONFIG.title;

  // ─── Meta cơ bản ──────────────────────────────────────────────────────────
  upsertMeta({ name: 'description',  content: SITE_CONFIG.description });
  upsertMeta({ name: 'keywords',     content: SITE_CONFIG.keywords });
  upsertMeta({ name: 'author',       content: `${SITE_CONFIG.authorName} (${SITE_CONFIG.designerName})` });
  upsertMeta({ name: 'robots',       content: 'index, follow' });

  // ─── Open Graph (Facebook, LinkedIn, Zalo...) ────────────────────────────
  upsertMeta({ property: 'og:type',         content: 'profile' });
  upsertMeta({ property: 'og:title',        content: SITE_CONFIG.title });
  upsertMeta({ property: 'og:description',  content: SITE_CONFIG.description });
  upsertMeta({ property: 'og:url',          content: SITE_CONFIG.website });
  upsertMeta({ property: 'og:image',        content: SITE_CONFIG.defaultOgImage });
  upsertMeta({ property: 'og:image:width',  content: '1200' });
  upsertMeta({ property: 'og:image:height', content: '630' });
  upsertMeta({ property: 'og:locale',       content: 'vi_VN' });
  upsertMeta({ property: 'og:site_name',    content: 'trixinchao Portfolio' });

  // ─── Twitter/X Card ───────────────────────────────────────────────────────
  upsertMeta({ name: 'twitter:card',        content: 'summary_large_image' });
  upsertMeta({ name: 'twitter:title',       content: SITE_CONFIG.title });
  upsertMeta({ name: 'twitter:description', content: SITE_CONFIG.description });
  upsertMeta({ name: 'twitter:image',       content: SITE_CONFIG.defaultOgImage });

  // ─── Canonical URL ────────────────────────────────────────────────────────
  upsertLink('canonical', SITE_CONFIG.website);

  // ─── JSON-LD Schema ───────────────────────────────────────────────────────
  upsertJsonLd('schema-person', getPersonSchema());

  // ─── Google Analytics ────────────────────────────────────────────────────
  injectGA();
}

/**
 * SEO động cho trang project (project.html)
 * Gọi sau khi đã fetch được project data từ Firestore
 *
 * @param {{ name: string, excerpt?: string, images: Array }} project
 * @param {string} firstImageUrl - URL Cloudinary ảnh đầu tiên (dùng làm OG image)
 */
export function injectProjectSEO(project, firstImageUrl) {
  const pageTitle   = `${project.name} — ${SITE_CONFIG.authorName}`;
  const description = project.excerpt
    ? `${project.excerpt} | ${SITE_CONFIG.authorName} - ${SITE_CONFIG.role}`
    : `Bộ sưu tập ảnh "${project.name}" bởi ${SITE_CONFIG.designerName} — ${SITE_CONFIG.role} tại Việt Nam.`;

  // OG image: dùng ảnh đầu tiên của project (resize 1200w, crop fill để đẹp)
  const ogImage = firstImageUrl || SITE_CONFIG.defaultOgImage;
  const pageUrl  = window.location.href;

  // ─── Title ────────────────────────────────────────────────────────────────
  document.title = pageTitle;

  // ─── Meta cơ bản ──────────────────────────────────────────────────────────
  upsertMeta({ name: 'description', content: description });
  upsertMeta({ name: 'author',      content: SITE_CONFIG.authorName });
  upsertMeta({ name: 'robots',      content: 'index, follow' });

  // ─── Open Graph ──────────────────────────────────────────────────────────
  upsertMeta({ property: 'og:type',         content: 'article' });
  upsertMeta({ property: 'og:title',        content: pageTitle });
  upsertMeta({ property: 'og:description',  content: description });
  upsertMeta({ property: 'og:url',          content: pageUrl });
  upsertMeta({ property: 'og:image',        content: ogImage });
  upsertMeta({ property: 'og:image:width',  content: '1200' });
  upsertMeta({ property: 'og:image:height', content: '630' });
  upsertMeta({ property: 'og:locale',       content: 'vi_VN' });
  upsertMeta({ property: 'og:site_name',    content: 'trixinchao Portfolio' });

  // ─── Twitter Card ─────────────────────────────────────────────────────────
  upsertMeta({ name: 'twitter:card',        content: 'summary_large_image' });
  upsertMeta({ name: 'twitter:title',       content: pageTitle });
  upsertMeta({ name: 'twitter:description', content: description });
  upsertMeta({ name: 'twitter:image',       content: ogImage });

  // ─── Canonical ────────────────────────────────────────────────────────────
  upsertLink('canonical', pageUrl);

  // ─── JSON-LD Schema ImageGallery ─────────────────────────────────────────
  upsertJsonLd('schema-project', getProjectSchema(project, ogImage));

  // ─── Google Analytics ────────────────────────────────────────────────────
  injectGA();
}
