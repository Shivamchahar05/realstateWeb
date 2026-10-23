import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SITE = 'https://titlefolio.netlify.app';
const API = 'https://propsure-k6fu.onrender.com/api';
const root = process.cwd();
const dist = join(root, 'dist/web/browser');

const staticPages = [
  { path: '/', title: 'Verified homes in Gurgaon, Noida, Delhi and Faridabad', description: 'Titlefolio lists homes across NCR that already passed document review and a site inspection.' },
  { path: '/browse', title: 'Verified homes in NCR', description: 'Browse verified homes in Gurgaon, Noida, Delhi and Faridabad.' },
  { path: '/blog', title: 'Guides for buying a verified home', description: 'Locality notes, document checks, and buying advice for verified homes in NCR.' },
  { path: '/about', title: 'About Titlefolio', description: 'Titlefolio lists verified homes for buyers and sellers across NCR.' },
  { path: '/contact', title: 'Contact', description: 'Questions about a listing, a seller account, or your own data.' },
  { path: '/stamp-duty', title: 'Stamp duty calculator', description: 'Estimate stamp duty for a home in Gurgaon, Faridabad, Delhi or Noida.' },
  { path: '/affordability', title: 'Home affordability calculator', description: 'See the home price a monthly income can support in NCR.' },
  { path: '/price-insights', title: 'Price insights for NCR homes', description: 'Median asking prices for verified homes in Gurgaon, Noida, Delhi and Faridabad.' },
  { path: '/privacy', title: 'Privacy', description: 'What Titlefolio stores, and what we use it for.' },
  { path: '/terms', title: 'Terms', description: 'The rules for using Titlefolio.' },
];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 4000));
    }
  }
  throw lastError;
}

function replaceMeta(html, attr, key, content) {
  const tag = `<meta ${attr}="${key}" content="${esc(content)}">`;
  const pattern = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `${tag}</head>`);
}

function render(shell, page) {
  const title = page.title.includes('Titlefolio') ? page.title : `${page.title} | Titlefolio`;
  let html = shell.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = replaceMeta(html, 'name', 'description', page.description);
  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', page.description.slice(0, 180));
  html = replaceMeta(html, 'property', 'og:url', page.url);
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', page.description.slice(0, 180));
  if (page.image) {
    html = replaceMeta(html, 'property', 'og:image', page.image);
    html = replaceMeta(html, 'name', 'twitter:image', page.image);
    html = html.replace('name="twitter:card" content="summary"', 'name="twitter:card" content="summary_large_image"');
  }
  const json = page.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';
  html = html.replace(/<link rel="canonical" href="[^"]*">/, '');
  html = html.replace('</head>', `<link rel="canonical" href="${esc(page.url)}">${json}</head>`);
  html = html.replace(
    /<app-root>\s*<\/app-root>/,
    `<app-root><h1>${esc(page.heading || page.title)}</h1><p>${esc(page.description)}</p></app-root>`,
  );
  return html;
}

function writePage(shell, page) {
  if (page.path === '/') return;
  const parts = page.path.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const file = join(dist, ...parts, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(shell, page));
}

function sitemap(urls) {
  const body = urls
    .map((url) => `  <url><loc>${esc(url)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

const shell = readFileSync(join(dist, 'index.html'), 'utf8');
const properties = (await getJson(`${API}/catalog/properties?limit=100`)).data ?? [];
const posts = (await getJson(`${API}/blog/posts?limit=100`)).data ?? [];

const pages = staticPages.map((page) => ({ ...page, url: `${SITE}${page.path === '/' ? '/' : page.path}` }));

for (const property of properties) {
  const description = (property.description || `${property.title} in ${property.locality}, ${property.city}.`).replace(/\s+/g, ' ').trim();
  const path = `/properties/${property.id}`;
  const image = property.media?.find((item) => item.url && !String(item.type || item.mediaType || '').toUpperCase().includes('VIDEO'))?.url;
  pages.push({
    path,
    url: `${SITE}${path}`,
    title: property.title,
    heading: property.title,
    description,
    image: image && /^https?:\/\//.test(image) ? image : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: property.title,
      description,
      url: `${SITE}${path}`,
    },
  });
  if (property.city && property.locality) {
    const localityPath = `/localities/${encodeURIComponent(property.city)}/${encodeURIComponent(property.locality)}`;
    if (!pages.some((page) => page.path === localityPath)) {
      pages.push({
        path: localityPath,
        url: `${SITE}${localityPath}`,
        title: `Homes in ${property.locality}, ${property.city}`,
        description: `Verified homes in ${property.locality}, ${property.city}.`,
      });
    }
  }
}

for (const post of posts) {
  if (!post.slug || post.category === 'News') continue;
  const path = `/blog/${post.slug}`;
  pages.push({
    path,
    url: `${SITE}${path}`,
    title: post.title,
    description: post.excerpt || post.title,
    image: post.coverImageUrl && /^https?:\/\//.test(post.coverImageUrl) ? post.coverImageUrl : undefined,
  });
}

const home = pages.find((page) => page.path === '/');
writeFileSync(join(dist, 'index.html'), render(shell, home));
for (const page of pages) writePage(shell, page);

const xml = sitemap(pages.map((page) => page.url));
writeFileSync(join(dist, 'sitemap.xml'), xml);
writeFileSync(join(root, 'public/sitemap.xml'), xml);
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nDisallow: /login\nDisallow: /register\nDisallow: /saved\nDisallow: /account\nDisallow: /my-requests\nDisallow: /seller/\nDisallow: /compare\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

console.log(`SEO files written for ${pages.length} pages`);
