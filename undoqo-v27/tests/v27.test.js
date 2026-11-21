const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const recover=require('../netlify/functions/admin-reconcile');
const asset=require('../netlify/functions/admin-assets');
const cap={id:'CAPTURE001',status:'COMPLETED',amount:{currency_code:'USD',value:'100.35'}};
const remote={status:'COMPLETED',purchase_units:[{custom_id:'internal-1',amount:{currency_code:'USD',value:'100.35'},payments:{captures:[cap]}}]};
const order={id:'internal-1',total_usd:100.35};
test('admin recovery requires admin key',async()=>{const r=await recover.handler({httpMethod:'GET',headers:{},queryStringParameters:{paypalOrderId:'1234567890'}});assert.equal(r.statusCode,401)});
test('recovery refuses mismatched owner and amounts',()=>{assert.throws(()=>recover.completedCapture({...remote,purchase_units:[{...remote.purchase_units[0],custom_id:'wrong'}]},order));assert.throws(()=>recover.completedCapture(remote,{...order,total_usd:99}))});
test('recovery refuses noncaptured orders and multiple captures',()=>{assert.throws(()=>recover.completedCapture({...remote,status:'APPROVED'},order));assert.throws(()=>recover.completedCapture({...remote,purchase_units:[{...remote.purchase_units[0],payments:{captures:[cap,cap]}}]},order))});
test('recovery accepts only matching captured order',()=>{assert.equal(recover.completedCapture(remote,order).id,'CAPTURE001')});
test('recovery source never calls PayPal capture operation',()=>{const s=read('netlify/functions/admin-reconcile.js');assert.doesNotMatch(s,/paypal\([^\n]+['"]POST['"]/);assert.doesNotMatch(s,/\/capture['"]/);assert.match(s,/finalize\(cfg,order,cap,paypalOrderId\)/)});
test('asset registration validates catalogue and paths',()=>{assert.equal(asset.validProduct('book-011'),true);assert.equal(asset.validProduct('consult-2h'),false);assert.equal(asset.validPath('books/book-011.pdf'),true);for(const value of ['../secret.pdf','books/../../secret.pdf','books/bad.jpg','https://elsewhere/file.pdf'])assert.equal(asset.validPath(value),false)});
test('asset mutation requires admin secret',async()=>{const r=await asset.handler({httpMethod:'POST',headers:{},body:'{}'});assert.equal(r.statusCode,401)});
test('asset activation checks uploaded PDF before enabling',()=>{const s=read('netlify/functions/admin-assets.js');assert.match(s,/verifiedStorage\(cfg,rows\[0\]\.storage_path\)/);assert.match(s,/commerce_activate_asset/)});
test('original navigation and Contact form retained',()=>{const c=read('pages/contact.html'),admin=read('pages/orders-admin.html');for(const item of ['ABOUT US','COURSES','CONSULTATIONS','MEDIA','BOOKSTORE','REPOSITORY','CONTACT'])assert.ok(admin.includes(item));assert.match(c,/PROGRAMME OF INTEREST/i)});
test('sandbox recovery previews existing capture and finalizes without new PayPal charge',async()=>{
 const original=global.fetch;
 const saved={PAYPAL_CLIENT_ID:process.env.PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET:process.env.PAYPAL_CLIENT_SECRET,PAYPAL_MODE:process.env.PAYPAL_MODE,PAYPAL_USD_PER_ZAR:process.env.PAYPAL_USD_PER_ZAR,SUPABASE_URL:process.env.SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,UNDOQO_ADMIN_API_KEY:process.env.UNDOQO_ADMIN_API_KEY};
 Object.assign(process.env,{PAYPAL_CLIENT_ID:'sandbox-client',PAYPAL_CLIENT_SECRET:'sandbox-secret',PAYPAL_MODE:'sandbox',PAYPAL_USD_PER_ZAR:'0.05',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service-key',UNDOQO_ADMIN_API_KEY:'A'.repeat(48)});
 const paypalOrderId='1XF675336S976931';
 const requests=[];
 global.fetch=async(url,opts={})=>{
  requests.push({url,method:opts.method||'GET',body:opts.body});
  const payload=url.includes('rest/v1/orders')?[{id:'internal-1',status:'pending',total_usd:100.35,paypal_order_id:paypalOrderId}]:url.includes('oauth2/token')?{access_token:'bearer'}:url.includes('/v2/checkout/orders/')?remote:url.includes('rpc/commerce_finalize_capture')?'STU-2026-000006':{};
  return {ok:true,status:200,async text(){return JSON.stringify(payload)},async json(){return payload}};
 };
 try{
  const headers={'x-admin-key':'A'.repeat(48)};
  const preview=await recover.handler({httpMethod:'GET',headers,queryStringParameters:{paypalOrderId}});
  assert.equal(preview.statusCode,200);assert.equal(JSON.parse(preview.body).captureId,cap.id);
  assert.equal(requests.filter(r=>r.url.includes('rpc/commerce_finalize_capture')).length,0);
  const saved=await recover.handler({httpMethod:'POST',headers,body:JSON.stringify({paypalOrderId})});
  assert.equal(saved.statusCode,200);assert.equal(JSON.parse(saved.body).invoiceNumber,'STU-2026-000006');
  assert.equal(requests.filter(r=>r.url.includes('rpc/commerce_finalize_capture')).length,1);
  assert.equal(requests.filter(r=>r.url.includes('/capture')).length,0);
 }finally{global.fetch=original;for(const [k,v] of Object.entries(saved))if(v===undefined)delete process.env[k];else process.env[k]=v}
});
