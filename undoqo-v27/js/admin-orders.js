(()=>{'use strict';
const key=()=>document.getElementById('admin-key').value;
const rows=document.getElementById('admin-rows'),status=document.getElementById('admin-status');
async function api(endpoint,method='GET',body){
 const response=await fetch('/.netlify/functions/'+endpoint,{method,headers:{'x-admin-key':key(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');return data;
}
document.getElementById('admin-form').addEventListener('submit',async e=>{
 e.preventDefault();status.textContent='Loading records…';rows.replaceChildren();
 try{const data=await api('admin-orders');for(const o of data.orders){const tr=document.createElement('tr');for(const val of [new Date(o.createdAt).toLocaleString(),o.customer?(o.customer.full_name+' ('+o.customer.email+')'):'—',o.status,'R '+Number(o.totalZar).toFixed(2),'$ '+Number(o.totalUsd).toFixed(2),o.invoiceNumber||'—',o.id]){const td=document.createElement('td');td.textContent=val;tr.appendChild(td)}rows.appendChild(tr)}status.textContent=data.orders.length+' recent orders loaded';}catch(err){status.textContent=err.message}
});
let preview=null;const message=document.getElementById('recovery-detail'),reconcile=document.getElementById('reconcile-button');
document.getElementById('recovery-form').addEventListener('submit',async e=>{
 e.preventDefault();preview=null;reconcile.disabled=true;reconcile.hidden=true;message.textContent='Looking up the existing PayPal capture…';
 try{const id=document.getElementById('recover-id').value.trim();const data=await api('admin-reconcile?paypalOrderId='+encodeURIComponent(id));preview=data;message.textContent=`PayPal: ${data.paypalOrderId} · Captured: ${data.amount} ${data.currency} · Capture ID: ${data.captureId} · Supabase status: ${data.orderStatus}`;reconcile.hidden=data.orderStatus!=='pending';reconcile.disabled=data.orderStatus!=='pending';}
 catch(err){message.textContent=err.message}
});
reconcile.addEventListener('click',async()=>{
 if(!preview||preview.orderStatus!=='pending'||!window.confirm('Reconcile this EXISTING completed sandbox capture? No new payment will be initiated.'))return;
 reconcile.disabled=true;message.textContent='Reconciling the verified capture…';
 try{const data=await api('admin-reconcile','POST',{paypalOrderId:preview.paypalOrderId});message.textContent=`Reconciled. Invoice ${data.invoiceNumber}. Capture ${data.captureId}. Refresh the order list.`;preview=null;reconcile.hidden=true;}
 catch(err){message.textContent=err.message;reconcile.disabled=false}
});
const assetStatus=document.getElementById('asset-status');
document.getElementById('asset-form').addEventListener('submit',async e=>{
 e.preventDefault();assetStatus.textContent='Checking private storage and registering disabled asset…';
 try{const data=await api('admin-assets','POST',{action:'register',productId:document.getElementById('asset-id').value.trim(),path:document.getElementById('asset-path').value.trim(),displayName:document.getElementById('asset-name').value.trim()});assetStatus.textContent=`Registered ${data.productId} disabled. Confirm licence and file contents before activation.`}
 catch(err){assetStatus.textContent=err.message}
});
document.getElementById('activate-form').addEventListener('submit',async e=>{
 e.preventDefault();const productId=document.getElementById('activate-id').value.trim();if(!window.confirm('Confirm you have distribution rights, the PDF is correct, and it may be delivered to previous paid customers?'))return;
 assetStatus.textContent='Verifying file and activating entitled purchases…';
 try{const data=await api('admin-assets','POST',{action:'activate',productId});assetStatus.textContent=`Activated ${data.productId}; ${data.entitlementsActivated} paid entitlements enabled. Customers can now refresh their order status.`}
 catch(err){assetStatus.textContent=err.message}
});
})();
