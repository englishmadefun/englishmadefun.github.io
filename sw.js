// English. Made Fun. service worker: network first, so students always get the newest version
// when they are online; the last saved copy is used only when they are offline.
const CACHE='emf-202610041538';
const FILES=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin) return;
  if(r.url.endsWith('version.json')) return; // always live
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r.mode==='navigate'?'./index.html':r,copy));}
    return res;
  }).catch(()=>caches.match(r.mode==='navigate'?'./index.html':r).then(m=>m||caches.match('./'))));
});
