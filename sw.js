// English. Made Fun. service worker (Oct 12, 2026).
// The app page: always asked fresh from the network (with a unique address, so a stale copy on GitHub's servers can't be
// served); if the network hasn't answered within 4 seconds, the copy saved on the phone opens instead and the fresh
// one is saved in the background for next time. Offline: the saved copy.
// Downloadable files, audio and page images (files/*.bin) never change once published (the name is a fingerprint of
// the bytes), so they are served from their own cache first: everything opened once works offline.
const CACHE='emf-202610190758', FCACHE='emf-files', WAIT=4000;
const FILES=['./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./atkinson-hyperlegible-latin-400-normal.woff2','./atkinson-hyperlegible-latin-700-normal.woff2','./bricolage-grotesque-latin-600-normal.woff2','./bricolage-grotesque-latin-800-normal.woff2'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==FCACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const saved=key=>caches.match(key,{ignoreSearch:true});
self.addEventListener('fetch',e=>{
  const r=e.request, url=new URL(r.url);
  if(r.method!=='GET'||url.origin!==location.origin) return;
  if(url.pathname.endsWith('/version.json')) return; // always live, never saved
  if(url.pathname.includes('/files/')){
    e.respondWith(caches.open(FCACHE).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;}))));
    return;
  }
  const page=r.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  const key=page?'./index.html':r;
  const net=fetch(page?'./index.html?fresh='+Date.now():r,{cache:'no-store'}).then(res=>{
    if(res&&res.ok){const copy=res.clone();return caches.open(CACHE).then(c=>c.put(key,copy)).then(()=>res,()=>res);}
    return res;
  });
  e.waitUntil(net.catch(()=>{}));
  e.respondWith(new Promise(resolve=>{
    let done=false; const give=x=>{if(!done&&x){done=true;resolve(x);}};
    net.then(res=>{ if(res&&res.ok) give(res); else saved(key).then(m=>give(m||res)); })
       .catch(()=>saved(key).then(m=>give(m||Response.error())));
    setTimeout(()=>saved(key).then(m=>give(m)),WAIT);
  }));
});
