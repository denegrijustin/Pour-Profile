// Thin API client + offline cache/queue. Pour Profile is D1-backed, but a bar or
// distillery tasting room may have poor signal, so reads fall back to the last
// cached response and pour logs queue locally until connectivity returns.

const CACHE_KEY = "pourProfile.cache.v1";
const QUEUE_KEY = "pourProfile.queue.v1";

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}
function writeCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* storage full/unavailable, ignore */ }
}
function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch { /* ignore */ }
}

async function request(path, options = {}) {
  const method = options.method || "GET";
  try {
    const res = await fetch(path, {
      method,
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    if (method === "GET") {
      const cache = readCache();
      cache[path] = { data, cachedAt: Date.now() };
      writeCache(cache);
    }
    return data;
  } catch (err) {
    if (method === "GET") {
      const cache = readCache();
      if (cache[path]) return { ...cache[path].data, _stale: true };
    }
    throw err;
  }
}

export const api = {
  bottles: (params = {}) => request(`/api/bottles?${new URLSearchParams(params)}`),
  bottle: (id) => request(`/api/bottles/${id}`),
  createBottle: (b) => request("/api/bottles", { method: "POST", body: b }),
  updateBottle: (id, b) => request(`/api/bottles/${id}`, { method: "PATCH", body: b }),
  deleteBottle: (id) => request(`/api/bottles/${id}`, { method: "DELETE" }),

  tastings: (params = {}) => request(`/api/tastings?${new URLSearchParams(params)}`),
  createTasting: (t) => queueableWrite("/api/tastings", t),
  updateTasting: (id, t) => request(`/api/tastings/${id}`, { method: "PATCH", body: t }),
  deleteTasting: (id) => request(`/api/tastings/${id}`, { method: "DELETE" }),

  venues: () => request("/api/venues"),
  createVenue: (v) => request("/api/venues", { method: "POST", body: v }),

  distilleries: () => request("/api/distilleries"),
  createDistillery: (d) => request("/api/distilleries", { method: "POST", body: d }),
  updateDistillery: (id, d) => request(`/api/distilleries/${id}`, { method: "PATCH", body: d }),

  flavorTags: () => request("/api/flavor-tags"),
  brandSignals: () => request("/api/brand-signals"),

  palate: () => request("/api/palate"),
  match: (payload) => request("/api/match", { method: "POST", body: payload }),

  barcode: (code) => request(`/api/barcode/${encodeURIComponent(code)}`),
  search: (q) => request(`/api/search?${new URLSearchParams({ q })}`),
  stats: () => request("/api/stats"),

  exportJson: () => request("/api/export.json")
};

// Pours logged offline are queued and flushed on the next successful sync.
async function queueableWrite(path, payload) {
  if (navigator.onLine) {
    try {
      return await request(path, { method: "POST", body: payload });
    } catch (err) {
      queueWrite(path, payload);
      throw err;
    }
  }
  queueWrite(path, payload);
  return { queued: true, tasting: payload };
}

function queueWrite(path, payload) {
  const q = readQueue();
  q.push({ path, payload, queuedAt: Date.now() });
  writeQueue(q);
}

export async function flushQueue() {
  const q = readQueue();
  if (!q.length) return { flushed: 0 };
  const remaining = [];
  let flushed = 0;
  for (const item of q) {
    try {
      await request(item.path, { method: "POST", body: item.payload });
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  return { flushed, remaining: remaining.length };
}

export function pendingQueueCount() {
  return readQueue().length;
}

window.addEventListener("online", () => { flushQueue(); });
