/** Retrieve orders using an independent unguessable receipt token. */
const {out,env,db}=require('./_lib/commerce');
const {authorizedOrder}=require('./_lib/order-auth');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const cfg=env(),row=await authorizedOrder(cfg,JSON.parse(event.body||'{}')),id=encodeURIComponent(row.id);
  const [invoices,bookings,entitlements]=await Promise.all([
   db(cfg,'invoices',{query:'?order_id=eq.'+id+'&select=invoice_number,issued_at'}),
   db(cfg,'bookings',{query:'?order_id=eq.'+id+'&select=product_id,status,scheduled_at'}),
   db(cfg,'digital_entitlements',{query:'?order_id=eq.'+id+'&select=product_id,status'})]);
  return out(200,{orderId:row.id,status:row.status,totalZar:row.total_zar,totalUsd:row.total_usd,invoiceNumber:invoices?.[0]?.invoice_number||null,bookings,entitlements});
 }catch(e){return out(['Order not found','Invalid credentials'].includes(e.message)?404:503,{error:'Order unavailable'})}
};
