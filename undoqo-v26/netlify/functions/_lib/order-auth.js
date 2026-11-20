'use strict';
const {crypto,db}=require('./commerce');
async function authorizedOrder(cfg,body){
 const {internalOrderId,receiptToken}=body||{};
 if(typeof internalOrderId!=='string'||!/^[0-9a-f-]{36}$/i.test(internalOrderId)||typeof receiptToken!=='string'||!/^[0-9a-f]{64}$/.test(receiptToken))throw Error('Invalid credentials');
 const rows=await db(cfg,'orders',{query:'?id=eq.'+encodeURIComponent(internalOrderId)+'&select=*'});
 const row=rows?.[0],hash=crypto.createHash('sha256').update(receiptToken).digest();
 if(!row||typeof row.receipt_token_hash!=='string'||!/^[0-9a-f]{64}$/i.test(row.receipt_token_hash)||!crypto.timingSafeEqual(Buffer.from(row.receipt_token_hash,'hex'),hash))throw Error('Order not found');
 return row;
}
module.exports={authorizedOrder};
