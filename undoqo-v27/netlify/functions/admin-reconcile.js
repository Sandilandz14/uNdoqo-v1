/** Recover PayPal sandbox captures without initiating a new charge.
 * GET ?paypalOrderId=... previews remote capture; POST reconciles its existing completed capture.
 * Server-side admin secret required. PayPal status, custom_id, amount and currency are verified.
 */
const {out,env,token,paypal,getOrder,finalize}=require('./_lib/commerce');
const {permitted}=require('./_lib/admin-auth');
const idPattern=/^[A-Z0-9]{10,30}$/;
function completedCapture(remote,order){
 if(remote.purchase_units?.length!==1||remote.purchase_units[0].custom_id!==order.id)throw Error('PayPal order ownership mismatch');
 if(remote.purchase_units[0].amount?.currency_code!=='USD'||Number(remote.purchase_units[0].amount.value)!==Number(order.total_usd))throw Error('PayPal order amount mismatch');
 const captures=remote.purchase_units[0].payments?.captures||[];
 const completed=captures.filter(x=>x.status==='COMPLETED');
 if(remote.status!=='COMPLETED'||completed.length!==1||captures.length!==1)throw Error('Order has no single completed capture');
 const cap=completed[0];
 if(!cap.id||cap.amount?.currency_code!=='USD'||Number(cap.amount?.value)!==Number(order.total_usd))throw Error('Capture amount mismatch');
 return cap;
}
exports.handler=async event=>{
 if(!['GET','POST'].includes(event.httpMethod))return out(405,{error:'GET or POST required'});
 if(!permitted(event))return out(401,{error:'Unauthorized'});
 try{
  const input=event.httpMethod==='GET'?(event.queryStringParameters||{}):JSON.parse(event.body||'{}');
  const paypalOrderId=input.paypalOrderId;
  if(typeof paypalOrderId!=='string'||!idPattern.test(paypalOrderId))return out(400,{error:'Invalid PayPal order ID'});
  const cfg=env();if(cfg.mode!=='sandbox')return out(403,{error:'This recovery tool is sandbox-only'});
  const order=await getOrder(cfg,paypalOrderId);
  if(!['paid','pending'].includes(order.status))return out(409,{error:'Order cannot be reconciled'});
  const access=await token(cfg),remote=await paypal(cfg,access,'/v2/checkout/orders/'+paypalOrderId);
  let cap;
  try{cap=completedCapture(remote,order)}catch(e){return out(409,{error:'PayPal capture not eligible for reconciliation',remoteStatus:remote.status,orderStatus:order.status});}
  if(order.status==='paid'&&order.paypal_capture_id!==cap.id)return out(409,{error:'Capture conflicts with an already-paid order'});
  const summary={internalOrderId:order.id,paypalOrderId,orderStatus:order.status,captureId:cap.id,amount:cap.amount.value,currency:'USD',captureStatus:cap.status};
  if(event.httpMethod==='GET')return out(200,{eligible:true,...summary,operation:'Read-only preview. No capture initiated.'});
  // Strictly finalise an EXISTING completed capture; never call /capture.
  const result=await finalize(cfg,order,cap,paypalOrderId);
  return out(200,{reconciled:true,...summary,invoiceNumber:result.invoiceNumber});
 }catch(e){console.error('Admin reconciliation failure:',e.message);return out(503,{error:'Reconciliation could not be completed. Check server logs.'});}
};
module.exports.completedCapture=completedCapture;
