function sanitizeToken(raw) {
  return String(raw || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\s+/g, '');
}

function kommoConfig() {
  const subdomain = String(process.env.KOMMO_SUBDOMAIN || '').trim();
  const token = sanitizeToken(process.env.KOMMO_ACCESS_TOKEN);
  if (!subdomain || !token) return null;
  return {
    subdomain: subdomain.replace(/\.kommo\.com$/i, ''),
    token,
    // WEBSİTESİ FORM → İlk Temas (override via KOMMO_PIPELINE_ID / KOMMO_STATUS_ID)
    pipelineId: process.env.KOMMO_PIPELINE_ID ? Number(process.env.KOMMO_PIPELINE_ID) : 13764288,
    statusId: process.env.KOMMO_STATUS_ID ? Number(process.env.KOMMO_STATUS_ID) : 106196664,
    responsibleUserId: process.env.KOMMO_RESPONSIBLE_USER_ID
      ? Number(process.env.KOMMO_RESPONSIBLE_USER_ID)
      : null,
  };
}

function phoneValue(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('90')) return '+' + digits;
  if (digits.startsWith('0')) return '+9' + digits;
  return '+90' + digits;
}

function splitName(adSoyad) {
  const parts = String(adSoyad || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { ad: '', soyad: '' };
  if (parts.length === 1) return { ad: parts[0], soyad: '' };
  return { ad: parts[0], soyad: parts.slice(1).join(' ') };
}

function defaultLeadTitle(payload) {
  const leadName = [payload.ad, payload.soyad].filter(Boolean).join(' ').trim();
  let title = leadName
    ? `${leadName} | ${payload.sinif || '-'} | ${payload.program || 'Web Kayıt'}`
    : `Web Kayıt | ${payload.program || 'Program seçilmedi'}`;
  if (payload.okul) title += ` | ${payload.okul}`;
  if (payload.not) title += ` | Not: ${payload.not.slice(0, 80)}`;
  return title;
}

async function createKommoLead(payload, options = {}) {
  const cfg = kommoConfig();
  if (!cfg) return { skipped: true, reason: 'Kommo not configured' };

  const tag = options.tag || 'Web Kayıt Formu';
  const title = options.title || defaultLeadTitle(payload);

  const contactFields = [];
  const email = String(payload.email || '').trim();
  const phone = phoneValue(payload.telefon);
  if (email) {
    contactFields.push({
      field_code: 'EMAIL',
      values: [{ value: email, enum_code: 'WORK' }],
    });
  }
  if (phone) {
    contactFields.push({
      field_code: 'PHONE',
      values: [{ value: phone, enum_code: 'WORK' }],
    });
  }

  const lead = {
    name: title,
    _embedded: {
      tags: [{ name: tag }],
      contacts: [
        {
          first_name: payload.ad || 'Web',
          last_name: payload.soyad || 'Kayıt',
          custom_fields_values: contactFields,
        },
      ],
    },
  };

  if (cfg.pipelineId) lead.pipeline_id = cfg.pipelineId;
  if (cfg.statusId) lead.status_id = cfg.statusId;
  if (cfg.responsibleUserId) lead.responsible_user_id = cfg.responsibleUserId;

  const url = `https://${cfg.subdomain}.kommo.com/api/v4/leads/complex`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([lead]),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error('Kommo API error');
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return { ok: true, data };
}

module.exports = { kommoConfig, sanitizeToken, splitName, createKommoLead };
