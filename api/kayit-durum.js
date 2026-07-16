const { kommoConfig, sanitizeToken } = require('./_lib/kommo');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = kommoConfig();
  const token = sanitizeToken(process.env.KOMMO_ACCESS_TOKEN);
  const subdomain = String(process.env.KOMMO_SUBDOMAIN || '').trim();

  if (!cfg || !token || !subdomain) {
    return res.status(200).json({
      ok: false,
      kommo: { configured: false, subdomain: subdomain || null, tokenLength: token.length },
      formspree: { formId: process.env.FORMSPREE_FORM_ID || 'mpqnjdwd' },
    });
  }

  const headers = { Authorization: `Bearer ${token}` };
  const base = `https://${cfg.subdomain}.kommo.com/api/v4`;

  let accountStatus = null;
  let accountError = null;
  let account = null;
  let pipelines = null;
  let recentLeads = null;

  try {
    const accountRes = await fetch(`${base}/account`, { headers });
    accountStatus = accountRes.status;
    if (accountRes.ok) {
      account = await accountRes.json();
    } else {
      accountError = await accountRes.text();
    }
  } catch (err) {
    accountError = err.message;
  }

  if (accountStatus === 200) {
    try {
      const pipelinesRes = await fetch(`${base}/leads/pipelines`, { headers });
      if (pipelinesRes.ok) {
        const data = await pipelinesRes.json();
        pipelines = (data._embedded?.pipelines || []).map((pl) => ({
          id: pl.id,
          name: pl.name,
          statuses: (pl._embedded?.statuses || []).map((st) => ({
            id: st.id,
            name: st.name,
          })),
        }));
      }
    } catch (_) {}

    try {
      const leadsRes = await fetch(`${base}/leads?limit=8&order[created_at]=desc`, { headers });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        recentLeads = (data._embedded?.leads || []).map((lead) => ({
          id: lead.id,
          name: lead.name,
          pipelineId: lead.pipeline_id,
          statusId: lead.status_id,
          createdAt: lead.created_at,
        }));
      }
    } catch (_) {}
  }

  const targetPipelineId = cfg.pipelineId;
  const targetStatusId = cfg.statusId;
  const targetPipeline = pipelines?.find((pl) => pl.id === targetPipelineId) || null;
  const targetStatus =
    targetPipeline?.statuses?.find((st) => st.id === targetStatusId) || null;

  const payload = {
    ok: accountStatus === 200,
    kommo: {
      configured: true,
      subdomain: cfg.subdomain,
      tokenLength: token.length,
      account: account?.name || account?.id || null,
      accountStatus,
      accountError,
      target: {
        pipelineId: targetPipelineId,
        pipelineName: targetPipeline?.name || null,
        statusId: targetStatusId,
        statusName: targetStatus?.name || null,
        valid: Boolean(targetPipeline && targetStatus),
      },
      pipelines,
      recentLeads,
    },
    formspree: { formId: process.env.FORMSPREE_FORM_ID || 'mpqnjdwd' },
  };

  return res.status(200).json(payload);
};
