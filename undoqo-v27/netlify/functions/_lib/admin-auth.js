'use strict';
const crypto=require('node:crypto');
function permitted(event){
 const secret=process.env.UNDOQO_ADMIN_API_KEY||'';
 const submitted=event.headers?.['x-admin-key']||event.headers?.['X-Admin-Key']||'';
 if(typeof submitted!=='string'||secret.length<32||submitted.length!==secret.length)return false;
 return crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(submitted));
}
module.exports={permitted};
