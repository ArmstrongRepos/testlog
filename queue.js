// Outbox for notes written without signal. Shared by the page (index.html) and the service worker (sw.js).
// Notes stay in this phone's storage for this site only, and are deleted as soon as the server confirms them.

// The Google Apps Script web app this app opens. Change it here if you redeploy to a new URL.
self.APP_URL = 'https://script.google.com/macros/s/AKfycbwvtK3GDZqI9ttoMjRIRTw-WCdBzgTr94LNnFyUkYcdEACE2UrdZ594GtW8b0EMUjQJLg/exec';

self.TLQueue = (() => {
  const DB = 'test-log', STORE = 'outbox';
  let busy = null;

  function open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'clientId' });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function tx(mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(STORE, mode), s = t.objectStore(STORE);
      const out = fn(s);
      t.oncomplete = () => { db.close(); res(out && 'result' in out ? out.result : undefined); };
      t.onerror = () => { db.close(); rej(t.error); };
    });
  }

  const add = (entry) => tx('readwrite', (s) => s.put(Object.assign({ tries: 0, error: '' }, entry)));
  const all = async () => ((await tx('readonly', (s) => s.getAll())) || []).sort((a, b) => a.recordedAt < b.recordedAt ? -1 : 1);
  const remove = (id) => tx('readwrite', (s) => s.delete(id));
  const update = (e) => tx('readwrite', (s) => s.put(e));

  async function send(e) {
    const entry = { name: e.name, notes: e.notes, photos: e.photos || [], audio: e.audio, clientId: e.clientId, recordedAt: e.recordedAt };
    // text/plain keeps this a "simple" request, which Apps Script accepts from another site.
    const res = await fetch(self.APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save', entry }), redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  // Sends everything waiting. Returns how many are still waiting to retry (failed for good ones are not counted).
  function flush() {
    if (busy) return busy;
    busy = (async () => {
      let left = 0;
      for (const e of await all()) {
        if (e.failed) continue;
        try {
          const r = await send(e);
          if (r.ok) { await remove(e.clientId); continue; }
          e.tries++; e.error = r.error || 'Not accepted'; e.failed = r.retry === false;
        } catch (err) {
          e.tries++; e.error = 'No connection';
        }
        await update(e);
        if (!e.failed) left++;
      }
      return left;
    })().finally(() => { busy = null; });
    return busy;
  }

  return { add, all, remove, update, flush };
})();
