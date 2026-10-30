// Cloudflare Pages Function: GET /api/cart?url=<shein link>
const HOST=/(^|\.)(shein\.[a-z.]+|shein\.top|sheingsp\.com|shein\.page\.link)$/i;
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json;charset=utf-8','access-control-allow-origin':'*'}});
const dec=s=>s.replace(/\\u002F/g,'/').replace(/\\"/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'");
export async function onRequestGet({request}){
 const raw=new URL(request.url).searchParams.get('url')||'';
 let u;try{u=new URL(raw)}catch(e){return J({ok:false,error:'رابط غير صحيح'},400)}
 if(!/^https?:$/.test(u.protocol)||!HOST.test(u.hostname))return J({ok:false,error:'الرابط مو من شين'},400);
 let res;
 try{res=await fetch(u.toString(),{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1','accept-language':'en-US,en;q=0.9','accept':'text/html,application/xhtml+xml'}})}
 catch(e){return J({ok:false,error:'تعذر الوصول لشين'},502)}
 const fin=new URL(res.url);
 if(!HOST.test(fin.hostname))return J({ok:false,error:'التحويل خرج عن شين'},400);
 const html=(await res.text()).slice(0,3_000_000);
 const items=[],seen=new Set();
 const re=/"goods_name"\s*:\s*"((?:[^"\\]|\\.)*)"/g;let m;
 while((m=re.exec(html))){
  const win=html.slice(m.index,m.index+2500);
  const p=win.match(/"(?:salePrice|sale_price|retailPrice)"\s*:\s*\{[^}]*?"amount"\s*:\s*"?([\d.]+)/);
  if(!p)continue;
  const q=win.match(/"(?:quantity|num|goods_num)"\s*:\s*"?(\d+)/);
  const name=dec(m[1]).slice(0,120);
  const key=name+p[1];if(seen.has(key))continue;seen.add(key);
  items.push({name,price:parseFloat(p[1]),qty:q?Math.min(+q[1],99)||1:1});
 }
 if(!items.length){
  const t=html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i),
        pr=html.match(/<meta[^>]+property="(?:product|og):price:amount"[^>]+content="([\d.]+)"/i)||html.match(/"price"\s*:\s*"?([\d.]+)"?/);
  if(pr)items.push({name:t?dec(t[1]).slice(0,120):'',price:parseFloat(pr[1]),qty:1});
 }
 if(!items.length)return J({ok:false,error:'شين ما رجعت بيانات السلة (السلة غالباً تنحمل بعد فتح الصفحة)'});
 return J({ok:true,items});
}
