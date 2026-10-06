export class KpiStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  async fetch(request) {
    try {
      if (request.method === 'GET') {
        const records = (await this.state.storage.get('records')) || [];
        return this.json({ ok: true, records });
      }

      if (request.method === 'POST' || request.method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        const changes = Array.isArray(body?.changes) ? body.changes : [];
        if (changes.length > 1000) return this.json({ ok: false, error: 'Muitos registros em uma única gravação.' }, 400);

        const current = (await this.state.storage.get('records')) || [];
        const byDate = new Map(current.filter(Boolean).map(r => [String(r.date || ''), r]));

        for (const raw of changes) {
          if (!raw || typeof raw !== 'object') continue;
          const date = String(raw.date || '');
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
          byDate.set(date, { ...raw, date, serverUpdatedAt: Date.now() });
        }

        const records = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        await this.state.storage.put('records', records);
        return this.json({ ok: true, records });
      }

      return this.json({ ok: false, error: 'Método não permitido.' }, 405);
    } catch (e) {
      return this.json({ ok: false, error: String(e?.message || e) }, 500);
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/kpi' || url.pathname === '/api/kpi/') {
      const id = env.KPI_STORE.idFromName('imperio-kpi-global');
      return env.KPI_STORE.get(id).fetch(request);
    }

    if (url.pathname === '/api/kpi/health') {
      return new Response(JSON.stringify({ ok: true, service: 'kpi-shared', version: '35.10.47' }), {
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
