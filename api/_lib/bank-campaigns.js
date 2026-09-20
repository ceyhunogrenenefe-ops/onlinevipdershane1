const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'bank-campaigns.json');
const LIVE_PATH = path.join(__dirname, 'bank-campaigns.live.json');

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function loadConfig() {
  return readJsonSafe(CONFIG_PATH, { title: 'Bankaların Eğitime Taksit Avantajları', banks: [] });
}

function loadLive() {
  return readJsonSafe(LIVE_PATH, { updatedAt: null, banks: {} });
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) {
    const t = stripHtml(h1[1]).slice(0, 120);
    if (t.length > 8) return t;
  }
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i);
  if (og && og[1].trim().length > 8) return og[1].trim().slice(0, 120);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) return stripHtml(title[1]).slice(0, 120);
  return '';
}

function extractInstallments(text) {
  const found = new Set();
  const re = /(?:\+|artı\s*)?(\d{1,2})\s*(?:'ya|'ye|'a|'e)?\s*(?:varan\s+)?taksit/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = parseInt(m[1], 10);
    if (n >= 2 && n <= 18) found.add(n);
  }
  return [...found].sort((a, b) => a - b).slice(0, 6);
}

function extractPeriod(text) {
  const m = text.match(
    /(\d{1,2}\s*(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)[^\d]{0,12}\d{4}[^.|]{0,40}\d{4})/i
  );
  return m ? m[1].replace(/\s+/g, ' ').trim().slice(0, 80) : '';
}

function extractSummary(text, fallback) {
  const hit = text.match(
    /(?:2 veya 3 taksit[^.]+[.])|(?:2 taksite[^.]+[.])|(?:\+\d\s*taksit[^.]+[.])/i
  );
  if (hit) return hit[0].trim().slice(0, 280);
  return fallback;
}

async function fetchText(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'OnlineVIPDershaneCampaignBot/1.0 (+https://onlinevipdershane.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

function parseCampaignHtml(html, fallback) {
  const text = stripHtml(html);
  const title = extractTitle(html) || fallback.title;
  const installments = extractInstallments(text);
  return {
    title,
    summary: extractSummary(text, fallback.summary),
    installments: installments.length ? installments : fallback.installments,
    period: extractPeriod(text) || fallback.period,
    source: 'live',
  };
}

async function scrapeBank(bank, timeoutMs) {
  const html = await fetchText(bank.url, timeoutMs);
  return parseCampaignHtml(html, bank.fallback);
}

function mergeBank(bank, liveEntry) {
  const fallback = bank.fallback || {};
  const live = liveEntry && liveEntry.title ? liveEntry : null;
  const chosen = live || { ...fallback, source: 'fallback' };
  return {
    id: bank.id,
    name: bank.name,
    providerIds: bank.providerIds || [bank.id],
    color: bank.color || '#1a3fad',
    url: bank.url,
    listUrl: bank.listUrl || bank.url,
    title: chosen.title || fallback.title,
    summary: chosen.summary || fallback.summary,
    installments: chosen.installments && chosen.installments.length
      ? chosen.installments
      : fallback.installments || [],
    period: chosen.period || fallback.period || '',
    source: chosen.source || (live ? 'cache' : 'fallback'),
  };
}

async function buildCampaignPayload({ refresh = false, timeoutMs = 4500 } = {}) {
  const config = loadConfig();
  const liveFile = loadLive();
  const liveBanks = liveFile.banks || {};
  const banks = [];

  for (const bank of config.banks || []) {
    let live = liveBanks[bank.id] || null;
    if (refresh) {
      try {
        live = await scrapeBank(bank, timeoutMs);
      } catch (_) {
        live = liveBanks[bank.id] || null;
      }
    }
    banks.push(mergeBank(bank, live));
  }

  return {
    title: config.title,
    disclaimer: config.disclaimer,
    updatedAt: liveFile.updatedAt || null,
    banks,
  };
}

module.exports = {
  loadConfig,
  loadLive,
  LIVE_PATH,
  parseCampaignHtml,
  scrapeBank,
  buildCampaignPayload,
  extractInstallments,
};
