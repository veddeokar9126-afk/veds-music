/* Kafla — app. Data comes from data/catalog.js (generated) and data/curated.js (hand-written). */
"use strict";
/* ============ DATA ============ */
const C=window.CATALOG||{artists:[]}, K=window.CURATED||{artists:{},playlists:[],quiz:[],producers:[]};
const ARTISTS=C.artists.map(a=>({...a,...(K.artists[a.id]||{})}));
const byId=Object.fromEntries(ARTISTS.map(a=>[a.id,a]));
const WOMEN_IDS=["nimrat","sunanda","jasmine","afsana","baani","jenny","simiran","gurlez","jasmeen","kaurb","surinderkaur"];
ARTISTS.forEach(a=>{if(WOMEN_IDS.includes(a.id))a.f=true;});
const WOMEN=ARTISTS.filter(a=>a.f).map(a=>a.id);
const GROUPS={hiphop:"Hip-hop",pop:"Pop",rnb:"R&B",folk:"Folk",legend:"Legends"};
const TODAY=new Date().toISOString().slice(0,10);
const COUNTRY="in";

const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
ARTISTS.forEach(a=>{const h=hash(a.id);a.hue=a.hue??h%360;a.hue2=a.hue2??(h>>9)%360;
  a.short=a.name.replace(/[^A-Za-z ]/g,"").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
  a.top.forEach(t=>t.a=a.id);});

/* every release across the catalog, de-duplicated (collabs appear under several artists) */
const RELEASES=[];const relById={};
ARTISTS.forEach(a=>[...a.albums,...a.singles].forEach(r=>{if(relById[r.id])return;const x={...r,a:a.id};relById[r.id]=x;RELEASES.push(x);}));
RELEASES.sort((x,y)=>y.d.localeCompare(x.d));
const releasesOf=id=>{const a=byId[id];return [...a.albums,...a.singles].map(r=>relById[r.id]||{...r,a:id}).sort((x,y)=>y.d.localeCompare(x.d));};

/* find which Kafla artist a credit string belongs to */
const NAME_RX=ARTISTS.map(a=>[a.id,new RegExp("(^|[^a-z])"+a.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([^a-z]|$)")]);
function artistFor(credit,fallback){const c=String(credit||"").toLowerCase();if(fallback&&NAME_RX.find(x=>x[0]===fallback)[1].test(c))return fallback;const m=NAME_RX.find(([,rx])=>rx.test(c));return m?m[0]:fallback||null;}

/* ============ HELPERS ============ */
const $=s=>document.querySelector(s);
const app=$("#app"), mainEl=$("#main");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const enc=encodeURIComponent;
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmtDate=d=>{const p=(d||"").split("-");return p.length===3?`${+p[2]} ${MON[+p[1]-1]} ${p[0]}`:(p[0]||"");};
const fmtDur=ms=>{const s=Math.round((ms||0)/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;};
const fmtLong=ms=>{const m=Math.round(ms/60000);return m>=60?`${Math.floor(m/60)} hr ${m%60} min`:`${m} min`;};
const big=(u,n=1000)=>String(u||"").replace(/\/\d+x\d+bb\.jpg$/,`/${n}x${n}bb.jpg`);
const ytm=t=>`https://music.youtube.com/search?q=${enc(t)}`;
const spot=t=>`https://open.spotify.com/search/${enc(t)}`;
const amSearch=t=>`https://music.apple.com/${COUNTRY}/search?term=${enc(t)}`;
const ls={get(k,d){try{const v=localStorage.getItem("kafla-"+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem("kafla-"+k,JSON.stringify(v));}catch(e){}}};
let toastT;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),2200);}

const I={
 home:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
 new:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r=".6" fill="currentColor"/></svg>',
 search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 artists:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
 lists:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h12M4 12h12M4 18h8"/><circle cx="18" cy="17" r="2.5"/><path d="M20.5 17V8l-2.5.6"/></svg>',
 quiz:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
 crew:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 play:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.6-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
 pause:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4.2" height="16" rx="1.2"/><rect x="13.8" y="4" width="4.2" height="16" rx="1.2"/></svg>',
 next:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5.5v13a1 1 0 0 0 1.5.86L16 13.7V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.3L6.5 4.64A1 1 0 0 0 5 5.5z"/></svg>',
 prev:'<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5.5v13a1 1 0 0 1-1.5.86L8 13.7V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4.3l9.5-5.66A1 1 0 0 1 19 5.5z"/></svg>',
 shuffle:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
 repeat:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
 queue:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 6h13M3 12h13M3 18h8"/><path d="M17 15v6l4-3z" fill="currentColor"/></svg>',
 vol:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
 mute:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor"/><path d="m22 9-6 6M16 9l6 6"/></svg>',
 dots:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
 ext:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
 check:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="m5 12 5 5 9-10"/></svg>',
 left:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
 right:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
 down:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
 plus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 heart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 4 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4 20 4 22.4 7.3 21.2 10.7 19.5 15.4 12 20 12 20z"/></svg>',
 heartF:'<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 4 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4 20 4 22.4 7.3 21.2 10.7 19.5 15.4 12 20 12 20z"/></svg>',
 chart:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg>',
 lib:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v16M10 4v16"/><path d="m15 4.5 4.5 15"/></svg>',
 keys:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8"/></svg>',
 moon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>'
};
const EX='<span class="ex" title="Explicit" aria-label="Explicit">E</span>';

/* ============ PROFILE ============ */
function fmtDay(d){if(!d)return "";const p=d.split("-");return p.length===3?`${+p[2]} ${MONTHS[+p[1]-1]} ${p[0]}`:p.length===2?`${MONTHS[+p[1]-1]} ${p[0]}`:p[0];}
function ageAt(b,end){if(!b||b.length<10)return null;const B=new Date(b),E=end&&end.length>=10?new Date(end):new Date();let y=E.getFullYear()-B.getFullYear();if(E.getMonth()<B.getMonth()||(E.getMonth()===B.getMonth()&&E.getDate()<B.getDate()))y--;return y>0&&y<120?y:null;}
function signature(a){
  const pr=a.profile||{};
  for(const n of pr.notable||[]){const t=findTop(a.id,n);if(t)return {t,why:"Best known for (Wikidata)"};}
  if(a.sig){const t=findTop(a.id,a.sig);if(t)return {t,why:"Signature song"};}
  return a.top[0]?{t:a.top[0],why:"Their most played song on Apple Music"}:null;
}
function profileRows(a){
  const pr=a.profile||{},rows=[];
  if(pr.birthname&&norm(pr.birthname)!==norm(a.name))rows.push(["Birth name",pr.birthname]);
  if(pr.born){const age=ageAt(pr.born,pr.died);rows.push(["Born",fmtDay(pr.born)+(age&&!pr.died?` (age ${age})`:"")]);}
  if(pr.birthplace)rows.push(["Birthplace",pr.birthplace]);
  if(pr.died){const age=ageAt(pr.born,pr.died);rows.push(["Died",fmtDay(pr.died)+(age?` (aged ${age})`:"")]);}
  const act=pr.active?pr.active.slice(0,4):a.since;if(act)rows.push(["Active since",String(act)]);
  if(pr.labels&&pr.labels.length)rows.push(["Record labels",pr.labels.join(", ")]);
  if(pr.genres&&pr.genres.length)rows.push(["Genres",pr.genres.join(", ")]);
  return rows;
}

/* ============ ART ============ */
function genBg(a){return `radial-gradient(circle at 30% 25%,hsl(${(a.hue+25)%360} 85% 62%),hsl(${a.hue} 70% 40%) 45%,hsl(${a.hue2} 65% 16%))`;}
function imgTag(src,alt=""){return src?`<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.remove()">`:"";}
function artistArt(a,fs=40){return `<div class="gen" style="background:${genBg(a)};font-size:${fs}px">${esc(a.short)}</div>${imgTag(a.photo,a.name)}`;}
function relArt(r){const a=byId[r.a]||ARTISTS[0];return `<div class="gen" style="background:${genBg(a)};font-size:22px">${esc((r.t||"")[0]||"")}</div>${imgTag(r.art,r.t)}`;}

/* dominant colour of a cover or photo (cover art is served with CORS, artist photos are local) */
const colCache={};
function artColor(url){
  if(!url)return Promise.resolve(null);
  const u=/mzstatic/.test(url)?String(url).replace(/\/\d+x\d+(bb|cc)\.(jpg|png)$/,"/40x40bb.jpg"):url;
  return colCache[u]||(colCache[u]=new Promise(res=>{const im=new Image();im.crossOrigin="anonymous";im.decoding="async";
    im.onload=()=>{try{const c=document.createElement("canvas");c.width=c.height=24;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0,24,24);
      const d=x.getImageData(0,0,24,24).data;let cx=0,cy=0,W=0,L=0,S=0;
      for(let k=0;k<d.length;k+=4){const r=d[k]/255,g=d[k+1]/255,b=d[k+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,ch=mx-mn;
        if(ch<.04)continue;const s=ch/(1-Math.abs(2*l-1)||1);let h=mx===r?((g-b)/ch)%6:mx===g?(b-r)/ch+2:(r-g)/ch+4;h*=60;
        const w=ch*ch*(1-Math.abs(l-.5));cx+=Math.cos(h*Math.PI/180)*w;cy+=Math.sin(h*Math.PI/180)*w;W+=w;L+=l*w;S+=s*w;}
      if(!W)return res(null);res({h:Math.round((Math.atan2(cy,cx)*180/Math.PI+360)%360),s:Math.round(Math.min(90,Math.max(35,S/W*100))),l:Math.round(L/W*100)});}catch(e){res(null);}};
    im.onerror=()=>res(null);im.src=u;}));
}
const hsl=(c,l,a=1)=>`hsl(${c.h} ${c.s}% ${l??Math.min(60,Math.max(40,c.l))}% / ${a})`;
function tintFrom(el,url,fn){artColor(url).then(c=>{if(c&&el&&el.isConnected)fn(el,c);});}

/* ============ PLAYLISTS ============ */
function findTop(aid,title){const a=byId[aid];if(!a)return null;const n=norm(title);return a.top.find(t=>norm(t.t)===n)||a.top.find(t=>norm(t.t).startsWith(n)&&n.length>3)||null;}
const resolved=ls.get("resolved2",{});
function trackFor(aid,title){return findTop(aid,title)||resolved[aid+"|"+norm(title)]||{t:title,a:aid,by:byId[aid]?byId[aid].name:"",pending:true};}
async function resolveTrack(tr){
  if(!tr.pending)return tr;
  const key=tr.a+"|"+norm(tr.t);if(resolved[key])return Object.assign(tr,resolved[key],{pending:false});
  try{const r=await fetch(`https://itunes.apple.com/search?term=${enc(tr.t+" "+tr.by)}&entity=song&country=${COUNTRY}&limit=15`).then(r=>r.json());
    const n=norm(tr.t),who=norm(tr.by);
    const hit=r.results.find(s=>s.previewUrl&&norm(s.trackName).startsWith(n)&&norm(s.artistName).includes(who)&&!/remix|slowed|reverb|echo|lofi|sped/i.test(s.trackName));
    if(hit){const v=fromItunes(hit,tr.a);delete v.pending;resolved[key]=v;ls.set("resolved2",resolved);return Object.assign(tr,v,{pending:false});}
  }catch(e){}
  tr.missing=true;return tr;
}
function fromItunes(s,fallbackA){return {t:s.trackName.replace(/\s*\((feat\.?|ft\.?|with|From)\b[^)]*\)/ig,"").trim(),full:s.trackName,by:s.artistName,alb:(s.collectionName||"").replace(/\s*-\s*(Single|EP)$/,""),c:s.collectionId,id:s.trackId,art:big(s.artworkUrl100,300).replace("300x300bb.jpg","300x300bb.jpg"),p:s.previewUrl,ms:s.trackTimeMillis||0,d:(s.releaseDate||"").slice(0,10),x:s.trackExplicitness==="explicit",a:artistFor(s.artistName,fallbackA),n:s.trackNumber};}

const MIXES=[
 {id:"mix-hiphop",t:"Hip-hop Heat",d:"The hardest-hitting Punjabi rap and hip-hop right now.",h:[8,330],from:a=>a.group==="hiphop",per:2},
 {id:"mix-rnb",t:"R&B Nights",d:"Slow, smooth and moody. Punjabi R&B for late hours.",h:[260,300],from:a=>a.group==="rnb",per:3},
 {id:"mix-pop",t:"Punjabi Pop Hits",d:"The big hooks everyone knows the words to.",h:[330,25],from:a=>a.group==="pop",per:1},
 {id:"mix-folk",t:"Folk Roots",d:"Tumbi, dhol and voices rooted in Punjab's folk tradition.",h:[35,80],from:a=>a.group==="folk",per:3},
 {id:"mix-women",t:"Queens of Punjab",d:"Hits from the women leading Punjabi music.",h:[300,345],from:a=>WOMEN.includes(a.id),per:2},
 {id:"mix-legends",t:"Legends Only",d:"The icons who built Punjabi music, from Chamkila to Babbu Maan.",h:[42,20],from:a=>a.group==="legend",per:2}
];
function getPlaylist(id){
  if(id.startsWith("this-")){const a=byId[id.slice(5)];if(!a)return null;
    return {id,kind:"this",a:a.id,t:`This Is ${a.name}`,d:`The essential ${a.name} songs, all in one place.`,tracks:a.top.slice(0,15)};}
  const m=MIXES.find(x=>x.id===id);
  if(m){const tr=[];ARTISTS.filter(m.from).forEach(a=>tr.push(...a.top.slice(0,m.per)));
    const seen=new Set();return {...m,kind:"mix",tracks:tr.filter(t=>!seen.has(t.id)&&seen.add(t.id)).slice(0,60)};}
  const p=K.playlists.find(x=>x.id===id);if(!p)return null;
  return {...p,kind:"curated",tracks:p.songs.map(([aid,t])=>trackFor(aid,t))};
}
const ALL_PL=()=>[...K.playlists.map(p=>getPlaylist(p.id)),...MIXES.map(m=>getPlaylist(m.id))];
function plArtists(pl){return [...new Set(pl.tracks.map(t=>t.a).filter(Boolean))].map(id=>byId[id]).filter(Boolean);}
function plCover(pl){
  if(pl.kind==="this"){const a=byId[pl.a];
    return `<div class="this-is" style="background:${genBg(a)}"><div class="bgp" style="${a.photo?`background-image:url('${esc(a.photo)}')`:""}"></div><span class="stripe" style="background:hsl(${a.hue} 85% 55%)"></span><div class="band"><small>This is</small><b>${esc(a.name)}</b></div></div>`;}
  const ph=plArtists(pl).filter(a=>a.photo).slice(0,4);
  return `<div class="pl-cover" style="background:linear-gradient(160deg,hsl(${pl.h[0]} 80% 48%),hsl(${pl.h[1]} 70% 18%))">
    ${ph.length>=4?`<div class="mosaic">${ph.map(a=>`<i style="background-image:url('${esc(a.photo)}')"></i>`).join("")}</div>`:ph[0]?`<span class="ph" style="background-image:url('${esc(ph[0].photo)}')"></span>`:""}
    <span class="veil" style="background:linear-gradient(180deg,hsl(${pl.h[0]} 80% 40% / ${ph.length>=4?.55:.1}),hsl(${pl.h[1]} 70% 14% / .92))"></span>
    <small>Ved's Music</small><b>${esc(pl.t)}</b></div>`;
}

/* ============ TILES & ROWS ============ */
const LISTS={};let listSeq=0;
function regList(tracks){const k="l"+(++listSeq);LISTS[k]=tracks;return k;}
function shelf(items,cls=""){return `<div class="shelf"><button class="arr l" aria-label="Scroll left">${I.left}</button><div class="rowscroll ${cls}">${items.join("")}</div><button class="arr r" aria-label="Scroll right">${I.right}</button></div>`;}
function section(title,body,{more,sub,href}={}){return `<section class="sec"><div class="sec-head"><div><h2>${href?`<a href="${href}">${esc(title)}</a>`:esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:""}</div>${more?`<a class="more" href="${more}">See all</a>`:""}</div>${body}</section>`;}
function relTile(r,sub){const a=byId[r.a];const soon=r.d>TODAY;
  return `<div class="tile"><a href="#/album/${r.id}" aria-label="${esc(r.t)}"><div class="art">${relArt(r)}${soon?`<span class="soon">Coming ${esc(fmtDate(r.d))}</span>`:""}</div></a>
    ${soon?"":`<button class="pov" data-play="album:${r.id}" aria-label="Play ${esc(r.t)}">${I.play}</button>`}
    <a href="#/album/${r.id}" class="cap"><span>${esc(r.t)}</span>${r.x?EX:""}</a>
    <div class="capsub">${sub!=null?esc(sub):`<a href="#/artist/${r.a}">${esc(a?a.name:r.by)}</a>`}</div></div>`;}
function artistTile(a,sub="Artist"){return `<div class="tile round"><a href="#/artist/${a.id}" aria-label="${esc(a.name)}"><div class="art">${artistArt(a,44)}</div></a>
  <button class="pov" data-play="artist:${a.id}" aria-label="Play ${esc(a.name)}">${I.play}</button>
  <a href="#/artist/${a.id}" class="cap"><span>${esc(a.name)}</span></a><div class="capsub">${esc(sub)}</div></div>`;}
function plTile(pl){const who=plArtists(pl).slice(0,3).map(a=>a.name);
  return `<div class="tile"><a href="#/playlist/${pl.id}" aria-label="${esc(pl.t)}"><div class="art" style="font-size:14px">${plCover(pl)}</div></a>
  <button class="pov" data-play="pl:${pl.id}" aria-label="Play ${esc(pl.t)}">${I.play}</button>
  <a href="#/playlist/${pl.id}" class="cap"><span>${esc(pl.t)}</span></a><div class="capsub">${esc(pl.kind==="this"?"Ved's Music playlist":who.join(", "))}</div></div>`;}
function songRows(tracks,{numbered=true,album=true,art=true,artist=true,limit,key,from=0}={}){
  key=key||regList(tracks);
  const rows=tracks.slice(from,limit||tracks.length).map((t,j)=>{const i=j+from,a=byId[t.a];
    const who=artist?(a&&norm(t.by||a.name)===norm(a.name)?`<a href="#/artist/${a.id}">${esc(a.name)}</a>`:a?`${esc(t.by||"")}`:esc(t.by||"")):(t.by&&a&&norm(t.by)!==norm(a.name)?esc(t.by):"");
    return `<div class="song${album?"":" noalb"}${art?"":" noart"}" data-list="${key}" data-i="${i}" data-tid="${t.id||""}" role="button" tabindex="0" aria-label="Play ${esc(t.t)}">
      <span class="no"><span class="n">${numbered?(t.n||i+1):""}</span><span class="pi">${I.play}</span><span class="eq"><i></i><i></i><i></i></span></span>
      ${art?`<div class="th">${t.art?imgTag(t.art,""):`<div class="skel" style="position:absolute;inset:0"></div>`}</div>`:""}
      <span style="min-width:0"><div class="t"><span>${esc(t.t)}</span>${t.x?EX:""}</div>${who?`<div class="s">${who}</div>`:""}</span>
      ${album?`<span class="s alb">${t.c?`<a href="#/album/${t.c}">${esc(t.alb||"")}</a>`:esc(t.alb||"")}</span>`:""}
      ${likeBtn(t)}<span class="dur">${t.ms?fmtDur(t.ms):t.missing?`<a href="${ytm(t.t+" "+(t.by||""))}" target="_blank" rel="noopener" title="Not on Apple Music. Open on YouTube Music">YouTube ${I.ext}</a>`:""}</span>
      <button class="more" data-menu="${key}:${i}" aria-label="More options for ${esc(t.t)}">${I.dots}</button></div>`;}).join("");
  return `<div class="songs" data-key="${key}">${rows}</div>`;
}

/* ============ SIDEBAR / NAV ============ */
const NAV=[["home","Home","#/",I.home],["new","New","#/new",I.new],["charts","Charts","#/charts",I.chart],["search","Search","#/search",I.search],["artists","Artists","#/artists",I.artists],["playlists","Playlists","#/playlists",I.lists],["library","Library","#/library",I.lib],["quiz","Quiz","#/quiz",I.quiz],["crew","Crew stats","#/crew",I.crew]];
$("#sideNav").innerHTML=NAV.filter(n=>n[0]!=="search").map(([k,l,h,i])=>`<a href="${h}" data-nav="${k}">${i}${l}</a>`).join("");
$("#tabbar").innerHTML=NAV.filter(n=>["home","new","search","charts","library"].includes(n[0])).map(([k,l,h,i])=>`<a href="${h}" data-nav="${k}">${i}${l}</a>`).join("");
let follows=ls.get("follows",[]).filter(id=>byId[id]);
function renderSide(){
  $("#libPl").innerHTML=`<a href="#/library/liked" data-side="library/liked"><div class="mini art likedcv">${I.heartF}</div><span>Liked songs<small>${liked.length} ${liked.length===1?"song":"songs"}</small></span></a>`+K.playlists.map(p=>getPlaylist(p.id)).map(pl=>`<a href="#/playlist/${pl.id}" data-side="playlist/${pl.id}"><div class="mini art" style="font-size:5px">${plCover(pl)}</div><span>${esc(pl.t)}<small>Playlist</small></span></a>`).join("");
  $("#libFollow").innerHTML=follows.length?follows.map(id=>byId[id]).map(a=>`<a href="#/artist/${a.id}" data-side="artist/${a.id}"><div class="mini art" style="border-radius:50%">${artistArt(a,13)}</div><span>${esc(a.name)}<small>Artist</small></span></a>`).join(""):`<p class="note" style="padding:0 12px;margin:0">Tap the heart on an artist's page to follow them.</p>`;
}
/* ============ LIBRARY: liked songs, recently played, jump back in ============ */
const slim=t=>({id:t.id,t:t.t,by:t.by,a:t.a,alb:t.alb,c:t.c,art:t.art,p:t.p,ms:t.ms,x:t.x,d:t.d});
let liked=ls.get("liked",[]),recent=ls.get("recent",[]),ctxs=ls.get("ctx",[]);
const likedIds=new Set(liked.map(t=>t.id));
const isLiked=t=>!!(t&&t.id&&likedIds.has(t.id));
function likeBtn(t,cls="like"){if(!t||!t.id)return `<span class="${cls} ph"></span>`;const on=isLiked(t);
  return `<button class="${cls}${on?" on":""}" data-like="${t.id}" aria-pressed="${on}" aria-label="${on?"Remove from":"Add to"} Liked songs" title="${on?"Remove from":"Add to"} Liked songs">${on?I.heartF:I.heart}</button>`;}
function toggleLike(t){if(!t||!t.id)return;
  const on=!likedIds.has(t.id);
  if(on){likedIds.add(t.id);liked=[slim(t),...liked];}else{likedIds.delete(t.id);liked=liked.filter(x=>x.id!==t.id);}
  ls.set("liked",liked);toast(on?"Added to Liked songs":"Removed from Liked songs");
  document.querySelectorAll(`[data-like="${t.id}"]`).forEach(b=>{b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.innerHTML=on?I.heartF:I.heart;
    const l=`${on?"Remove from":"Add to"} Liked songs`;b.setAttribute("aria-label",l);b.title=l;});
  renderSide();
  if(location.hash.startsWith("#/library")&&(location.hash.split("/")[2]||"liked")==="liked")viewLibrary("liked");
}
function addRecent(t){if(!t||!t.id||t.pending)return;recent=[slim(t),...recent.filter(x=>x.id!==t.id)].slice(0,60);ls.set("recent",recent);}
/* contexts (albums, artists, playlists) you played, for "Jump back in" */
function addCtx(spec,info){ctxs=[{s:spec,...info},...ctxs.filter(x=>x.s!==spec)].slice(0,12);ls.set("ctx",ctxs);}
function ctxFromRoute(){const [r,id]=location.hash.replace(/^#\/?/,"").split("/");
  if(r==="album"&&albumCache[id]){const al=albumCache[id];addCtx("album:"+id,{t:al.t,art:al.art,sub:`${al.k} · ${al.by}`});}
  else if(r==="artist"&&byId[id])addCtx("artist:"+id,{});
  else if(r==="playlist"&&getPlaylist(id))addCtx("pl:"+id,{});}
function ctxTile(c){const [k,id]=c.s.split(":");
  if(k==="artist")return byId[id]?artistTile(byId[id]):"";
  if(k==="pl"){const pl=getPlaylist(id);return pl?plTile(pl):"";}
  if(k==="album")return `<div class="tile"><a href="#/album/${id}" aria-label="${esc(c.t)}"><div class="art">${imgTag(big(c.art,400),c.t)}</div></a>
    <button class="pov" data-play="album:${id}" aria-label="Play ${esc(c.t)}">${I.play}</button>
    <a href="#/album/${id}" class="cap"><span>${esc(c.t)}</span></a><div class="capsub">${esc(c.sub||"")}</div></div>`;
  return "";}

function toggleFollow(id){follows=follows.includes(id)?follows.filter(x=>x!==id):[id,...follows];ls.set("follows",follows);renderSide();toast(follows.includes(id)?`Following ${byId[id].name}`:`Unfollowed ${byId[id].name}`);return follows.includes(id);}

/* ============ VIEWS ============ */
function greeting(){const h=new Date().getHours();return h<5?"Late night vibes":h<12?"Good morning":h<17?"Good afternoon":"Good evening";}
const NEWSCHOOL=ARTISTS.filter(a=>a.group!=="legend");
function viewHome(){
  const pastRel=RELEASES.filter(r=>r.d<=TODAY);
  const used=new Set(),hero=[];
  for(const r of pastRel){if(r.k==="Single"||used.has(r.a)||byId[r.a].group==="legend")continue;used.add(r.a);hero.push(r);if(hero.length===3)break;}
  const quick=NEWSCHOOL.slice(0,24).map(a=>a.top[0]).filter(Boolean).slice(0,12);
  const newRel=pastRel.filter(r=>byId[r.a].group!=="legend"&&!hero.includes(r)).slice(0,20);
  const soon=RELEASES.filter(r=>r.d>TODAY).reverse();
  const now=new Date(),today=`${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const jump=ctxs.map(ctxTile).filter(Boolean);
  const [h0,...hs]=hero;const a0=h0&&byId[h0.a];
  app.innerHTML=`
  <div class="greet"><h1 class="ptitle">${greeting()}</h1><span class="today">${today}</span></div>
  ${h0?`<section class="spot" aria-label="Spotlight">
    <div class="sp big" data-art="${esc(h0.art)}"><div class="blur" style="background-image:url('${esc(big(h0.art,300))}')"></div>
      <div class="txt"><div class="kick"><span class="dot"></span>New ${h0.k==="Album"?"album":h0.k} · ${esc(fmtDate(h0.d))}</div><h2>${esc(h0.t)}</h2><p class="by"><a href="#/artist/${a0.id}">${esc(a0.name)}</a></p><p class="meta">${h0.n} ${h0.n===1?"song":"songs"}</p>
      <div class="btns"><button class="btn light" data-play="album:${h0.id}">${I.play}Play</button><a class="btn glass" href="#/album/${h0.id}">Open</a></div></div>
      <a class="cv" href="#/album/${h0.id}" aria-label="${esc(h0.t)}">${imgTag(big(h0.art,600),h0.t)}</a></div>
    ${hs.map(r=>{const a=byId[r.a];return `<div class="sp sm" data-art="${esc(r.art)}"><a class="cv" href="#/album/${r.id}" tabindex="-1" aria-hidden="true">${imgTag(big(r.art,400),"")}</a>
      <div class="txt"><div class="kick">New ${r.k==="Album"?"album":r.k}</div><a class="stretch" href="#/album/${r.id}">${esc(r.t)}</a><span class="by">${esc(a.name)} · ${esc(fmtDate(r.d))}</span></div>
      <button class="pov on" data-play="album:${r.id}" aria-label="Play ${esc(r.t)}">${I.play}</button></div>`;}).join("")}
  </section>`:""}
  ${jump.length?section("Jump back in",shelf(jump),{sub:"Pick up where you left off"}):""}
  ${section("Quick picks",songRows(quick,{numbered:false,album:false}).replace('class="songs"','class="songs compact rowscroll songs3"'),{sub:"Start with the biggest songs on Ved's Music"})}
  ${section("On the chart today",`<div id="homeChart" class="chartgrid">${[...Array(10)].map(()=>`<div class="skel" style="height:58px"></div>`).join("")}</div>`,{sub:"Top 10 Punjabi songs on the iTunes Store in India",more:"#/charts"})}
  ${section("New releases",shelf(newRel.map(r=>relTile(r))),{more:"#/new"})}
  ${liked.length?section("Your liked songs",songRows(liked.slice(0,12),{numbered:false,album:false}).replace('class="songs"','class="songs compact rowscroll songs3"'),{more:"#/library/liked"}):""}
  ${section("Popular artists",shelf(NEWSCHOOL.slice(0,20).map(a=>artistTile(a))),{more:"#/artists"})}
  ${section("This Is",shelf(NEWSCHOOL.slice(0,14).map(a=>plTile(getPlaylist("this-"+a.id)))),{sub:"Every artist's essential songs",more:"#/playlists"})}
  ${section("Moods and mixes",shelf(ALL_PL().map(plTile)),{more:"#/playlists"})}
  ${soon.length?section("Coming soon",shelf(soon.slice(0,12).map(r=>relTile(r)))):""}
  ${section("Hip-hop and rap",shelf(ARTISTS.filter(a=>a.group==="hiphop").map(a=>artistTile(a))),{more:"#/artists/hiphop"})}
  ${section("Queens of Punjab",shelf(WOMEN.map(id=>byId[id]).filter(a=>a&&a.group!=="legend").map(a=>artistTile(a))),{sub:"The women leading Punjabi music",more:"#/artists/women"})}
  ${section("Legends",shelf(ARTISTS.filter(a=>a.group==="legend").map(a=>artistTile(a,"Legend"))),{sub:"The voices who built Punjabi music",more:"#/artists/legend"})}
  ${section("For you and your crew",`<div class="feature-cards">
      <a class="fcard" href="#/charts" style="background:linear-gradient(135deg,#E8590C,#C21E56)"><h3>Punjabi Top Songs</h3><p>Today's live chart from the iTunes Store in India. Play it in one tap.</p></a>
      <a class="fcard" href="#/quiz" style="background:linear-gradient(135deg,#7B2FF7,#F107A3)"><h3>Which artist are you?</h3><p>Six quick questions. Send the result to the group chat.</p></a>
      <a class="fcard" href="#/crew" style="background:linear-gradient(135deg,#F2620F,#FFB224)"><h3>Crew stats</h3><p>Upload your listening history and see who you play the most.</p></a></div>`)}`;
  app.querySelectorAll(".sp[data-art]").forEach(el=>tintFrom(el,el.dataset.art,(el,c)=>{el.style.setProperty("--sc",hsl(c));el.style.setProperty("--sc-d",hsl(c,22));}));
  getChart("songs").then(ch=>{const box=$("#homeChart");if(!box)return;const key=regList(ch.items);
    box.innerHTML=ch.items.slice(0,10).map((t,i)=>chartRow(t,i,key)).join("");markPlaying();})
    .catch(()=>{const box=$("#homeChart");if(box)box.outerHTML=`<p class="note">Couldn't load today's chart. Check your internet connection.</p>`;});
}
let carT;
function startCarousel(n){clearInterval(carT);if(n<2)return;let i=0;const go=j=>{i=(j+n)%n;app.querySelectorAll(".hero .slide").forEach((s,k)=>s.classList.toggle("on",k===i));app.querySelectorAll(".hero .dots button").forEach((s,k)=>s.classList.toggle("on",k===i));};
  app.querySelectorAll(".hero .dots button").forEach(b=>b.onclick=()=>{go(+b.dataset.slide);clearInterval(carT);});
  carT=setInterval(()=>{if(!document.hidden&&cur()==="home")go(i+1);},7000);}

function viewArtist(id){
  const a=byId[id];if(!a)return viewHome();
  const rel=releasesOf(id),past=rel.filter(r=>r.d<=TODAY),latest=past[0];
  const albums=rel.filter(r=>r.k!=="Single"&&r.d<=TODAY),singles=rel.filter(r=>r.k==="Single"&&r.d<=TODAY),soon=rel.filter(r=>r.d>TODAY);
  const fans=[...a.collabs.map(x=>byId[x]).filter(Boolean),...ARTISTS.filter(x=>x.group===a.group&&x.id!==id).sort((x,y)=>hash(x.id+id)-hash(y.id+id))].filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,12);
  const featured=K.playlists.filter(p=>p.songs.some(s=>s[0]===id)).map(p=>getPlaylist(p.id));
  const bio=a.bio||(a.wiki?[a.wiki.text]:[]);
  const topKey=regList(a.top);const fol=follows.includes(id);
  app.innerHTML=`<div class="pagewrap">
  <header class="ahead">${a.photo?`<div class="bgimg blurred" style="background-image:url('${esc(a.photo)}')"></div><div class="sharp" style="background-image:url('${esc(a.photo)}')"></div>`:`<div class="bgimg" style="background:${genBg(a)}"></div>`}<div class="shade"></div>
    <div class="kick"><span class="verified">${I.check}</span>${esc(GROUPS[a.group]||"Artist")}${a.group==="legend"?"":" artist"}</div>
    <h1>${esc(a.name)}</h1><p class="tline">${esc(a.line||[a.profile&&a.profile.birthplace?`From ${a.profile.birthplace.split(", ").slice(0,2).join(", ")}`:"",`${albums.length} albums and EPs`,`${singles.length}${singles.length>=30?"+":""} singles`].filter(Boolean).join(" · "))}</p>
    <div class="row"><button class="bigplay" data-play="artist:${id}" aria-label="Play ${esc(a.name)}">${I.play.replace('width="18" height="18"','width="24" height="24"')}</button>
      <button class="circ glass" data-shuffle="${topKey}" aria-label="Shuffle">${I.shuffle}</button>
      <button class="circ glass${fol?" on":""}" id="followBtn" aria-pressed="${fol}" aria-label="Follow">${fol?I.heartF:I.heart}</button></div>
  </header>
  <div class="cols2 sec">
    <section><div class="sec-head"><h2>Top songs</h2></div>${songRows(a.top,{key:topKey,limit:5})}
      ${a.top.length>5?`<button class="showmore" id="moreTop">Show more</button>`:""}</section>
    <section><div class="sec-head"><h2>${a.legacy?"Last album":"Latest release"}</h2></div>
      ${(()=>{const r=a.legacy?albums.find(x=>x.k==="Album")||latest:latest;return r?`<a class="feature" href="#/album/${r.id}"><div class="art">${relArt(r)}</div><div><small>${fmtDate(r.d)}</small><b>${esc(r.t)}</b><small>${r.k} · ${r.n} ${r.n===1?"song":"songs"}</small></div></a>`:"";})()}
      ${soon.length?`<div class="sec-head" style="margin-top:22px"><h2 style="font-size:18px">Coming soon</h2></div>${soon.map(r=>`<a class="feature" href="#/album/${r.id}" style="margin-bottom:10px"><div class="art">${relArt(r)}</div><div><small>${fmtDate(r.d)}</small><b>${esc(r.t)}</b><small>${r.k}</small></div></a>`).join("")}`:""}
      <div class="sec-head" style="margin-top:22px"><h2 style="font-size:18px">Listen on</h2></div>
      <div class="listen"><a class="btn sm" target="_blank" rel="noopener" href="https://music.apple.com/${COUNTRY}/artist/${a.am}">${I.ext}Apple Music</a><a class="btn sm" target="_blank" rel="noopener" href="${spot(a.name)}">${I.ext}Spotify</a><a class="btn sm" target="_blank" rel="noopener" href="${ytm(a.name)}">${I.ext}YouTube Music</a></div>
    </section>
  </div>
  ${a.legacy?`<section class="legacy"><div class="note" style="color:#E9C46A;font-weight:700">Forever 28</div><div class="big">${a.legacy.date}</div><p>${esc(a.legacy.text)}</p>
    <div class="sec-head" style="margin-top:22px"><h2 style="font-size:18px;color:#fff">Released after his passing</h2></div>
    ${songRows(a.legacy.after.map(t=>trackFor(id,t)),{album:false,artist:false})}</section>`:""}
  ${albums.length?section("Albums and EPs",shelf(albums.map(r=>relTile(r,`${r.d.slice(0,4)} · ${r.k}`)))):""}
  ${singles.length?section("Singles",shelf(singles.map(r=>relTile(r,r.d.slice(0,4))))):""}
  ${section("Playlists",shelf([plTile(getPlaylist("this-"+id)),...featured.map(plTile)]))}
  ${fans.length?section("Fans also like",shelf(fans.map(x=>artistTile(x)))):""}
  ${(()=>{const sg=signature(a),rows=profileRows(a);if(!sg&&!rows.length)return "";const sk=sg?regList([sg.t]):"";
    return section("Profile",`<div class="profile">${sg?`<div class="sig" data-list="${sk}" data-i="0" data-tid="${sg.t.id}" role="button" tabindex="0" aria-label="Play ${esc(sg.t.t)}"><div class="art">${imgTag(big(sg.t.art,600),sg.t.t)}</div><div class="sigtxt"><div class="eyebrow">Signature song</div><b>${esc(sg.t.t)}</b><span>${esc(sg.why)}</span></div><span class="pov on" aria-hidden="true">${I.play}</span></div>`:""}
      ${rows.length?`<dl class="facts2">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`:""}</div>
      ${a.profile&&a.profile.qid?`<p class="src" style="margin:10px 2px 0">Profile facts from <a href="https://www.wikidata.org/wiki/${a.profile.qid}" target="_blank" rel="noopener">Wikidata</a>. Songs from Apple Music.</p>`:""}`);})()}
  ${section("About",`<div class="about"><div>${a.real?`<p class="lead">${esc(a.real)}</p>`:""}${bio.map(p=>`<p>${esc(p)}</p>`).join("")||`<p>${esc(a.name)} is a Punjabi ${a.group==="legend"?"music legend":(GROUPS[a.group]||"").toLowerCase()+" artist"}${a.profile&&a.profile.desc?` (${esc(a.profile.desc)})`:""} with ${albums.length} albums and EPs and ${singles.length}${singles.length>=30?"+":""} singles on Apple Music.</p>`}
      ${!a.bio&&a.wiki?`<p class="src">From <a href="${esc(a.wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>, available under CC BY-SA 4.0.</p>`:""}
      <div class="chips" style="margin-top:14px">${(a.tags||[GROUPS[a.group]]).map(t=>`<span class="chip">${esc(t)}</span>`).join("")}</div></div>
      <div class="facts"><div><b>${a.top.length}</b><span>Top songs on Ved's Music</span></div><div><b>${albums.length}</b><span>Albums and EPs</span></div><div><b>${singles.length}${singles.length>=30?"+":""}</b><span>Singles</span></div></div></div>`)}
  </div>`;
  const mt=$("#moreTop");if(mt)mt.onclick=()=>{const box=app.querySelector(`.songs[data-key="${topKey}"]`);const open=mt.dataset.open!=="1";box.outerHTML=songRows(a.top,{key:topKey,limit:open?15:5});mt.dataset.open=open?"1":"0";mt.textContent=open?"Show less":"Show more";markPlaying();};
  $("#followBtn").onclick=e=>{const on=toggleFollow(id);const b=e.currentTarget;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);b.innerHTML=on?I.heartF:I.heart;};
  if(a.legacy)hydratePending(app);
}

const albumCache={};
async function loadAlbum(cid){
  if(albumCache[cid])return albumCache[cid];
  const r=await fetch(`https://itunes.apple.com/lookup?id=${cid}&entity=song&country=${COUNTRY}&limit=200`).then(r=>r.json());
  const col=r.results.find(x=>x.wrapperType==="collection");if(!col)throw new Error("not found");
  const known=relById[cid];const aid=known?known.a:artistFor(col.artistName);
  const tracks=r.results.filter(x=>x.wrapperType==="track"&&x.kind==="song").sort((x,y)=>(x.discNumber-y.discNumber)||(x.trackNumber-y.trackNumber)).map(s=>fromItunes(s,aid));
  const name=col.collectionName;
  return albumCache[cid]={id:cid,t:name.replace(/\s*-\s*(Single|EP)$/,""),k:/ - Single$/.test(name)||tracks.length<=2?"Single":/ - EP$/.test(name)||tracks.length<=6?"EP":"Album",by:col.artistName,a:aid,art:big(col.artworkUrl100,600),d:(col.releaseDate||"").slice(0,10),
    x:col.collectionExplicitness==="explicit",copy:col.copyright||"",genre:col.primaryGenreName||"",tracks,url:col.collectionViewUrl};
}
async function viewAlbum(cid){
  const k=relById[cid];
  const head=al=>{const a=byId[al.a];return `<div class="phead"><div class="cv">${a?`<div class="gen" style="background:${genBg(a)};font-size:60px">${esc((al.t||" ")[0])}</div>`:""}${imgTag(big(al.art,1000),al.t)}</div>
    <div style="min-width:0"><div class="eyebrow">${esc(al.k||"Album")}</div><h1>${esc(al.t)}</h1><p class="by">${a?`<a href="#/artist/${a.id}">${esc(al.by||a.name)}</a>`:esc(al.by||"")}</p>
    <p class="meta">${[al.genre,al.d&&al.d.slice(0,4),al.tracks?`${al.tracks.length} ${al.tracks.length===1?"song":"songs"}, ${fmtLong(al.tracks.reduce((s,t)=>s+t.ms,0))}`:""].filter(Boolean).map(esc).join(" · ")}${al.x?" · "+EX:""}</p>
    <div class="btns"><button class="bigplay" data-play="album:${cid}" aria-label="Play">${I.play.replace('width="18" height="18"','width="24" height="24"')}</button><button class="circ" data-play="album:${cid}" data-shuf="1" aria-label="Shuffle">${I.shuffle}</button>
      <a class="btn sm" target="_blank" rel="noopener" href="${esc(al.url||`https://music.apple.com/${COUNTRY}/album/${cid}`)}">${I.ext}Apple Music</a><a class="btn sm" target="_blank" rel="noopener" href="${spot(al.t+" "+(al.by||""))}">${I.ext}Spotify</a><a class="btn sm" target="_blank" rel="noopener" href="${ytm(al.t+" "+(al.by||""))}">${I.ext}YouTube Music</a></div></div></div>`;};
  const tint=al=>`<div class="tint" style="background:radial-gradient(80% 100% at 20% 0%,hsl(${byId[al.a]?byId[al.a].hue:0} 70% 55% / .45),transparent 70%)"></div>`;
  if(k)app.innerHTML=`<div class="pagewrap">${tint(k)}${head(k)}<div class="sec">${[...Array(Math.min(k.n||6,10))].map(()=>`<div class="skel" style="height:46px;margin:6px 0"></div>`).join("")}</div></div>`;
  else app.innerHTML=`<div class="sec">${[...Array(8)].map(()=>`<div class="skel" style="height:46px;margin:6px 0"></div>`).join("")}</div>`;
  let al;try{al=await loadAlbum(cid);}catch(e){if(cur()==="album")app.innerHTML+=`<p class="msg">Couldn't load the songs for this release. Check your internet connection and try again.</p>`;return;}
  if(location.hash!=="#/album/"+cid)return;
  const a=byId[al.a];const more=a?releasesOf(a.id).filter(r=>r.id!=cid&&r.d<=TODAY):[];
  const multi=al.tracks.some(t=>norm(t.by)!==norm(al.by));
  app.innerHTML=`<div class="pagewrap">${tint(al)}${head(al)}
    <section class="sec">${songRows(al.tracks,{album:false,art:false,artist:multi})}</section>
    <p class="note" style="margin:18px 12px 0">${esc(fmtDate(al.d))}<br>${esc(al.copy)}</p>
    ${more.length?section(`More by ${a.name}`,shelf(more.slice(0,20).map(r=>relTile(r,`${r.d.slice(0,4)} · ${r.k}`))),{href:`#/artist/${a.id}`}):""}</div>`;
  tintFrom(app.querySelector(".tint"),al.art,(el,c)=>el.style.background=`radial-gradient(80% 100% at 20% 0%,${hsl(c,55,.55)},transparent 70%)`);
  markPlaying();
}

function viewPlaylist(id){
  const pl=getPlaylist(id);if(!pl)return viewHome();
  const who=plArtists(pl).map(a=>a.name);const ms=pl.tracks.reduce((s,t)=>s+(t.ms||0),0);const key=regList(pl.tracks);
  const h=pl.kind==="this"?byId[pl.a].hue:pl.h[0];
  app.innerHTML=`<div class="pagewrap"><div class="tint" style="background:radial-gradient(80% 100% at 20% 0%,hsl(${h} 75% 55% / .5),transparent 70%)"></div>
    <div class="phead"><div class="cv" style="font-size:24px">${plCover(pl)}</div>
    <div style="min-width:0"><div class="eyebrow">Playlist</div><h1>${esc(pl.t)}</h1><p class="desc">${esc(pl.d)}</p>
      <p class="meta">${esc(who.slice(0,4).join(", "))}${who.length>4?` and ${who.length-4} more`:""} · ${pl.tracks.length} songs${ms?`, about ${fmtLong(ms)}`:""}</p>
      <div class="btns"><button class="bigplay" data-play="pl:${id}" aria-label="Play">${I.play.replace('width="18" height="18"','width="24" height="24"')}</button><button class="circ" data-shuffle="${key}" aria-label="Shuffle">${I.shuffle}</button></div></div></div>
    <section class="sec">${songRows(pl.tracks,{key})}</section>
    ${pl.kind==="this"?section("Go to artist",shelf([artistTile(byId[pl.a])])):""}
    ${section("More playlists",shelf(ALL_PL().filter(x=>x.id!==id).map(plTile)))}</div>`;
  hydratePending(app);
}
/* look up songs from hand-made playlists that aren't in the catalog's top songs */
async function hydratePending(root){
  const boxes=[...root.querySelectorAll(".songs[data-key]")];
  for(const box of boxes){const list=LISTS[box.dataset.key];if(!list||!list.some(t=>t.pending))continue;
    await Promise.all(list.filter(t=>t.pending).map(resolveTrack));
    if(!box.isConnected)return;
    const opts=box.closest(".legacy")?{album:false,artist:false}:{};
    box.outerHTML=songRows(list,{...opts,key:box.dataset.key});markPlaying();}
}

let relFilter="All";
function viewNew(){
  const pool=RELEASES.filter(r=>relFilter==="All"||r.k===relFilter.replace(/s$/,""));
  const cutoff=new Date(Date.now()-365*864e5).toISOString().slice(0,10);
  const soon=pool.filter(r=>r.d>TODAY).reverse(),recent=pool.filter(r=>r.d<=TODAY&&r.d>=cutoff);
  const months=[...new Set(recent.map(r=>r.d.slice(0,7)))];
  app.innerHTML=`<h1 class="ptitle">New releases</h1><p class="psub">Every album, EP and single from the ${ARTISTS.length} artists on Ved's Music over the last 12 months, straight from the Apple Music catalog.</p>
  <div class="toolbar"><div class="chips">${["All","Albums","EPs","Singles"].map(g=>`<button class="chip${g===relFilter?" on":""}" data-rf="${g}">${g}</button>`).join("")}</div><span class="count">${recent.length} releases</span></div>
  ${soon.length?`<div class="monthhead">Coming soon</div><div class="grid">${soon.map(r=>relTile(r)).join("")}</div>`:""}
  ${months.map(m=>{const [y,mm]=m.split("-");const list=recent.filter(r=>r.d.startsWith(m));return `<div class="monthhead">${MONTHS[+mm-1]} ${y}<span>${list.length} releases</span></div><div class="grid">${list.map(r=>relTile(r)).join("")}</div>`;}).join("")}
  ${section("The producers behind the sound",`<div class="feature-cards">${K.producers.map(([n,p,h])=>`<div class="credit"><div class="art" style="width:56px;border-radius:50%;flex:none"><div class="gen" style="font-size:18px;background:linear-gradient(135deg,hsl(${h} 70% 50%),hsl(${(h+60)%360} 70% 25%))">${n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div></div><div><strong>${esc(n)}</strong><p>${esc(p)}</p></div></div>`).join("")}</div>`)}`;
  app.querySelectorAll("[data-rf]").forEach(b=>b.onclick=()=>{relFilter=b.dataset.rf;viewNew();});
}

let azLetter="";
function viewArtists(group){
  group=GROUPS[group]||group==="women"?group:"all";
  const list=ARTISTS.filter(a=>(group==="all"||a.group===group||(group==="women"&&a.f))&&(!azLetter||a.name[0].toUpperCase()===azLetter)).sort((x,y)=>azLetter?x.name.localeCompare(y.name):0);
  const letters=[...new Set(ARTISTS.map(a=>a.name[0].toUpperCase()))].sort();
  app.innerHTML=`<h1 class="ptitle">Artists</h1><p class="psub">${ARTISTS.length} artists, from today's biggest names to the legends who started it all.</p>
  <div class="toolbar"><div class="chips">${[["all","All"],...Object.entries(GROUPS),["women","Women"]].map(([k,l])=>`<a class="chip${k===group?" on":""}" href="#/artists${k==="all"?"":"/"+k}">${l}</a>`).join("")}</div><span class="count">${list.length} artists</span></div>
  <div class="az" role="group" aria-label="Filter by first letter"><button class="${azLetter?"":"on"}" data-az="">All</button>${letters.map(l=>`<button class="${l===azLetter?"on":""}" data-az="${l}">${l}</button>`).join("")}</div>
  <div class="grid" style="margin-top:22px">${list.map(a=>artistTile(a,GROUPS[a.group])).join("")||`<p class="empty">No artists here yet.</p>`}</div>`;
  app.querySelectorAll("[data-az]").forEach(b=>b.onclick=()=>{azLetter=b.dataset.az;viewArtists(group);});
  app.querySelector(".az button").style.width="auto";app.querySelector(".az button").style.padding="0 10px";
}
function viewPlaylists(){
  app.innerHTML=`<h1 class="ptitle">Playlists</h1><p class="psub">Hand-picked moods, genre mixes, and a This Is playlist for every artist.</p>
  ${section("Ved's Music picks",`<div class="grid">${K.playlists.map(p=>plTile(getPlaylist(p.id))).join("")}</div>`)}
  ${section("Genre mixes",`<div class="grid">${MIXES.map(m=>plTile(getPlaylist(m.id))).join("")}</div>`)}
  ${section("This Is",`<div class="grid">${ARTISTS.filter(a=>a.top.length).map(a=>plTile(getPlaylist("this-"+a.id))).join("")}</div>`)}`;
}

/* ---------- search ---------- */
let liveT,liveSeq=0;
function viewSearch(term){
  term=(term||"").trim();
  if(!term){
    const tiles=[...Object.entries(GROUPS).map(([k,l])=>({href:`#/artists/${k}`,t:l,s:`${ARTISTS.filter(a=>a.group===k).length} artists`,a:ARTISTS.find(a=>a.group===k&&a.photo)})),
      {href:"#/charts",t:"Charts",s:"Today's Punjabi chart",a:byId.smw},{href:"#/library",t:"Library",s:"Liked and recent",a:byId.diljit},{href:"#/new",t:"New releases",s:"Last 12 months",a:byId.aujla},{href:"#/playlists",t:"Playlists",s:"Moods and mixes",a:byId.diljit},{href:"#/quiz",t:"Quiz",s:"Which artist are you?",a:byId.smw},{href:"#/crew",t:"Crew stats",s:"Your listening history",a:byId.ap}];
    app.innerHTML=`<h1 class="ptitle">Browse</h1><p class="psub">Search for any artist, song or album, or start here.</p>
    <div class="gtiles" style="margin-top:20px">${tiles.map((x,i)=>`<a class="gtile" href="${x.href}" style="background:linear-gradient(135deg,hsl(${(i*47+340)%360} 75% 48%),hsl(${(i*47+20)%360} 70% 30%))">${x.t}<small>${esc(x.s)}</small>${x.a&&x.a.photo?`<span class="ph" style="background-image:url('${esc(x.a.photo)}')"></span>`:""}</a>`).join("")}</div>`;
    return;
  }
  const t=norm(term);
  const score=s=>{const n=norm(s);return n===t?3:n.startsWith(t)?2:n.includes(t)?1:0;};
  const ar=ARTISTS.map(a=>[a,score(a.name)]).filter(x=>x[1]).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);
  const so=[];ARTISTS.forEach(a=>a.top.forEach(s=>{const sc=score(s.t);if(sc)so.push([s,sc]);}));so.sort((x,y)=>y[1]-x[1]);
  const al=RELEASES.filter(r=>score(r.t)).sort((x,y)=>score(y.t)-score(x.t));
  const pls=[...ALL_PL(),...ARTISTS.map(a=>getPlaylist("this-"+a.id))].filter(p=>score(p.t));
  const topA=ar[0]&&score(ar[0].name)>=2?ar[0]:null;
  const songs=so.map(x=>x[0]).slice(0,8);
  app.innerHTML=`
  <div class="cols2 sec" style="margin-top:20px">
   <section><div class="sec-head"><h2>Top result</h2></div>${topA?`<a class="topresult" href="#/artist/${topA.id}"><div class="art" style="border-radius:50%">${artistArt(topA,40)}</div><h3>${esc(topA.name)}</h3><span><span class="pill">Artist</span></span><button class="pov" data-play="artist:${topA.id}" aria-label="Play ${esc(topA.name)}">${I.play}</button></a>`
     :so[0]&&(!al[0]||so[0][1]>=score(al[0].t))?`<div class="topresult" data-list="${regList([so[0][0]])}" data-i="0" role="button" tabindex="0"><div class="art">${imgTag(so[0][0].art,so[0][0].t)}</div><h3>${esc(so[0][0].t)}</h3><span><span class="pill">Song</span> <span class="note">${esc(so[0][0].by)}</span></span><span class="pov" aria-hidden="true">${I.play}</span></div>`
     :al[0]?`<a class="topresult" href="#/album/${al[0].id}"><div class="art">${relArt(al[0])}</div><h3>${esc(al[0].t)}</h3><span><span class="pill">${al[0].k}</span> <span class="note">${esc(byId[al[0].a].name)}</span></span></a>`
     :`<div class="topresult" style="cursor:default"><h3>Searching Apple Music for “${esc(term)}”…</h3><p class="note">Songs from the full catalog appear below.</p></div>`}</section>
   <section><div class="sec-head"><h2>Songs</h2></div><div id="songRes">${songs.length?songRows(songs,{album:false,numbered:false}):`<div class="skel" style="height:220px"></div>`}</div></section>
  </div>
  ${ar.length?section("Artists",shelf(ar.slice(0,20).map(a=>artistTile(a,GROUPS[a.group])))):""}
  ${al.length?section("Albums and singles",shelf(al.slice(0,24).map(r=>relTile(r,`${r.d.slice(0,4)} · ${byId[r.a].name}`)))):""}
  ${pls.length?section("Playlists",shelf(pls.slice(0,12).map(plTile))):""}
  <div id="liveRes"></div>`;
  /* live search across the whole Apple Music catalog */
  clearTimeout(liveT);const seq=++liveSeq;
  liveT=setTimeout(async()=>{try{
    const r=await fetch(`https://itunes.apple.com/search?term=${enc(term)}&entity=song&country=${COUNTRY}&limit=30`).then(r=>r.json());
    if(seq!==liveSeq)return;const have=new Set(songs.map(s=>s.id));
    const live=r.results.filter(s=>s.previewUrl&&!have.has(s.trackId)).map(s=>fromItunes(s));
    const box=$("#songRes");if(box&&!songs.length)box.innerHTML=live.length?songRows(live.slice(0,8),{album:false,numbered:false}):`<p class="note">No songs found.</p>`;
    const lr=$("#liveRes");const rest=songs.length?live:live.slice(8);
    if(lr&&rest.length)lr.innerHTML=section("More from Apple Music",songRows(rest.slice(0,20)),{sub:"Songs from the full catalog that match your search"});
    if(!topA&&!al[0]&&!so[0]&&live[0]){const tr=app.querySelector(".topresult");if(tr){const s=live[0];tr.outerHTML=`<div class="topresult" data-list="${regList([s])}" data-i="0" role="button" tabindex="0"><div class="art">${imgTag(s.art,s.t)}</div><h3>${esc(s.t)}</h3><span><span class="pill">Song</span> <span class="note">${esc(s.by)}</span></span><span class="pov" aria-hidden="true">${I.play}</span></div>`;}}
    markPlaying();
  }catch(e){const box=$("#songRes");if(box&&!songs.length)box.innerHTML=`<p class="note">Couldn't reach Apple Music. Check your connection.</p>`;}},250);
  markPlaying();
}

/* ---------- charts (live iTunes Store chart, Punjabi genre, India) ---------- */
const CHART_URL={songs:`https://itunes.apple.com/${COUNTRY}/rss/topsongs/limit=100/genre=100045/json`,albums:`https://itunes.apple.com/${COUNTRY}/rss/topalbums/limit=50/genre=100045/json`};
const chartCache={};
/* the iTunes Punjabi chart mixes in Gurbani, kirtan and other devotional releases; Ved's Music hides them */
const RELIGIOUS_BY=/\b(bhai|saint|sant|baba|giani|gyani|insan|wale|gurbani|kirtan|ji)\b|^(pupinder singh|devenderpal singh)$/i;
const RELIGIOUS_T=/\b(gurbani|shabad|kirtan|japji|rehras|sukhmani|salok|mahalla|chaupai|ardas|waheguru|mool mantar|satgur|aarti|chalisa|bhajan|jaap sahib|anand sahib|asa di var|satnam|nitnem|teri rajan)\b/i;
const isReligious=x=>RELIGIOUS_T.test(x.t)||String(x.by).split(/,|&/).some(n=>RELIGIOUS_BY.test(n.trim()));
const cleanT=s=>String(s||"").replace(/\s*\((feat\.?|ft\.?|with|From)\b[^)]*\)/ig,"").trim();
function getChart(kind){
  if(chartCache[kind])return chartCache[kind];
  const saved=ls.get("chart2-"+kind,null);
  if(saved&&Date.now()-saved.at<3*36e5)return chartCache[kind]=Promise.resolve(saved);
  return chartCache[kind]=fetch(CHART_URL[kind]).then(r=>r.json()).then(d=>{
    const arr=x=>[].concat(x||[]),lab=x=>x&&x.label||"";
    const img=e=>lab(arr(e["im:image"]).pop()).replace(/\/\d+x\d+bb\.(png|jpg)$/,"/300x300bb.jpg");
    const items=arr(d.feed.entry).map(e=>{const id=+e.id.attributes["im:id"],by=lab(e["im:artist"]),d0=lab(e["im:releaseDate"]).slice(0,10);
      if(kind==="albums")return {id,t:lab(e["im:name"]).replace(/\s*-\s*(Single|EP)$/,""),by,art:img(e),d:d0,n:+lab(e["im:itemCount"])||0,a:artistFor(by)};
      const links=arr(e.link),au=links.find(l=>/^audio/.test(l.attributes.type||"")),pg=links.find(l=>l.attributes.type==="text/html");
      const cid=((pg&&pg.attributes.href||"").match(/\/(\d+)\?i=/)||[])[1];const col=e["im:collection"];
      return {id,t:cleanT(lab(e["im:name"])),full:lab(e["im:name"]),by,alb:lab(col&&col["im:name"]).replace(/\s*-\s*(Single|EP)$/,""),c:cid?+cid:undefined,art:img(e),p:au?au.attributes.href:"",ms:0,d:d0,x:false,a:artistFor(by)};});
    const res={at:Date.now(),updated:lab(d.feed.updated).slice(0,10),items:items.filter(x=>!isReligious(x))};ls.set("chart2-"+kind,res);return res;
  }).catch(e=>{delete chartCache[kind];throw e;});
}
function chartRow(t,i,key){const a=byId[t.a];
  return `<div class="crow" data-list="${key}" data-i="${i}" data-tid="${t.id}" role="button" tabindex="0" aria-label="Play ${esc(t.t)}">
    <span class="rk">${i+1}</span><div class="th">${imgTag(t.art,"")}<span class="pi">${I.play}</span></div>
    <span class="tt"><b>${esc(t.t)}</b><span>${a&&norm(t.by)===norm(a.name)?`<a href="#/artist/${a.id}">${esc(t.by)}</a>`:esc(t.by)}</span></span>${likeBtn(t)}</div>`;}
let chartTab="songs";
async function viewCharts(){
  const tabs=`<div class="chips">${[["songs","Top songs"],["albums","Top albums"]].map(([k,l])=>`<button class="chip${k===chartTab?" on":""}" data-ct="${k}">${l}</button>`).join("")}</div>`;
  app.innerHTML=`<div class="pagewrap"><div class="tint chart-tint"></div>
    <header class="chead"><div class="eyebrow"><span class="live"></span>Live chart</div><h1>Punjabi Top ${chartTab==="songs"?"Songs":"Albums"}</h1>
    <p class="psub">The most-bought Punjabi ${chartTab==="songs"?"songs":"albums"} on the iTunes Store in India, straight from Apple's daily chart.</p>
    <div class="toolbar" style="margin-bottom:6px">${tabs}<span class="count" id="chUpd"></span></div></header>
    <div id="chartBody"><div class="podium">${[0,1,2].map(()=>`<div class="skel" style="height:300px;border-radius:20px"></div>`).join("")}</div></div></div>`;
  app.querySelectorAll("[data-ct]").forEach(b=>b.onclick=()=>{chartTab=b.dataset.ct;viewCharts();});
  let ch;try{ch=await getChart(chartTab);}catch(e){if(cur()==="charts")$("#chartBody").innerHTML=`<p class="msg">Couldn't load the chart from Apple. Check your internet connection and try again.</p>`;return;}
  if(cur()!=="charts")return;
  $("#chUpd").textContent=ch.updated?`Updated ${fmtDate(ch.updated)}`:"";
  const it=ch.items,body=$("#chartBody");
  if(chartTab==="albums"){
    body.innerHTML=`<div class="grid">${it.map((r,i)=>`<div class="tile"><a href="#/album/${r.id}" aria-label="${esc(r.t)}"><div class="art">${imgTag(big(r.art,400),r.t)}<span class="rkb">${i+1}</span></div></a>
      <button class="pov" data-play="album:${r.id}" aria-label="Play ${esc(r.t)}">${I.play}</button>
      <a href="#/album/${r.id}" class="cap"><span>${esc(r.t)}</span></a><div class="capsub">${byId[r.a]&&norm(byId[r.a].name)===norm(r.by)?`<a href="#/artist/${r.a}">${esc(r.by)}</a>`:esc(r.by)}</div></div>`).join("")}</div>`;
    tintFrom($(".chart-tint"),it[0]&&it[0].art,(el,c)=>el.style.background=`radial-gradient(80% 100% at 20% 0%,${hsl(c,55,.5)},transparent 70%)`);return;}
  const key=regList(it);
  body.innerHTML=`<div class="podium">${it.slice(0,3).map((t,i)=>`<div class="pod" data-art="${esc(t.art)}" data-list="${key}" data-i="${i}" data-tid="${t.id}" role="button" tabindex="0" aria-label="Play ${esc(t.t)}">
      <span class="big-rk">${i+1}</span><div class="art">${imgTag(big(t.art,600),t.t)}</div>
      <div class="pt"><b>${esc(t.t)}</b><span>${esc(t.by)}</span></div><div class="pa">${likeBtn(t)}<span class="pov on" aria-hidden="true">${I.play}</span></div></div>`).join("")}</div>
    <div class="btns" style="margin:26px 0 8px"><button class="btn primary" data-list="${key}" data-i="0">${I.play}Play the chart</button><button class="btn" data-shuffle="${key}">${I.shuffle}Shuffle</button></div>
    <section class="sec" style="margin-top:12px">${songRows(it,{key,from:3})}</section>
    <p class="note" style="margin:18px 12px 0">Chart from the iTunes Store in India (Punjabi genre), ranked by purchases. Religious songs are left out. Ved's Music plays 30-second previews from Apple Music.</p>`;
  body.querySelectorAll(".pod[data-art]").forEach(el=>tintFrom(el,el.dataset.art,(el,c)=>{el.style.setProperty("--sc",hsl(c));el.style.setProperty("--sc-d",hsl(c,20));}));
  tintFrom($(".chart-tint"),it[0]&&it[0].art,(el,c)=>el.style.background=`radial-gradient(80% 100% at 20% 0%,${hsl(c,55,.5)},transparent 70%)`);
  markPlaying();
}

/* ---------- library ---------- */
function viewLibrary(tab){
  tab=["liked","recent","artists"].includes(tab)?tab:"liked";
  const tabs=`<div class="chips">${[["liked",`Liked songs`],["recent","Recently played"],["artists","Following"]].map(([k,l])=>`<a class="chip${k===tab?" on":""}" href="#/library/${k}">${l}</a>`).join("")}</div>`;
  let body="";
  if(tab==="liked"){const key=regList(liked),ms=liked.reduce((s,t)=>s+(t.ms||0),0);
    body=`<div class="phead lib-head"><div class="cv likedcv big">${I.heartF.replace('width="18" height="18"','width="84" height="84"')}</div>
      <div style="min-width:0"><div class="eyebrow">Your playlist</div><h1>Liked songs</h1><p class="meta">${liked.length} ${liked.length===1?"song":"songs"}${ms?`, about ${fmtLong(ms)}`:""} · saved on this device</p>
      ${liked.length?`<div class="btns"><button class="bigplay" data-list="${key}" data-i="0" aria-label="Play">${I.play.replace('width="18" height="18"','width="24" height="24"')}</button><button class="circ" data-shuffle="${key}" aria-label="Shuffle">${I.shuffle}</button></div>`:""}</div></div>
      ${liked.length?`<section class="sec">${songRows(liked,{key})}</section>`:`<div class="empty"><h2>No liked songs yet</h2><p>Tap the heart next to any song, or press L while it plays.</p></div>`}`;}
  else if(tab==="recent"){body=recent.length?`<div class="btns" style="margin:8px 0 0"><button class="btn primary" data-list="${regList(recent)}" data-i="0">${I.play}Play</button><button class="btn" id="clearRecent">Clear history</button></div><section class="sec" style="margin-top:18px">${songRows(recent,{numbered:false})}</section>`
      :`<div class="empty"><h2>Nothing played yet</h2><p>Songs you play show up here.</p></div>`;}
  else{const fa=follows.map(id=>byId[id]).filter(Boolean);body=fa.length?`<div class="grid" style="margin-top:8px">${fa.map(a=>artistTile(a,GROUPS[a.group])).join("")}</div>`
      :`<div class="empty"><h2>You're not following anyone yet</h2><p>Tap the heart on an artist's page to follow them.</p><a class="btn primary" href="#/artists" style="margin-top:12px">Browse artists</a></div>`;}
  app.innerHTML=`<div class="pagewrap"><div class="tint" style="background:radial-gradient(80% 100% at 20% 0%,hsl(14 85% 55% / .45),transparent 70%)"></div>
    ${tab==="liked"?"":`<h1 class="ptitle">Library</h1><p class="psub">Everything you've saved and played, kept on this device.</p>`}
    <div class="toolbar"${tab==="liked"?' style="margin-top:22px"':""}>${tabs}</div>${body}</div>`;
  const cr=$("#clearRecent");if(cr)cr.onclick=()=>{recent=[];ls.set("recent",recent);viewLibrary("recent");toast("History cleared");};
  markPlaying();
}

/* ---------- quiz ---------- */
let quiz=null;
function viewQuiz(){
  const Q=K.quiz;
  if(!quiz)quiz={i:0,s:{}};
  if(quiz.i>=Q.length){
    const w=Object.entries(quiz.s).sort((x,y)=>y[1]-x[1])[0][0],a=byId[w];
    app.innerHTML=`<div class="quiz"><div class="result" style="background:${genBg(a)}">${a.photo?`<div class="bgimg" style="background-image:url('${esc(a.photo)}')"></div>`:""}
      <div class="ph art">${artistArt(a,40)}</div>
      <div class="note" style="color:#fff;opacity:.8;margin-top:18px">Your artist is</div><h2>${esc(a.name)}</h2><p style="opacity:.9">${esc(a.line||"")}</p>
      <div class="btns" style="justify-content:center;margin-top:18px"><button class="btn light" data-play="artist:${w}">${I.play}Play their top songs</button><a class="btn glass" href="#/artist/${w}">Open artist</a><button class="btn glass" id="cp">Copy result</button><button class="btn glass" id="again">Retake</button></div></div></div>`;
    $("#again").onclick=()=>{quiz=null;viewQuiz();};
    $("#cp").onclick=async()=>{try{await navigator.clipboard.writeText(`I got ${a.name} on the Ved's Music quiz. Which artist are you?`);toast("Copied. Paste it in your group chat.");}catch(e){}};
    return;
  }
  const it=Q[quiz.i];
  app.innerHTML=`<div class="quiz"><h1 class="ptitle" style="text-align:center">Which artist are you?</h1><div class="note" style="text-align:center">Question ${quiz.i+1} of ${Q.length}</div>
    <div class="progress"><i style="width:${quiz.i/Q.length*100}%"></i></div>
    <p class="q">${esc(it.q)}</p><div class="opts">${it.o.map(([t,k])=>`<button class="opt" data-k="${k}">${esc(t)}</button>`).join("")}</div></div>`;
  app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{quiz.s[b.dataset.k]=(quiz.s[b.dataset.k]||0)+1;quiz.i++;viewQuiz();});
}

/* ============ CREW STATS ============ */
let myStats=null,boardDocs=[],db=null,user=null,myId=null,canWrite=true;
(async()=>{
  try{
    if(!window.claude||!window.claude.use)return;
    [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(user){myId=await user.id();const w=await user.can("data.write");if(w===false)canWrite=false;}
    if(db)db.collection("stats").onSnapshot(s=>{boardDocs=s.docs.filter(d=>d.exists).map(d=>({id:d.id,...d.data()}));if(cur()==="crew")renderBoard();},()=>{});
  }catch(e){}
  if(cur()==="crew")viewCrew();
})();
/* multi-word names can match the song title too (label channels); one-word names only match the artist credit */
const MATCH=ARTISTS.map(a=>[a.id,new RegExp("(^|[^a-z])"+a.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/ /g,"[ -]?")+"([^a-z]|$)"),a.name.includes(" ")]);
MATCH.push(["smw",/moose ?wala/,true]);
function parseCSV(text){const rows=[];let row=[],c="",q=false;for(let i=0;i<text.length;i++){const ch=text[i];
  if(q){if(ch==='"'){if(text[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
  else if(ch==='"')q=true;else if(ch===','){row.push(c);c="";}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(c);rows.push(row);row=[];c="";}else c+=ch;}
  if(c||row.length){row.push(c);rows.push(row);}return rows.filter(r=>r.some(x=>x.trim()));}
function analyse(plays,source){
  const tracked={},art={},hours=new Array(24).fill(0);let total=0,ms=0;
  for(const p of plays){const n=p.count||1;total+=n;if(p.ms)ms+=p.ms;if(p.hour!=null&&p.hour>=0&&p.hour<24)hours[p.hour]+=n;
    const ar=(p.artist||"").toLowerCase(),ti=(p.title||"").toLowerCase();const hit=new Set();
    for(const [id,rx,multi] of MATCH)if(rx.test(ar)||(multi&&rx.test(ti)))hit.add(id);
    hit.forEach(id=>tracked[id]=(tracked[id]||0)+n);
    if(p.artist){const a=p.artist.trim();if(a)art[a]=(art[a]||0)+n;}}
  const hk=hours.some(x=>x>0),hs=hours.reduce((s,x)=>s+x,0);
  return {tracked,top:Object.entries(art).sort((a,b)=>b[1]-a[1]).slice(0,5),hours,hoursKnown:hk,total,minutes:Math.round(ms/60000),latePct:hk&&hs?Math.round(hours.slice(0,5).reduce((s,x)=>s+x,0)/hs*100):null,source};
}
function fromYouTube(json){let it=Array.isArray(json)?json:[];const m=it.filter(i=>i.header==="YouTube Music");if(m.length)it=m;
  return analyse(it.map(i=>{const t=i.time?new Date(i.time):null;return {artist:(i.subtitles&&i.subtitles[0]&&i.subtitles[0].name||"").replace(/ - Topic$/,""),title:(i.title||"").replace(/^Watched /,""),hour:t&&!isNaN(t)?t.getHours():null};}),"YouTube Music");}
function fromApple(text){
  const rows=parseCSV(text);if(rows.length<2)throw 0;const h=rows[0].map(x=>x.trim().toLowerCase());
  const f=(...n)=>{for(const x of n){const i=h.indexOf(x);if(i>-1)return i;}for(const x of n){const i=h.findIndex(y=>y.includes(x));if(i>-1)return i;}return -1;};
  const iA=f("artist name","container artist name","artist"),iD=f("track description"),iS=f("song name","track name","content name","title"),
    iT=f("event start timestamp","event timestamp","last event end timestamp","date played","play date utc"),iH=f("hours"),iM=f("play duration milliseconds","media duration in milliseconds"),iC=f("play count");
  if(iA<0&&iD<0&&iS<0)throw 0;
  return analyse(rows.slice(1).map(r=>{let artist=iA>-1?r[iA]:"",title=iS>-1?r[iS]:"";
    if(iD>-1&&r[iD]){const s=r[iD].indexOf(" - ");if(s>-1){artist=artist||r[iD].slice(0,s);title=title||r[iD].slice(s+3);}else title=title||r[iD];}
    let hour=null;if(iH>-1&&r[iH]){const m=String(r[iH]).match(/\d+/);if(m)hour=+m[0];}else if(iT>-1&&r[iT]&&/T|:/.test(r[iT])){const t=new Date(r[iT]);if(!isNaN(t))hour=t.getHours();}
    return {artist,title,hour,ms:iM>-1?(+r[iM]||0):0,count:iC>-1?(+r[iC]||1):1};}),"Apple Music");
}
async function handleFile(file){
  const m=$("#fileMsg");m.hidden=false;m.textContent="Reading your file…";
  try{const t=await file.text();myStats=(/\.json$/i.test(file.name)||t.trim().startsWith("["))?fromYouTube(JSON.parse(t)):fromApple(t);if(!myStats.total)throw 0;m.hidden=true;renderMine();}
  catch(e){myStats=null;m.textContent="That file couldn't be read. Upload watch-history.json from Google Takeout, or a play activity or play history CSV from Apple's data export.";}
}
function renderMine(){
  const b=$("#mine");if(!b||!myStats)return;const s=myStats,mx=Math.max(1,...s.hours),share=db&&myId&&canWrite;
  const mine=Object.entries(s.tracked).sort((x,y)=>y[1]-x[1]);
  b.innerHTML=`<div class="panel"><h3>Your stats</h3><p class="note">From your ${esc(s.source)} history: ${s.total.toLocaleString()} plays${s.minutes?`, ${s.minutes.toLocaleString()} minutes`:""}. ${mine.length} Ved's Music artists found.</p>
    ${mine.length?`<div class="statgrid">${mine.slice(0,24).map(([id,n])=>{const a=byId[id];return `<a class="stat" href="#/artist/${id}"><div class="ph art">${artistArt(a,15)}</div><div><div class="n">${n.toLocaleString()}</div><div class="l">${esc(a.name)}</div></div></a>`;}).join("")}</div>`:`<p class="msg">None of the artists on Ved's Music showed up in this file.</p>`}
    ${s.hoursKnown?`<h3 style="margin-top:22px">When you listen</h3><div class="hours" role="img" aria-label="Plays by hour of day">${s.hours.map(v=>`<i style="height:${v/mx*100}%" title="${v} plays"></i>`).join("")}</div>
      <div class="axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div><p class="note">${s.latePct}% of your listening happens between midnight and 5 AM.</p>`:""}
    ${s.top.length?`<h3 style="margin-top:22px">Your top artists overall</h3><ol style="margin:8px 0 0;padding-left:20px">${s.top.map(([n,c])=>`<li><strong>${esc(n)}</strong> <span class="note">${c.toLocaleString()} plays</span></li>`).join("")}</ol>`:""}
    ${mine.length?`<div class="btns" style="margin-top:22px"><button class="btn primary" data-play="crewmix">${I.play}Play your Ved's Music mix</button>${share?`<button class="btn" id="shareBtn">Add me to the leaderboard</button>`:""}</div>`:""}
    <p class="note" style="margin-top:10px">${share?"Only your play counts per artist, total plays and late-night percentage are shared. Your file never leaves your device.":"The shared leaderboard works on the online claude.ai version of Ved's Music."}</p>
    <p class="msg" id="shareMsg" hidden></p></div>`;
  const sb=$("#shareBtn");if(sb)sb.onclick=async()=>{const m=$("#shareMsg");sb.disabled=true;
    try{await db.collection("stats").doc(myId).set({tracked:s.tracked,total:s.total,latePct:s.latePct,source:s.source,updatedAt:Date.now()});m.hidden=false;m.textContent="You're on the leaderboard. Upload a newer file any time to update your numbers.";}
    catch(e){m.hidden=false;m.textContent="Your stats couldn't be added. You need edit access to this page, so ask whoever shared it to invite you as an editor.";sb.disabled=false;}};
}
async function renderBoard(){
  const b=$("#board");if(!b)return;
  if(!db){b.innerHTML=`<p class="note">The shared leaderboard works on the online claude.ai version of Ved's Music. On this local copy you can still see your own stats above.</p>`;return;}
  if(!boardDocs.length){b.innerHTML=`<p class="note">Nobody's on the leaderboard yet. Upload your history above and be the first.</p>`;return;}
  let names={};try{if(user)names=await user.profiles(boardDocs.map(d=>d.id));}catch(e){}
  const sum=r=>Object.values(r.tracked||{}).reduce((s,x)=>s+x,0);
  const rows=[...boardDocs].sort((a,c)=>sum(c)-sum(a));
  b.innerHTML=`<div class="board"><table><thead><tr><th>#</th><th>Listener</th><th class="num">Ved's Music plays</th><th>Most played</th><th class="num">Late night</th></tr></thead><tbody>
    ${rows.map((r,i)=>{const nm=(names[r.id]&&names[r.id].name)||"Someone";const ini=nm.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
      const fav=Object.entries(r.tracked||{}).sort((x,y)=>y[1]-x[1])[0];const fa=fav&&byId[fav[0]];
      return `<tr><td class="note">${i+1}</td><td><span class="who"><span class="art" style="width:32px;border-radius:50%;flex:none"><span class="gen" style="font-size:12px;background:linear-gradient(135deg,hsl(${hash(r.id)%360} 70% 50%),hsl(${(hash(r.id)+80)%360} 70% 25%))">${esc(ini)}</span></span>${esc(nm)}${r.id===myId?' <span class="note">(you)</span>':""}</span></td>
      <td class="num">${sum(r).toLocaleString()}</td><td>${fa?`<a href="#/artist/${fa.id}">${esc(fa.name)}</a> <span class="note">${fav[1].toLocaleString()}</span>`:"–"}</td><td class="num">${r.latePct==null?"–":r.latePct+"%"}</td></tr>`;}).join("")}</tbody></table></div>
    ${boardDocs.some(d=>d.id===myId)?`<button class="btn" id="leave" style="margin-top:10px">Remove me from the leaderboard</button>`:""}`;
  const l=$("#leave");if(l)l.onclick=async()=>{l.disabled=true;try{await db.collection("stats").doc(myId).delete();}catch(e){l.disabled=false;}};
}
function viewCrew(){
  app.innerHTML=`<h1 class="ptitle">Crew stats</h1>
  <p class="psub" style="max-width:62ch">Upload your listening history to see which of the ${ARTISTS.length} Ved's Music artists you play the most.</p>
  <div class="how">
    <div class="panel" style="margin:0"><h3>From YouTube Music</h3><ol><li>Go to takeout.google.com and click "Deselect all".</li><li>Tick "YouTube and YouTube Music", choose history only, in JSON format.</li><li>Download, unzip, and upload watch-history.json here.</li></ol></div>
    <div class="panel" style="margin:0"><h3>From Apple Music</h3><ol><li>Go to privacy.apple.com and request a copy of your data.</li><li>Choose "Apple Media Services information". Apple emails you when it's ready, which can take a few days.</li><li>Unzip and upload the play activity or play history CSV here.</li></ol></div>
  </div>
  <label class="drop" id="drop"><input type="file" id="fileIn" accept=".json,.csv,application/json,text/csv"><strong>Choose your history file</strong><br><span class="note">or drag it here. It's read on your device and never uploaded.</span></label>
  <p class="msg" id="fileMsg" hidden></p><div id="mine" style="margin-top:20px"></div>
  <section class="sec"><div class="sec-head"><h2>Leaderboard</h2></div><div id="board"></div></section>`;
  const inp=$("#fileIn"),d=$("#drop");
  inp.onchange=()=>inp.files[0]&&handleFile(inp.files[0]);
  d.addEventListener("dragover",e=>{e.preventDefault();d.classList.add("over");});d.addEventListener("dragleave",()=>d.classList.remove("over"));
  d.addEventListener("drop",e=>{e.preventDefault();d.classList.remove("over");const f=e.dataTransfer.files[0];if(f)handleFile(f);});
  renderMine();renderBoard();
}

/* ============ PLAYER ============ */
const audio=new Audio();audio.preload="auto";
const P={queue:[],i:-1,shuffle:false,repeat:"off"};
audio.volume=ls.get("vol",0.8);
const pl$=$("#player");
pl$.innerHTML=`
  <div class="np"><div class="th" id="npArt" role="button" tabindex="0" aria-label="Open now playing"></div><div class="tt"><div class="t" id="npT">Nothing playing</div><div class="s" id="npS">Pick a song to hear a preview</div></div><span id="npLike"></span></div>
  <div class="ctrl"><div class="b">
    <button class="pbtn" id="pShuf" aria-label="Shuffle" aria-pressed="false">${I.shuffle}</button>
    <button class="pbtn" id="pPrev" aria-label="Previous">${I.prev}</button>
    <button class="pbtn main" id="pPlay" aria-label="Play">${I.play}</button>
    <button class="pbtn nxt" id="pNext" aria-label="Next">${I.next}</button>
    <button class="pbtn" id="pRep" aria-label="Repeat" aria-pressed="false">${I.repeat}</button></div>
    <div class="seek"><span id="pCur">0:00</span><input class="range" id="pSeek" type="range" min="0" max="1000" value="0" aria-label="Seek"><span id="pDur">0:30</span></div></div>
  <div class="pright"><span class="badge" title="Ved's Music plays 30-second previews from Apple Music">Preview</span><a class="full" id="pFull" target="_blank" rel="noopener" href="#">Full song ${I.ext}</a>
    <button class="pbtn" id="pQueue" aria-label="Queue">${I.queue}</button><button class="pbtn" id="pMute" aria-label="Mute">${I.vol}</button><input class="range vol" id="pVol" type="range" min="0" max="100" aria-label="Volume"></div>
  <span class="mprog"></span>`;
const pPlay=$("#pPlay"),pSeek=$("#pSeek"),pVol=$("#pVol");
pVol.value=audio.volume*100;pVol.style.setProperty("--v",pVol.value+"%");
const curTrack=()=>P.queue[P.i];
function setPlayIcon(){const on=!audio.paused;pPlay.innerHTML=on?I.pause:I.play;pPlay.setAttribute("aria-label",on?"Pause":"Play");document.body.classList.toggle("paused",!on);
  const fp=$("#fsPlay");if(fp)fp.innerHTML=(on?I.pause:I.play).replace(/width="18" height="18"/,'width="28" height="28"');}
async function playQueue(tracks,i=0,{shuffle}={}){
  tracks=tracks.filter(t=>!t.missing);if(!tracks.length){toast("No previews available for this one.");return;}
  P.queue=tracks.slice();P.i=i;
  if(shuffle??P.shuffle){const first=P.queue.splice(i,1)[0];for(let k=P.queue.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[P.queue[k],P.queue[j]]=[P.queue[j],P.queue[k]];}if(shuffle&&i===0&&tracks.length>1){P.queue.push(first);P.i=0;}else{P.queue.unshift(first);P.i=0;}}
  await loadCurrent();
}
async function loadCurrent(skip=0){
  const t=curTrack();if(!t)return;
  if(t.pending){$("#npT").textContent=t.t;$("#npS").textContent="Finding preview…";await resolveTrack(t);}
  if(t!==curTrack())return;
  if(!t.p){if(skip>5){toast("Couldn't find previews for these songs.");return;}toast(`No preview for ${t.t}, skipping`);P.i++;if(P.i>=P.queue.length){P.i--;return;}return loadCurrent(skip+1);}
  audio.src=t.p;try{await audio.play();}catch(e){}
  addRecent(t);updateNP();
}
function updateNP(){
  const t=curTrack();if(!t)return;const a=byId[t.a];
  pl$.classList.remove("idle");
  $("#npArt").innerHTML=imgTag(t.art,t.t);
  $("#npT").innerHTML=t.c?`<a href="#/album/${t.c}">${esc(t.t)}</a>`:esc(t.t);
  $("#npS").innerHTML=a?`<a href="#/artist/${a.id}">${esc(t.by||a.name)}</a>`:esc(t.by||"");
  $("#pFull").href=ytm(t.t+" "+(t.by||""));
  $("#npLike").innerHTML=likeBtn(t,"pbtn like");
  artColor(t.art).then(c=>{if(c&&curTrack()===t){pl$.style.setProperty("--np",hsl(c,50,.9));$("#fs").style.setProperty("--np",hsl(c,30));}});
  $("#pPrev").disabled=false;$("#pNext").disabled=P.i>=P.queue.length-1&&P.repeat==="off";
  document.title=`${t.t} · ${t.by||""} — Ved's Music`;
  if("mediaSession" in navigator){try{navigator.mediaSession.metadata=new MediaMetadata({title:t.t,artist:t.by||"",album:t.alb||"",artwork:[{src:big(t.art,600),sizes:"600x600",type:"image/jpeg"}]});}catch(e){}}
  markPlaying();renderQueue();renderFS();
}
function markPlaying(){const t=curTrack();document.querySelectorAll(".playing[data-tid]").forEach(r=>r.classList.remove("playing"));if(!t||!t.id)return;document.querySelectorAll(`[data-tid="${t.id}"]`).forEach(r=>r.classList.add("playing"));
  document.querySelectorAll(".pov.on").forEach(b=>b.classList.remove("on"));}
function next(auto){
  if(P.repeat==="one"&&auto){audio.currentTime=0;audio.play();return;}
  if(P.i<P.queue.length-1){P.i++;loadCurrent();}
  else if(P.repeat==="all"&&P.queue.length){P.i=0;loadCurrent();}
  else if(auto){audio.pause();audio.currentTime=0;setPlayIcon();}
}
function prev(){if(audio.currentTime>3||P.i===0){audio.currentTime=0;return;}P.i--;loadCurrent();}
function togglePlay(){if(!curTrack()){const a=NEWSCHOOL[0];playQueue(a.top);return;}audio.paused?audio.play():audio.pause();}
pPlay.onclick=togglePlay;$("#pNext").onclick=()=>next(false);$("#pPrev").onclick=prev;
$("#pShuf").onclick=e=>{P.shuffle=!P.shuffle;e.currentTarget.classList.toggle("on",P.shuffle);e.currentTarget.setAttribute("aria-pressed",P.shuffle);
  if(P.shuffle&&P.queue.length>1){const c=P.queue[P.i];const rest=P.queue.filter((_,k)=>k!==P.i).sort(()=>Math.random()-.5);P.queue=[c,...rest];P.i=0;renderQueue();}toast(P.shuffle?"Shuffle on":"Shuffle off");};
$("#pRep").onclick=e=>{P.repeat=P.repeat==="off"?"all":P.repeat==="all"?"one":"off";const b=e.currentTarget;b.classList.toggle("on",P.repeat!=="off");b.setAttribute("aria-pressed",P.repeat!=="off");
  b.innerHTML=P.repeat==="one"?I.repeat.replace("</svg>",'<text x="12" y="15.5" font-size="8" text-anchor="middle" fill="currentColor" stroke="none" font-weight="800">1</text></svg>'):I.repeat;toast(P.repeat==="off"?"Repeat off":P.repeat==="all"?"Repeat all":"Repeat one");updateNP();};
pVol.oninput=()=>{audio.volume=pVol.value/100;audio.muted=false;pVol.style.setProperty("--v",pVol.value+"%");ls.set("vol",audio.volume);$("#pMute").innerHTML=audio.volume?I.vol:I.mute;};
$("#pMute").onclick=()=>{audio.muted=!audio.muted;$("#pMute").innerHTML=audio.muted?I.mute:I.vol;};
let seeking=false;
pSeek.oninput=()=>{seeking=true;pSeek.style.setProperty("--v",pSeek.value/10+"%");};
pSeek.onchange=()=>{if(audio.duration)audio.currentTime=pSeek.value/1000*audio.duration;seeking=false;};
audio.addEventListener("timeupdate",()=>{const d=audio.duration||30,v=audio.currentTime/d*100;
  if(!seeking){pSeek.value=v*10;pSeek.style.setProperty("--v",v+"%");}pl$.querySelector(".mprog").style.setProperty("--v",v+"%");
  $("#pCur").textContent=fmtDur(audio.currentTime*1000);$("#pDur").textContent=fmtDur(d*1000);
  const fs=$("#fsSeek");if(fs&&!fs.matches(":active")){fs.value=v*10;fs.style.setProperty("--v",v+"%");$("#fsCur").textContent=fmtDur(audio.currentTime*1000);}});
audio.addEventListener("play",setPlayIcon);audio.addEventListener("pause",setPlayIcon);
audio.addEventListener("ended",()=>next(true));
audio.addEventListener("error",()=>{if(audio.src&&curTrack()){toast("That preview couldn't play, skipping");setTimeout(()=>next(true),600);}});
if("mediaSession" in navigator){try{navigator.mediaSession.setActionHandler("play",()=>audio.play());navigator.mediaSession.setActionHandler("pause",()=>audio.pause());
  navigator.mediaSession.setActionHandler("nexttrack",()=>next(false));navigator.mediaSession.setActionHandler("previoustrack",prev);}catch(e){}}

/* queue panel */
function renderQueue(){const q=$("#queue");if(q.hidden)return;
  const up=P.queue.slice(P.i+1);const key=regList(P.queue);
  q.innerHTML=`<h3>Now playing</h3>${curTrack()?songRows([curTrack()],{album:false,numbered:false,key:regList([curTrack()])}):`<p class="note" style="margin:0 6px">Nothing playing yet.</p>`}
    <h3 style="margin-top:16px">Up next</h3>${up.length?`<div class="songs">${songRows(up,{album:false,numbered:false,key:regList(up)}).replace(/^<div class="songs"[^>]*>|<\/div>$/g,"")}</div>`:`<p class="note" style="margin:0 6px">Nothing queued. Use the ••• menu on any song to add it.</p>`}`;
  q.querySelectorAll(".songs .song").forEach(r=>{r.classList.add("noalb");});
  q.dataset.base=P.i;markPlaying();}
$("#pQueue").onclick=e=>{const q=$("#queue");q.hidden=!q.hidden;e.currentTarget.classList.toggle("on",!q.hidden);renderQueue();};

/* full-screen now playing */
function openFS(){if(!curTrack())return;const f=$("#fs");f.hidden=false;renderFS();document.body.style.overflow="hidden";}
function closeFS(){$("#fs").hidden=true;document.body.style.overflow="";}
function renderFS(){const f=$("#fs");if(f.hidden)return;const t=curTrack();if(!t)return;const a=byId[t.a];
  f.innerHTML=`<div class="bgimg" style="background-image:url('${esc(big(t.art,600))}')"></div><button class="pbtn x" id="fsX" aria-label="Close">${I.down}</button>
    <div class="big">${imgTag(big(t.art,1000),t.t)}</div>
    <div class="info"><div><b>${esc(t.t)}</b><span>${esc(t.by||(a&&a.name)||"")}</span></div>${likeBtn(t,"pbtn like")}</div>
    <div class="seek"><span id="fsCur">0:00</span><input class="range" id="fsSeek" type="range" min="0" max="1000" value="0" aria-label="Seek"><span>${fmtDur((audio.duration||30)*1000)}</span></div>
    <div class="b"><button class="pbtn" id="fsPrev" aria-label="Previous">${I.prev}</button><button class="pbtn main" id="fsPlay" aria-label="Play or pause"></button><button class="pbtn" id="fsNext" aria-label="Next">${I.next}</button></div>
    <div class="btns">${a?`<a class="btn glass sm" href="#/artist/${a.id}">Go to artist</a>`:""}<a class="btn glass sm" target="_blank" rel="noopener" href="${ytm(t.t+" "+(t.by||""))}">Full song on YouTube Music ${I.ext}</a></div>`;
  $("#fsX").onclick=closeFS;$("#fsPrev").onclick=prev;$("#fsNext").onclick=()=>next(false);$("#fsPlay").onclick=togglePlay;
  const s=$("#fsSeek");s.onchange=()=>{if(audio.duration)audio.currentTime=s.value/1000*audio.duration;};s.oninput=()=>s.style.setProperty("--v",s.value/10+"%");
  f.querySelectorAll("a").forEach(x=>x.addEventListener("click",()=>{if(x.getAttribute("href").startsWith("#"))closeFS();}));setPlayIcon();}
$("#npArt").onclick=openFS;
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeFS();closeMenu();$("#queue").hidden=true;const km=$("#keysModal");if(km)km.remove();}
  if(e.target.matches("input,textarea,select"))return;
  if(e.code==="Space"&&!e.target.matches("button,a,[role=button]")){e.preventDefault();togglePlay();}
  if((e.key==="Enter"||e.key===" ")&&e.target.matches(".song,.topresult[data-list]")){e.preventDefault();e.target.click();}
  if(e.key==="/"){e.preventDefault();qIn.focus();}
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){if(e.target.matches("[role=button],button,a")&&!e.target.closest(".player"))return;e.preventDefault();
    if(e.shiftKey)e.key==="ArrowRight"?next(false):prev();else if(curTrack())audio.currentTime=Math.max(0,Math.min((audio.duration||30)-.2,audio.currentTime+(e.key==="ArrowRight"?5:-5)));}
  const k=e.key.toLowerCase();
  if(k==="l"&&curTrack())toggleLike(curTrack());
  if(k==="m")$("#pMute").click();
  if(k==="q")$("#pQueue").click();
  if(k==="f"&&curTrack())$("#fs").hidden?openFS():closeFS();
  if(e.key==="?")toggleKeys();
});
function toggleKeys(){let m=$("#keysModal");if(m){m.remove();return;}
  m=document.createElement("div");m.id="keysModal";m.className="modal";m.setAttribute("role","dialog");m.setAttribute("aria-label","Keyboard shortcuts");
  const K2=[["Space","Play or pause"],["← →","Back or forward 5 seconds"],["Shift ← →","Previous or next song"],["L","Like the current song"],["M","Mute"],["Q","Show the queue"],["F","Full-screen player"],["/","Search"],["?","Show these shortcuts"],["Esc","Close panels"]];
  m.innerHTML=`<div class="mbox"><h3>Keyboard shortcuts</h3><dl>${K2.map(([a,b])=>`<div><dt>${a.split(" ").map(x=>`<kbd>${x}</kbd>`).join(" ")}</dt><dd>${b}</dd></div>`).join("")}</dl><button class="btn sm" id="keysX">Close</button></div>`;
  document.body.appendChild(m);m.onclick=e=>{if(e.target===m||e.target.id==="keysX")m.remove();};$("#keysX").focus();}

/* song menu */
let menuEl=null;
function closeMenu(){if(menuEl){menuEl.remove();menuEl=null;}}
function openMenu(btn,t){
  closeMenu();const a=byId[t.a];
  menuEl=document.createElement("div");menuEl.className="menu";menuEl.setAttribute("role","menu");
  menuEl.innerHTML=`${t.id?`<button data-m="like">${isLiked(t)?I.heartF:I.heart}${isLiked(t)?"Remove from Liked songs":"Add to Liked songs"}</button>`:""}<button data-m="next">${I.next}Play next</button><button data-m="queue">${I.plus}Add to queue</button>
    ${a?`<a href="#/artist/${a.id}">${I.artists}Go to artist</a>`:""}${t.c?`<a href="#/album/${t.c}">${I.new}Go to album</a>`:""}
    <a target="_blank" rel="noopener" href="${ytm(t.t+" "+(t.by||""))}">${I.ext}YouTube Music</a>
    <a target="_blank" rel="noopener" href="${t.c&&t.id?`https://music.apple.com/${COUNTRY}/album/${t.c}?i=${t.id}`:amSearch(t.t+" "+(t.by||""))}">${I.ext}Apple Music</a>
    <a target="_blank" rel="noopener" href="${spot(t.t+" "+(t.by||""))}">${I.ext}Spotify</a>`;
  menuEl.querySelectorAll("svg").forEach(s=>{s.setAttribute("width",16);s.setAttribute("height",16);});
  document.body.appendChild(menuEl);
  const r=btn.getBoundingClientRect(),mw=menuEl.offsetWidth,mh=menuEl.offsetHeight;
  menuEl.style.left=Math.max(8,Math.min(r.right-mw,innerWidth-mw-8))+"px";
  menuEl.style.top=(r.bottom+mh+8>innerHeight?Math.max(8,r.top-mh-6):r.bottom+6)+"px";
  menuEl.onclick=e=>{const m=e.target.closest("[data-m]");
    if(m&&m.dataset.m==="like"){toggleLike(t);}
    else if(m){const copy={...t};if(!curTrack()){playQueue([copy]);}else if(m.dataset.m==="next"){P.queue.splice(P.i+1,0,copy);toast(`${t.t} plays next`);}else{P.queue.push(copy);toast(`Added ${t.t} to the queue`);}renderQueue();updateNP();}
    closeMenu();};
  menuEl.querySelector("button").focus();
}

/* one click handler for everything playable */
async function playTarget(spec,shuf){
  const [kind,id]=spec.split(":");
  if(kind==="album"){toast("Loading…");try{const al=await loadAlbum(id);playQueue(al.tracks,0,{shuffle:shuf});addCtx(spec,{t:al.t,art:al.art,sub:`${al.k} · ${al.by}`});}catch(e){toast("Couldn't load that release.");}}
  else if(kind==="artist"){playQueue(byId[id].top,0,{shuffle:shuf});addCtx(spec,{});}
  else if(kind==="pl"){const pl=getPlaylist(id);playQueue(pl.tracks,0,{shuffle:shuf});addCtx(spec,{});}
  else if(kind==="crewmix"&&myStats){const tr=[];Object.entries(myStats.tracked).sort((x,y)=>y[1]-x[1]).slice(0,12).forEach(([aid])=>tr.push(...byId[aid].top.slice(0,3)));playQueue(tr,0,{shuffle:true});}
}
document.addEventListener("click",e=>{
  if(menuEl&&!e.target.closest(".menu")&&!e.target.closest("[data-menu]"))closeMenu();
  if(!$("#queue").hidden&&!e.target.closest("#queue")&&!e.target.closest("#pQueue")&&!e.target.closest(".menu"))$("#queue").hidden=true,$("#pQueue").classList.remove("on");
  const lb=e.target.closest("[data-like]");if(lb){e.preventDefault();e.stopPropagation();const id=+lb.dataset.like,row=lb.closest("[data-list]");
    const t=(row&&LISTS[row.dataset.list]&&LISTS[row.dataset.list][+row.dataset.i])||(curTrack()&&curTrack().id===id?curTrack():null)||liked.find(x=>x.id===id);toggleLike(t);return;}
  const mb=e.target.closest("[data-menu]");if(mb){e.preventDefault();e.stopPropagation();const [k,i]=mb.dataset.menu.split(":");if(menuEl){closeMenu();return;}openMenu(mb,LISTS[k][+i]);return;}
  const pb=e.target.closest("[data-play]");if(pb){e.preventDefault();
    const spec=pb.dataset.play;const t=curTrack();
    playTarget(spec,!!pb.dataset.shuf);return;}
  const sh=e.target.closest("[data-shuffle]");if(sh){e.preventDefault();playQueue(LISTS[sh.dataset.shuffle],0,{shuffle:true});return;}
  const row=e.target.closest("[data-list]");if(row&&!e.target.closest("a")){
    const list=LISTS[row.dataset.list],i=+row.dataset.i;const t=list[i];
    if(t.missing){window.open(ytm(t.t+" "+(t.by||"")),"_blank","noopener");return;}
    if(curTrack()&&t.id&&curTrack().id===t.id){togglePlay();return;}
    if(row.closest("#queue")){const base=P.queue.indexOf(t);if(base>-1){P.i=base;loadCurrent();return;}}
    playQueue(list,i,{shuffle:false});ctxFromRoute();return;}
  const arr=e.target.closest(".arr");if(arr){const rs=arr.parentElement.querySelector(".rowscroll");rs.scrollBy({left:(arr.classList.contains("l")?-1:1)*rs.clientWidth*.9});}
});
/* shelf arrows enable/disable */
function wireShelves(){app.querySelectorAll(".shelf").forEach(s=>{const rs=s.querySelector(".rowscroll"),l=s.querySelector(".arr.l"),r=s.querySelector(".arr.r");
  const upd=()=>{l.disabled=rs.scrollLeft<8;r.disabled=rs.scrollLeft+rs.clientWidth>=rs.scrollWidth-8;};rs.addEventListener("scroll",upd,{passive:true});upd();});}

/* ============ ROUTER ============ */
const qIn=$("#q");
function cur(){return location.hash.replace(/^#\/?/,"").split("/")[0]||"home";}
const isMobile=()=>matchMedia("(max-width:900px)").matches;
function route(){
  const p=location.hash.replace(/^#\/?/,"").split("/"),r=p[0]||"home";
  const navKey=r==="artist"?"artists":r==="album"?"new":r==="playlist"?"playlists":r;
  document.querySelectorAll("[data-nav]").forEach(a=>a.dataset.nav===navKey?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
  document.querySelectorAll("[data-side]").forEach(a=>a.dataset.side===p.slice(0,2).join("/")?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
  document.body.dataset.hdr=r==="artist"?"1":"";
  if(r!=="search")qIn.value="";
  closeMenu();clearInterval(carT);
  if(r==="artist")viewArtist(p[1]);else if(r==="album")viewAlbum(p[1]);else if(r==="playlist")viewPlaylist(p[1]);
  else if(r==="artists")viewArtists(p[1]);else if(r==="new")viewNew();else if(r==="playlists")viewPlaylists();
  else if(r==="quiz")viewQuiz();else if(r==="crew")viewCrew();
  else if(r==="charts")viewCharts();else if(r==="library")viewLibrary(p[1]);
  else if(r==="search"){const t=decodeURIComponent(p.slice(1).join("/"));if(document.activeElement!==qIn)qIn.value=t;viewSearch(t);if(isMobile()&&!t)setTimeout(()=>qIn.focus(),50);}
  else viewHome();
  if(r!=="search"||!p[1]){(isMobile()?window:mainEl).scrollTo({top:0,behavior:"instant"});}
  if(r!=="album")document.title=curTrack()&&!audio.paused?document.title:"Ved's Music";
  wireShelves();markPlaying();setTimeout(onScroll,0);
  new MutationObserver((m,o)=>{wireShelves();o.disconnect();}).observe(app,{childList:true});
}
let st;qIn.addEventListener("input",()=>{clearTimeout(st);st=setTimeout(()=>{const v=qIn.value.trim();
  history.replaceState(null,"","#/search/"+enc(v));route();},180);});
qIn.addEventListener("focus",()=>{if(cur()!=="search")location.hash="#/search";});
window.addEventListener("hashchange",route);
$("#back").onclick=()=>history.back();$("#fwd").onclick=()=>history.forward();
const onScroll=()=>{const y=isMobile()?scrollY:mainEl.scrollTop;$(".topbar").classList.toggle("scrolled",y>10);};
mainEl.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("scroll",onScroll,{passive:true});

/* theme */
const root=document.documentElement;
root.dataset.theme=ls.get("theme","light");
$("#themeBtn").innerHTML=I.moon;
$("#themeBtn").insertAdjacentHTML("beforebegin",`<button class="icon-btn kbtn" id="keysBtn" aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">${I.keys}</button>`);
$("#keysBtn").onclick=toggleKeys;
$("#themeBtn").onclick=()=>{const n=root.dataset.theme==="light"?"dark":"light";root.dataset.theme=n;ls.set("theme",n);};

renderSide();route();setPlayIcon();
if(!ARTISTS.length)app.innerHTML=`<div class="empty"><h2>No catalog yet</h2><p>Run <code>python3 tools/build_catalog.py</code> in the kafla folder to download the artist data.</p></div>`;
