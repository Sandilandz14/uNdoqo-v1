/** Read-only admin asset inventory. Upload via Supabase dashboard, then register via SQL. */
const {out,env,db}=require('./_lib/commerce');const crypto=require('node:crypto');
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return out(405,{error:'GET required'});
 const secret=process.env.UNDOQO_ADMIN_API_KEY||'',entered=event.headers?.['x-admin-key']||event.headers?.['X-Admin-Key']||'';
 if(secret.length<32||Buffer.byteLength(entered)!==Buffer.byteLength(secret)||!crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(entered)))return out(401,{error:'Unauthorized'});
 try{const cfg=env();return out(200,{assets:await db(cfg,'digital_assets',{query:'?select=product_id,display_name,storage_path,enabled,updated_at&order=product_id.asc'})})}
 catch{return out(503,{error:'Asset inventory unavailable'})}
};
