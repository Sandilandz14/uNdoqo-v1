/** Recover paid invoice from database, with verified capture; no browser pricing trusted. */
const {out,env,db}=require('./_lib/commerce');const {authorizedOrder}=require('./_lib/order-auth');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const cfg=env(),row=await authorizedOrder(cfg,JSON.parse(event.body||'{}'));
  if(row.status!=='paid')return out(403,{error:'No paid invoice'});
  const id=encodeURIComponent(row.id);
  const [invoices,items,payments,customers]=await Promise.all([
   db(cfg,'invoices',{query:'?order_id=eq.'+id+'&select=invoice_number,issued_at,amount_zar,amount_usd'}),
   db(cfg,'order_items',{query:'?order_id=eq.'+id+'&select=title,quantity,unit_price_zar'}),
   db(cfg,'payments',{query:'?order_id=eq.'+id+'&select=provider_capture_id,amount,currency,raw_status'}),
   db(cfg,'customers',{query:'?id=eq.'+encodeURIComponent(row.customer_id)+'&select=full_name,email'})]);
  if(invoices?.length!==1||payments?.length!==1||customers?.length!==1||payments[0].raw_status!=='COMPLETED'||payments[0].provider_capture_id!==row.paypal_capture_id||Number(payments[0].amount)!==Number(row.total_usd))throw Error('Reconciliation failed');
  return out(200,{invoiceNumber:invoices[0].invoice_number,issuedAt:invoices[0].issued_at,customer:customers[0],orderId:row.id,totalZar:row.total_zar,totalUsd:row.total_usd,captureId:row.paypal_capture_id,items});
 }catch(e){return out(503,{error:'Invoice unavailable'})}
};
