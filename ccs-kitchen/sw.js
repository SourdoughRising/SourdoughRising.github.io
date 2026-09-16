const CACHE='spruce-shell-v7';
const SHELL=['./','./index.html','./styles.css','./app.js','./model.js','./schema.js','./manifest.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spruce-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/health')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});





