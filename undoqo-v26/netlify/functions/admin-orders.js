/** Read-only management API. Admin token must be at least 32 random characters. */
const {crypto,out,env,db}=require('./_lib/commerce');
exports.handler=async event=>{
 if(event.httpMethod!=='GET')return out(405,{error:'GET required'});
 try{
  const secret=process.env.UNDOQO_ADMIN_API_KEY||'';
  const presented=event.headers?.['x-admin-key']||event.headers?.['X-Admin-Key']||'';
  if(secret.length<32||!presented||Buffer.byteLength(presented)!==Buffer.byteLength(secret)||!crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(presented)))return out(401,{error:'Unauthorized'});
  const cfg=env();const orders=await db(cfg,'orders',{query:'?select=id,status,total_zar,total_usd,created_at,paid_at,paypal_order_id,paypal_capture_id,customer_id&order=created_at.desc&limit=100'});
  const ids=[...new Set(orders.map(o=>o.customer_id))];
  const customers=ids.length?await db(cfg,'customers',{query:'?id=in.('+ids.join(',')+')&select=id,full_name,email'}):[];
  const byId=new Map(customers.map(x=>[x.id,x]));
  const allIds=orders.map(o=>o.id);
  const invoices=allIds.length?await db(cfg,'invoices',{query:'?order_id=in.('+allIds.join(',')+')&select=order_id,invoice_number'}):[];
  const invoiceById=new Map(invoices.map(x=>[x.order_id,x.invoice_number]));
  return out(200,{orders:orders.map(o=>({id:o.id,status:o.status,createdAt:o.created_at,paidAt:o.paid_at,totalZar:o.total_zar,totalUsd:o.total_usd,paypalOrderId:o.paypal_order_id,paypalCaptureId:o.paypal_capture_id,customer:byId.get(o.customer_id)||null,invoiceNumber:invoiceById.get(o.id)||null}))});
 }catch(e){console.error('Admin orders failed',e.message);return out(503,{error:'Orders unavailable'})}
};
