// English. Made Fun. service worker: network first, so students always get the newest version
// when they are online; the last saved copy is used only when they are offline.
// Downloadable files (files/*.bin) never change once published (the name is a fingerprint of the bytes),
// so they are served from their own cache first: saving a handout works offline too.
const CACHE='emf-202610050928', FCACHE='emf-files';
const FILES=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./atkinson-hyperlegible-latin-400-normal.woff2','./atkinson-hyperlegible-latin-700-normal.woff2','./bricolage-grotesque-latin-600-normal.woff2','./bricolage-grotesque-latin-800-normal.woff2'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FCACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin) return;
  if(r.url.endsWith('version.json')) return; // always live
  if(new URL(r.url).pathname.includes('/files/')){
    e.respondWith(caches.open(FCACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;}))));
    return;
  }
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r.mode==='navigate'?'./index.html':r,copy));}
    return res;
  }).catch(()=>caches.match(r.mode==='navigate'?'./index.html':r).then(m=>m||caches.match('./'))));
});
