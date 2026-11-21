/** One-minute private storage link, only for a paid customer's active entitlement. */
const {out,env,db}=require('./_lib/commerce');
const {authorizedOrder}=require('./_lib/order-auth');
const BUCKET='undoqo-digital-library';
async function signDownload(cfg,path){
 const r=await fetch(cfg.url+'/storage/v1/object/sign/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/'),{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60})});
 if(!r.ok)throw Error('Storage asset missing');const data=await r.json();const pathUrl=data.signedURL||data.signedUrl;
 if(typeof pathUrl!=='string'||!pathUrl.startsWith('/storage/v1/object/sign/'))throw Error('Bad storage response');
 return cfg.url+pathUrl;
}
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const input=JSON.parse(event.body||'{}');if(typeof input.productId!=='string'||!/^[A-Za-z0-9_-]{3,80}$/.test(input.productId))return out(400,{error:'Invalid product'});
  const cfg=env(),order=await authorizedOrder(cfg,input);if(order.status!=='paid')return out(403,{error:'Not available'});
  const id=encodeURIComponent(order.id),pid=encodeURIComponent(input.productId);
  const [items,ents,assets]=await Promise.all([
   db(cfg,'order_items',{query:'?order_id=eq.'+id+'&product_id=eq.'+pid+'&kind=eq.book&select=id'}),
   db(cfg,'digital_entitlements',{query:'?order_id=eq.'+id+'&product_id=eq.'+pid+'&status=eq.active&select=id'}),
   db(cfg,'digital_assets',{query:'?product_id=eq.'+pid+'&enabled=eq.true&select=storage_path,display_name'})]);
  if(items?.length!==1||ents?.length!==1||assets?.length!==1)return out(403,{error:'Digital book unavailable'});
  return out(200,{url:await signDownload(cfg,assets[0].storage_path),expiresIn:60,title:assets[0].display_name});
 }catch(e){return out(503,{error:'Download unavailable'})}
};
module.exports.signDownload=signDownload;
