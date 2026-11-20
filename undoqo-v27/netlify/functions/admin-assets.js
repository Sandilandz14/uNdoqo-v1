/** Admin asset registry. PDF upload remains in private Supabase Storage dashboard.
 * POST registers a disabled asset or activates an uploaded PDF after metadata check.
 */
const {out,env,db,rpc}=require('./_lib/commerce');
const {permitted}=require('./_lib/admin-auth');
const catalog=require('../../data/catalog.json');
const BUCKET='undoqo-digital-library';
function validProduct(id){return catalog.some(p=>p.id===id&&p.format==='PDF')}
function validPath(path){return typeof path==='string'&&path.length<=240&&/^[A-Za-z0-9][A-Za-z0-9_./-]*\.pdf$/i.test(path)&&!/(^|\/)\.\.?($|\/)/.test(path)}
async function verifiedStorage(cfg,path){
 const url=cfg.url+'/storage/v1/object/info/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/');
 const r=await fetch(url,{headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key}});
 if(!r.ok)throw Error('PDF not found in private storage ('+r.status+')');
 const details=await r.json();
 const mime=details?.metadata?.mimetype||details?.metadata?.contentType||'';
 if(mime!=='application/pdf')throw Error('Uploaded file is not a PDF');
 return details;
}
exports.handler=async event=>{
 if(!['GET','POST'].includes(event.httpMethod))return out(405,{error:'GET or POST required'});
 if(!permitted(event))return out(401,{error:'Unauthorized'});
 try{
  const cfg=env();
  if(event.httpMethod==='GET')return out(200,{assets:await db(cfg,'digital_assets',{query:'?select=product_id,display_name,storage_path,enabled,updated_at&order=product_id.asc'})});
  const body=JSON.parse(event.body||'{}');
  if(!validProduct(body.productId))return out(400,{error:'Unknown digital bookstore product'});
  if(body.action==='register'){
   if(!validPath(body.path)||typeof body.displayName!=='string'||!body.displayName.trim()||body.displayName.length>180)return out(400,{error:'Invalid PDF registration'});
   await verifiedStorage(cfg,body.path);
   const existing=await db(cfg,'digital_assets',{query:'?product_id=eq.'+encodeURIComponent(body.productId)+'&select=product_id'});
   if(existing.length)return out(409,{error:'Product already registered; changing a purchased PDF requires manual review'});
   const result=await db(cfg,'digital_assets',{method:'POST',body:{product_id:body.productId,storage_path:body.path,display_name:body.displayName.trim(),enabled:false}});
   return out(200,{registered:true,enabled:false,productId:body.productId});
  }
  if(body.action==='activate'){
   const rows=await db(cfg,'digital_assets',{query:'?product_id=eq.'+encodeURIComponent(body.productId)+'&select=storage_path,enabled'});
   if(rows.length!==1)return out(404,{error:'Asset not registered'});
   await verifiedStorage(cfg,rows[0].storage_path);
   await db(cfg,'digital_assets',{method:'PATCH',query:'?product_id=eq.'+encodeURIComponent(body.productId),body:{enabled:true,updated_at:new Date().toISOString()}});
   const activated=await rpc(cfg,'commerce_activate_asset',{p_product_id:body.productId});
   return out(200,{productId:body.productId,enabled:true,entitlementsActivated:activated});
  }
  return out(400,{error:'Unknown asset operation'});
 }catch(e){console.error('Admin asset action failed:',e.message);return out(503,{error:'Asset operation failed; inspect server logs and verify storage and database status'});}
};
module.exports.validPath=validPath;
module.exports.validProduct=validProduct;
