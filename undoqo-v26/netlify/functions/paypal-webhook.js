/** Subscribe to PAYMENT.CAPTURE.COMPLETED in PayPal app settings. */
const {out,env,db,token,paypal,getOrder,finalize}=require('./_lib/commerce');
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const cfg=env(),webhookId=process.env.PAYPAL_WEBHOOK_ID;
  if(!webhookId)return out(503,{error:'Webhook not configured'});
  const body=JSON.parse(event.body||'{}');
  const h=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),v]));
  const required=['paypal-transmission-id','paypal-transmission-time','paypal-transmission-sig','paypal-auth-algo','paypal-cert-url'];
  if(required.some(k=>!h[k]))return out(400,{error:'Missing PayPal signature headers'});
  const access=await token(cfg);
  const verified=await paypal(cfg,access,'/v1/notifications/verify-webhook-signature','POST',{
   transmission_id:h['paypal-transmission-id'],transmission_time:h['paypal-transmission-time'],transmission_sig:h['paypal-transmission-sig'],auth_algo:h['paypal-auth-algo'],cert_url:h['paypal-cert-url'],webhook_id:webhookId,webhook_event:body
  });
  if(verified.verification_status!=='SUCCESS')return out(401,{error:'Invalid PayPal webhook signature'});
  if(body.event_type!=='PAYMENT.CAPTURE.COMPLETED')return out(200,{accepted:true,ignored:true});
  const orderId=body.resource?.supplementary_data?.related_ids?.order_id;
  if(!orderId)return out(400,{error:'Missing related PayPal order'});
  const order=await getOrder(cfg,orderId);
  // Look up PayPal's canonical order instead of trusting the webhook amount.
  const remote=await paypal(cfg,access,'/v2/checkout/orders/'+orderId);
  if(remote.status!=='COMPLETED'||remote.purchase_units?.[0]?.custom_id!==order.id)throw Error('Webhook PayPal order mismatch');
  const cap=remote.purchase_units?.flatMap(u=>u.payments?.captures||[]).find(c=>c.id===body.resource.id && c.status==='COMPLETED');
  if(!cap)throw Error('Capture not found in PayPal order');
  const result=await finalize(cfg,order,cap,orderId);
  if(body.id && typeof body.id==='string')await db(cfg,'paypal_webhook_events',{method:'POST',query:'?on_conflict=event_id',body:{event_id:body.id,event_type:body.event_type}}).catch(e=>{console.error('Webhook event audit failed',e.message)});
  return out(200,{accepted:true,invoiceNumber:result.invoiceNumber});
 }catch(e){console.error('Webhook reconciliation error',e.message);return out(500,{error:'Webhook reconciliation failed'});} // non-2xx -> PayPal retries
};
