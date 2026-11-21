/** Secure checkout: frozen persisted orders, verified capture, idempotent fulfilment. */
const {crypto,out,env,itemsAndQuote,db,rpc,token,paypal,validateCustomer,getOrder,finalize}=require('./_lib/commerce');
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return out(405,{error:'POST required'});
 try{
  const cfg=env(); const input=JSON.parse(event.body||'{}');const action=input.action;
  if(action==='quote'){
   const q=itemsAndQuote(input.items,cfg);
   return out(200,{totalZar:q.totalZar,amount:q.amount,currency:'USD',usdPerZar:cfg.fx,clientId:cfg.id,mode:cfg.mode,rateSource:'merchant-configured',quotedAt:new Date().toISOString()});
  }
  if(action==='create'){
   validateCustomer(input.customer);const q=itemsAndQuote(input.items,cfg);
   const internalId=crypto.randomUUID(),receiptToken=crypto.randomBytes(32).toString('hex');
   await rpc(cfg,'commerce_create_order',{p_order_id:internalId,p_receipt_token_hash:crypto.createHash('sha256').update(receiptToken).digest('hex'),p_name:input.customer.name.trim(),p_email:input.customer.email.trim().toLowerCase(),p_notes:input.customer.notes||'',p_items:q.frozen,p_zar:q.totalZar,p_usd:q.amount,p_rate:cfg.fx});
   const access=await token(cfg);
   const order=await paypal(cfg,access,'/v2/checkout/orders','POST',{intent:'CAPTURE',purchase_units:[{custom_id:internalId,description:'uNdoqo order',amount:{currency_code:'USD',value:q.amount}}]},'create-'+internalId);
   await db(cfg,'orders',{method:'PATCH',query:'?id=eq.'+internalId+'&status=eq.pending&paypal_order_id=is.null',body:{paypal_order_id:order.id}});
   return out(200,{id:order.id,internalOrderId:internalId,receiptToken});
  }
  if(action==='capture'){
   const order=await getOrder(cfg,input.orderId);const access=await token(cfg);
   const current=await paypal(cfg,access,'/v2/checkout/orders/'+input.orderId);
   const captureOf=o=>o.purchase_units?.flatMap(u=>u.payments?.captures||[]).find(c=>c.status==='COMPLETED');
   if(current.purchase_units?.[0]?.custom_id!==order.id)throw Error('PayPal order does not match stored order');
   if(current.status==='COMPLETED'){
    const cap=captureOf(current);if(!cap)throw Error('Missing completed capture');return out(200,await finalize(cfg,order,cap,input.orderId));
   }
   if(current.status!=='APPROVED')throw Error('PayPal order not approved');
   const amount=current.purchase_units?.[0]?.amount;
   if(amount?.currency_code!=='USD'||Number(amount.value)!==Number(order.total_usd)||current.purchase_units?.[0]?.custom_id!==order.id)throw Error('PayPal order does not match stored order');
   const done=await paypal(cfg,access,'/v2/checkout/orders/'+input.orderId+'/capture','POST',null,'capture-'+order.id);
   if(done.status!=='COMPLETED')throw Error('PayPal capture not completed');
   const cap=captureOf(done);return out(200,await finalize(cfg,order,cap,input.orderId));
  }
  return out(400,{error:'Unknown checkout action'});
 }catch(e){const message=e.message||'Checkout unavailable';console.error('Checkout failure:',message);return out(/Invalid|not approved|not match|Unknown|outside|Order not found|duplicate|Missing completed/.test(message)?400:503,{error:message})}
};
