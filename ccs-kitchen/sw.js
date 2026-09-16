const CACHE='spruce-shell-v14';
const SHELL=['./','./index.html','./styles.css','./app.js','./demo.js','./model.js','./schema.js','./manifest.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of SHELL){const url=new URL(path,self.location.href);url.searchParams.set('shell',CACHE);const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error('Offline shell download failed');await cache.put(path,response);}})));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spruce-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/health')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});












