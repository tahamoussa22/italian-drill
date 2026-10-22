var C="piano-v1";
self.addEventListener("install",function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(["./","./manifest.json","./icon-192.png"]).catch(function(){});}));});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));});
/* media elements ask for byte ranges (Safari insists on 206 answers); serve a slice of the cached full file */
function ranged(req,res){
  var h=req.headers.get("range"); if(!h||!res) return Promise.resolve(res);
  var m=/bytes=(\d*)-(\d*)/.exec(h); if(!m) return Promise.resolve(res);
  return res.arrayBuffer().then(function(buf){ var n=buf.byteLength, s=m[1]===""?Math.max(0,n-parseInt(m[2],10)):parseInt(m[1],10), en=(m[1]===""||m[2]==="")?n-1:Math.min(n-1,parseInt(m[2],10)); if(s>en||s>=n) return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+n}}); return new Response(buf.slice(s,en+1),{status:206,statusText:"Partial Content",headers:{"Content-Type":res.headers.get("Content-Type")||"audio/mpeg","Content-Length":String(en-s+1),"Content-Range":"bytes "+s+"-"+en+"/"+n}}); });
}
self.addEventListener("fetch",function(e){
  var r=e.request; if(r.method!=="GET"||new URL(r.url).origin!==location.origin) return;
  var isAudio=/\/audio\/[0-9a-f]+\.mp3$/.test(new URL(r.url).pathname);
  if(isAudio){
    /* cache first: recordings never change */
    e.respondWith(caches.match(r.url,{ignoreSearch:true}).then(function(m){
      if(m) return ranged(r,m.clone());
      return fetch(r.url).then(function(res){ if(res&&res.ok){ var cp=res.clone(); caches.open(C).then(function(c){c.put(r.url,cp);}); return ranged(r,res.clone()); } return res; });
    }).catch(function(){ return new Response(null,{status:504}); }));
    return;
  }
  e.respondWith(fetch(r).then(function(res){ if(res&&res.ok){ var cp=res.clone(); caches.open(C).then(function(c){c.put(r,cp);}); } return res; }).catch(function(){ return caches.match(r,{ignoreSearch:true}).then(function(m){ return m||caches.match("./"); }); }));
});
