/** Private browser status read, protected by independent random receipt token. */
const {crypto,out,env,db}=require('./_lib/commerce');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const cfg=env();const {internalOrderId,receiptToken}=JSON.parse(event.body||'{}');
  if(!/^[0-9a-f-]{36}$/i.test(internalOrderId||'')||!/^[0-9a-f]{64}$/.test(receiptToken||''))return out(400,{error:'Invalid order credentials'});
  const rows=await db(cfg,'orders',{query:'?id=eq.'+internalOrderId+'&select=id,status,total_zar,total_usd,paypal_order_id,receipt_token_hash'});
  const row=rows?.[0];const submitted=crypto.createHash('sha256').update(receiptToken).digest('hex');
  if(!row||!crypto.timingSafeEqual(Buffer.from(row.receipt_token_hash,'hex'),Buffer.from(submitted,'hex')))return out(404,{error:'Order not found'});
  const invoices=await db(cfg,'invoices',{query:'?order_id=eq.'+internalOrderId+'&select=invoice_number,issued_at'});
  const bookings=await db(cfg,'bookings',{query:'?order_id=eq.'+internalOrderId+'&select=product_id,status,scheduled_at'});
  const entitlements=await db(cfg,'digital_entitlements',{query:'?order_id=eq.'+internalOrderId+'&select=product_id,status'});
  return out(200,{orderId:row.id,status:row.status,totalZar:row.total_zar,totalUsd:row.total_usd,invoiceNumber:invoices?.[0]?.invoice_number||null,bookings,entitlements});
 }catch(e){console.error('Order status failed',e.message);return out(503,{error:'Order status unavailable'})}
};
