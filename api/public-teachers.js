/**
 * Panel public öğretmen API proxy (CORS / tek origin).
 * GET /api/public-teachers
 * GET /api/public-teachers?slug=
 */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
}

/** YouTube/Google avatar =s108 gibi küçük boyutları yükselt (bulanıklık önleme) */
function upgradeRemotePhotoUrl(url, minSize) {
  minSize = minSize || 800;
  var u = String(url || '').trim();
  if (!u) return u;
  if (!/ggpht\.com|googleusercontent\.com/i.test(u)) return u;
  return u.replace(/=s(\d+)/i, function (match, n) {
    var size = parseInt(n, 10);
    if (!Number.isFinite(size) || size === 0 || size >= minSize) return match;
    return '=s' + minSize;
  });
}

function isUsablePhoto(url) {
  var u = String(url || '').trim();
  if (!u) return false;
  if (/^https?:\/\//i.test(u)) return true;
  if (/^\/?assets\//i.test(u)) return true;
  if (u.charAt(0) === '/' && u.indexOf(' ') === -1) return true;
  return false;
}

function titleCaseTr(s) {
  return String(s == null ? '' : s)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(function (w) {
      if (/^(LGS|TYT|AYT|YKS|KPSS|VIP)$/i.test(w)) return w.toUpperCase();
      var lower = w.toLocaleLowerCase('tr-TR');
      return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
    })
    .join(' ');
}

var PHOTO_OVERRIDES = {
  'yasin-kandemir': '/assets/img/kadro/yasin-kandemir.jpg',
  'ali-aktas': '/assets/img/kadro/ali-aktas.jpg',
  'sultan-kurt': '/assets/img/kadro/sultan-kurt.jpg',
  'merve-yetkin': '/assets/img/kadro/merve-yetkin.jpg'
};

/** Panel foto_url bozuk/boşsa site kadro görselleri */
var PHOTO_FALLBACKS = {
  'sultan-kurt': '/assets/img/kadro/sultan-kurt.jpg',
  'yilmaz-isik': '/assets/img/kadro/yilmaz-isik.jpg',
  'tayyibe-ogrenenefe': '/assets/img/kadro/tayyibe-ogrenenefe-2.jpg',
  'yasin-kandemir': '/assets/img/kadro/yasin-kandemir.jpg',
  'kaan-inaltekin': '/assets/img/kadro/kaan-inaltekin.jpg'
};

var DISPLAY_FALLBACKS = {
  'yilmaz-isik': { name: 'Yılmaz Işık', title: 'Matematik Öğretmeni', branch: 'Matematik' },
  'sultan-kurt': { name: 'Sultan Kurt' },
  'kaan-inaltekin': { name: 'Kaan İnaltekin', title: 'Öğretmen' }
};

/** Liste API video_url eksik olsa bile bilinen oynatılabilir tanıtım videoları */
var VIDEO_FALLBACKS = {
  'merve-matematik': 'https://youtube.com/shorts/rjGPSQNVtoo',
  'merve-yetkin': 'https://www.youtube.com/watch?v=LQeDZFLZ63w',
  'ceyhun-ogrenenefe': 'https://youtu.be/Wlt_E9x7Vrs',
  'ali-aktas': 'https://youtu.be/pGq1SMo2kY8'
};

/** Panel videos jsonb + legacy video_url → en fazla 3 kayıt; ilki tanıtım */
function normalizeVideos(raw, fallbackUrl) {
  var list = [];
  if (Array.isArray(raw)) {
    raw.forEach(function (item, idx) {
      var url = '';
      var title = '';
      var id = 'v-' + (idx + 1);
      if (typeof item === 'string') {
        url = String(item || '').trim();
      } else if (item && typeof item === 'object') {
        url = String(item.url || item.public_url || item.video_url || '').trim();
        title = String(item.title || '').trim();
        if (item.id) id = String(item.id);
      }
      if (!url) return;
      list.push({ id: id, url: url, title: title });
    });
  }
  if (!list.length) {
    var legacy = String(fallbackUrl || '').trim();
    if (legacy) list.push({ id: 'v-1', url: legacy, title: '' });
  }
  return list.slice(0, 3);
}

function normalizeTeacher(t) {
  if (!t || typeof t !== 'object') return t;
  var slug = String(t.slug || '');
  var fb = DISPLAY_FALLBACKS[slug] || {};
  var photo = PHOTO_OVERRIDES[slug] || upgradeRemotePhotoUrl(t.photo_url);
  if (!isUsablePhoto(photo)) photo = PHOTO_FALLBACKS[slug] || photo || '';
  var videos = normalizeVideos(t.videos, t.video_url);
  if (!videos.length && VIDEO_FALLBACKS[slug]) {
    videos = [{ id: 'v-1', url: VIDEO_FALLBACKS[slug], title: '' }];
  }
  var video = videos[0] ? videos[0].url : String(t.video_url || '').trim() || VIDEO_FALLBACKS[slug] || '';
  return Object.assign({}, t, {
    photo_url: photo,
    video_url: video || null,
    videos: videos,
    name: titleCaseTr(t.name || fb.name || '') || fb.name || t.name,
    title: titleCaseTr(t.title || fb.title || '') || fb.title || t.title,
    branch: titleCaseTr(t.branch || fb.branch || '') || fb.branch || t.branch
  });
}

function upgradeTeacherPhotos(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload.teachers)) {
    payload.teachers = payload.teachers.map(normalizeTeacher);
  }
  if (payload.teacher && typeof payload.teacher === 'object') {
    payload.teacher = normalizeTeacher(payload.teacher);
  }
  return payload;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const base = String(process.env.KOCLUK_PANEL_URL || '').replace(/\/$/, '');
  if (!base) {
    return res.status(200).json({ teachers: [], source: 'fallback', error: 'panel_not_configured' });
  }

  try {
    const slug = String(req.query.slug || '').trim();
    const url = slug
      ? `${base}/api/public-teachers?slug=${encodeURIComponent(slug)}`
      : `${base}/api/public-teachers`;

    const upstream = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
    });
    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      if (upstream.status === 404) return res.status(404).json({ error: 'not_found' });
      return res.status(502).json({ error: 'upstream_error', status: upstream.status });
    }

    if (slug) {
      return res.status(200).json(
        upgradeTeacherPhotos({
          teacher: data.teacher || null,
          availability_slots:
            data.availability_slots || (data.teacher && data.teacher.availability_slots) || [],
          source: 'panel'
        })
      );
    }
    return res.status(200).json(
      upgradeTeacherPhotos({
        teachers: data.teachers || [],
        managed_slugs: data.managed_slugs || [],
        source: 'panel'
      })
    );
  } catch (err) {
    console.error('[public-teachers]', err);
    return res.status(200).json({ teachers: [], source: 'fallback', error: 'upstream_unreachable' });
  }
};
