/**
 * Paylasilabilir blog linkleri: /blog/<yazi-id>
 *
 * blog.html tek sayfa; tum yazilar ayni dosyada. WhatsApp / Instagram / Facebook
 * link onizlemesi sayfadaki og: etiketlerini okudugu icin her yaziya ayri
 * baslik, aciklama ve gorsel lazim. Bu fonksiyon blog.html'i okuyup istenen
 * yazinin baslik/ozet/gorselini <head>'e yazar ve sayfayi o yazi acik halde
 * dondurur. Bilinmeyen id -> /blog.html.
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://onlinevipdershane.com';
let cached = null;

async function loadBlogHtml(req) {
  if (cached) return cached;
  const candidates = [
    path.join(process.cwd(), 'blog.html'),
    path.join(__dirname, '..', 'blog.html')
  ];
  for (const p of candidates) {
    try {
      cached = fs.readFileSync(p, 'utf8');
      return cached;
    } catch (_) { /* sonraki aday */ }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'onlinevipdershane.com';
  const r = await fetch(`https://${host}/blog.html`);
  if (!r.ok) throw new Error('blog.html okunamadi: ' + r.status);
  cached = await r.text();
  return cached;
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function stripTags(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|’/g, '’')
    .replace(/\s+/g, ' ')
    .trim();
}

function findPost(html, id) {
  const start = html.indexOf(`<article class="article-card" id="${id}"`);
  if (start < 0) return null;
  const end = html.indexOf('</article>', start);
  const block = html.slice(start, end > 0 ? end : undefined);
  const title = stripTags((block.match(/<h2 class="article-title"[^>]*>([\s\S]*?)<\/h2>/) || [])[1]);
  const excerpt = stripTags((block.match(/<p class="article-excerpt">([\s\S]*?)<\/p>/) || [])[1]);
  const date = (block.match(/itemprop="datePublished" content="([^"]+)"/) || [])[1] || '';
  if (!title) return null;
  return { title, excerpt, date };
}

function setMeta(html, attr, key, value) {
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*">`);
  const tag = `<meta ${attr}="${key}" content="${esc(value)}">`;
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}\n</head>`);
}

module.exports = async function handler(req, res) {
  const id = String(req.query?.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 80);
  let html;
  try {
    html = await loadBlogHtml(req);
  } catch (e) {
    console.error('[blog-post]', e);
    res.statusCode = 302;
    res.setHeader('Location', '/blog.html');
    return res.end();
  }
  const post = id && findPost(html, id);
  if (!post) {
    res.statusCode = 302;
    res.setHeader('Location', '/blog.html');
    return res.end();
  }

  const url = `${SITE}/blog/${id}`;
  const image = `${SITE}/assets/img/blog/og/${id}.jpg`;
  const desc = post.excerpt.length > 200 ? post.excerpt.slice(0, 197).replace(/\s+\S*$/, '') + '…' : post.excerpt;

  let out = html;
  // /blog/<id> altinda goreli yollar kirilmasin
  out = out.replace(/(\s(?:src|href))="(?!https?:|\/|#|javascript:|mailto:|tel:|data:|\{)([^"]+)"/g, '$1="/$2"');
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(post.title)} — Online VIP Dershane</title>`);
  out = out.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  out = setMeta(out, 'name', 'description', desc);
  out = setMeta(out, 'property', 'og:title', post.title);
  out = setMeta(out, 'property', 'og:description', desc);
  out = setMeta(out, 'property', 'og:url', url);
  out = setMeta(out, 'property', 'og:type', 'article');
  out = setMeta(out, 'property', 'og:image', image);
  out = setMeta(out, 'property', 'og:image:width', '1200');
  out = setMeta(out, 'property', 'og:image:height', '630');
  out = setMeta(out, 'property', 'og:site_name', 'Online VIP Dershane');
  out = setMeta(out, 'property', 'og:locale', 'tr_TR');
  out = setMeta(out, 'name', 'twitter:card', 'summary_large_image');
  out = setMeta(out, 'name', 'twitter:image', image);
  if (post.date) out = setMeta(out, 'property', 'article:published_time', post.date);
  out = out.replace('</head>', `<script>window.__BLOG_POST_ID=${JSON.stringify(id)};</script>\n</head>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  return res.end(out);
};
