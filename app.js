const C=window.ROHN_CONFIG||{}, live=!!(C.url&&C.publishableKey);
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const iso=()=>new Date().toISOString().slice(0,10), uid=()=>crypto.randomUUID(), date=s=>s?new Date(s+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}):'—';
const statusNames={draft:'ฉบับร่าง',sent:'ส่งแล้ว',accepted:'ตอบรับ',rejected:'ไม่รับข้อเสนอ'};
const baseTerms='1. ผู้ว่าจ้างจัดเตรียมเจ้าหน้าที่อาสาสมัครสำหรับถือสมาร์ตโฟนประจำจุดสแกน ทีมงาน ROHN ฝึกอบรมการใช้งานก่อนเริ่มการแข่งขัน\n2. ผู้ว่าจ้างส่งโลโก้งาน สปอนเซอร์ และข้อกำหนด BIB อย่างน้อย 15 วันทำการก่อนวันกำหนดส่งพิมพ์\n3. กรณีจัดงานนอกพื้นที่ให้บริการหลัก ผู้ว่าจ้างรับผิดชอบค่าเดินทางและที่พักตามที่ตกลง';
const defaultServices=[
  {id:'srv-1',category:'ระบบหลัก & Cloud',title:'ROHN System Base License & Cloud Infrastructure',description:'สิทธิ์ใช้งานระบบ 1 งานแข่งขัน; บันทึกผลแบบ Offline-First และซิงก์ขึ้น Cloud อัตโนมัติ',default_quantity:1,unit:'งาน',unit_price:4500},
  {id:'srv-2',category:'ระบบหลัก & Cloud',title:'Lap Counting & Multi-Checkpoint Engine',description:'นับรอบอัตโนมัติ ป้องกันการสแกนซ้ำ และคำนวณ Pace / Split Time',default_quantity:1,unit:'งาน',unit_price:2500},
  {id:'srv-3',category:'ประมวลผลนักวิ่ง',title:'Per-Runner Processing & BYOD Scanner Service',description:'นำเข้าฐานข้อมูลผู้แข่งขัน ผูกรหัส Barcode / QR และสแกนจุดปล่อยตัว/เส้นชัย/จุดตรวจ',default_quantity:400,unit:'คน',unit_price:18},
  {id:'srv-4',category:'กราฟิก & สื่อประชาสัมพันธ์',title:'BIB Graphic Design & Production Asset',description:'ออกแบบป้าย BIB ตามธีมงาน พร้อมไฟล์เวกเตอร์สำหรับพิมพ์',default_quantity:1,unit:'งาน',unit_price:2500},
  {id:'srv-5',category:'กราฟิก & สื่อประชาสัมพันธ์',title:'Post-Race Infographic Summary Design',description:'ภาพสรุปสถิติการแข่งขันสำหรับสื่อสังคม ส่งมอบภายใน 24–48 ชม.',default_quantity:1,unit:'งาน',unit_price:1500},
  {id:'srv-6',category:'ระบบหลัก & Cloud',title:'Live Leaderboard & Public Results Portal',description:'แดชบอร์ดการแข่งขันและเว็บค้นหาผลสำหรับนักวิ่ง/กองเชียร์',default_quantity:1,unit:'ระบบ',unit_price:0},
  {id:'srv-7',category:'บุคลากรหน้างาน',title:'On-Site Technical Specialist',description:'ทีมเทคนิคดูแลหน้างานและส่งออกรายงาน Excel / PDF',default_quantity:1,unit:'วัน',unit_price:6000}
];

const defaultPromotions=[
  {id:'promo-1',code:'ROHN-NEW2026',name:'ส่วนลดลูกค้ารายใหม่ (New Client)',type:'fixed',value:2000,description:'ลดทันที 2,000 บาท สำหรับผู้จัดงานที่ร่วมงานกับ ROHN เป็นครั้งแรก',active:true},
  {id:'promo-2',code:'EARLYBIRD-10',name:'Early Bird จองล่วงหน้า 30 วัน',type:'percent',value:10,description:'รับส่วนลด 10% จากยอดรวมบริการ เมื่อยืนยันการจองล่วงหน้าอย่างน้อย 30 วัน',active:true},
  {id:'promo-3',code:'FULL-PACKAGE-5K',name:'แพ็กเกจเหมาครบวงจร (Full Timing Suite)',type:'fixed',value:5000,description:'ลด 5,000 บาท เมื่องานเลือกใช้งานระบบ Cloud + ออกแบบ BIB + บุคลากรหน้างานครบชุด',active:true}
];

const servicesKey='rohn-services-v1';
const promosKey='rohn-promotions-v1';
let storedServices;try{storedServices=JSON.parse(localStorage.getItem(servicesKey))}catch{}
if(!Array.isArray(storedServices)||!storedServices.length)storedServices=structuredClone(defaultServices);

let storedPromotions;try{storedPromotions=JSON.parse(localStorage.getItem(promosKey))}catch{}
if(!Array.isArray(storedPromotions)||!storedPromotions.length)storedPromotions=structuredClone(defaultPromotions);

const sampleItems=()=>storedServices.map((s,sort_order)=>({id:uid(),sort_order,title:s.title,description:s.description,quantity:s.default_quantity||1,unit:s.unit||'งาน',unit_price:s.unit_price}));
const fresh=()=>({id:uid(),quote_no:`QT-ROHN-${iso().replaceAll('-','')}-${Math.floor(Math.random()*900+100)}`,title:'ROHN Timing System',issue_date:iso(),valid_until:'',event_date:'',status:'draft',client_id:'',seller_name:'ROHN Timing System',seller_address:'',seller_phone:'',seller_email:'',seller_tax_id:'',discount:0,tax_percent:0,promotion_id:'',promotion_name:'',public_terms:baseTerms,public_note:'',items:sampleItems(),internal:{rnd_percent:15,team_members:3,estimated_cost:0,private_note:''}});
const demoKey='rohn-business-plan-demo-v1';let demo;try{demo=JSON.parse(localStorage.getItem(demoKey))||{clients:[],quotes:[]}}catch{demo={clients:[],quotes:[]}}
if(!demo.clients)demo.clients=[];
if(!demo.quotes)demo.quotes=[];
if(demo.clients.length===0&&demo.quotes.length===0){
  const sampleClientId=uid();
  const sampleClient={id:sampleClientId,name:'บริษัท ไทย มาราธอน อีเวนต์ จำกัด',contact_name:'คุณสมชาย ใจดี',phone:'081-234-5678',email:'contact@thaimarathon.example.com',tax_id:'0105559876543',address:'123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'};
  const sampleQuote={...fresh(),quote_no:'QT-ROHN-20260925-101',title:'ระบบบันทึกเวลาการแข่งขันวิ่ง Bangsaen 21K 2026',status:'draft',client_id:sampleClientId,event_date:'2026-11-15',seller_name:'ROHN Timing System',seller_address:'อาคารเทคโนโลยีสารสนเทศ แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',seller_phone:'02-999-8888',seller_email:'hello@rohn-timing.example',seller_tax_id:'0105551234567',discount:500,tax_percent:7};
  demo.clients.push(sampleClient);
  demo.quotes.push(sampleQuote);
  try{localStorage.setItem(demoKey,JSON.stringify(demo))}catch{}
}
const state={view:'dashboard',clients:[],quotes:[],services:storedServices,promotions:storedPromotions,servicesTab:'services',servicesSearch:'',current:null,session:null,profile:null,search:'',isDemo:false};
const persist=()=>localStorage.setItem(demoKey,JSON.stringify(demo));
const persistServices=()=>{try{localStorage.setItem(servicesKey,JSON.stringify(state.services))}catch{}};
const persistPromotions=()=>{try{localStorage.setItem(promosKey,JSON.stringify(state.promotions))}catch{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function showAuthLoader({text='กำลังตรวจสอบข้อมูลความปลอดภัย...',sub='กรุณารอสักครู่ กำลังเตรียมพื้นที่ทำงาน',percent=15}={}){
  const loader=$('#auth-loader');
  if(!loader)return;
  loader.classList.remove('leaving');
  loader.hidden=false;
  updateAuthLoader({text,sub,percent});
}
function updateAuthLoader({text,sub,percent}={}){
  if(text!==undefined){const el=$('#auth-loader-text');if(el)el.textContent=text}
  if(sub!==undefined){const el=$('#auth-loader-sub');if(el)el.textContent=sub}
  if(percent!==undefined){const el=$('#auth-loader-bar');if(el)el.style.width=`${Math.min(100,Math.max(0,percent))}%`}
}
async function hideAuthLoader(delay=350){
  const loader=$('#auth-loader');
  if(!loader)return;
  loader.classList.add('leaving');
  await sleep(delay);
  loader.hidden=true;
  loader.classList.remove('leaving');
}
function totals(q){let sub=q.items.reduce((s,i)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0);let after=Math.max(0,sub-Number(q.discount||0)),tax=after*Number(q.tax_percent||0)/100;return {sub,tax,total:after+tax}}
function notice(message){$('#notice').textContent=message;$('#notice').hidden=false;setTimeout(()=>$('#notice').hidden=true,6000)}
function modal(html){$('#modal-content').innerHTML=html;$('#modal').hidden=false}function closeModal(){$('#modal').hidden=true}
async function endpoint(input,session=state.session){const r=await fetch(`${C.url.replace(/\/$/,'')}/functions/v1/rohn-username-login`,{method:'POST',headers:{apikey:C.publishableKey,'Content-Type':'application/json',...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body:JSON.stringify(input)});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.message||'Request failed');return data}
async function api(table,method='GET',query='',body){return endpoint({action:'data',table,method,query,body})}
async function run(fn){try{return await fn()}catch(e){notice(e.message);return null}}
async function loginWithUsername(username,password){
  return endpoint({action:'login',username,password},null);
}
async function load(){
  if(!live||state.isDemo){state.clients=demo.clients;state.quotes=demo.quotes;render();return}
  if(!state.session){renderAuth();return}
  let result=await run(async()=>{
    const profile=await endpoint({action:'profile'});
    let [clients,quotes,items,internals]=await Promise.all([api('rohn_clients','GET','select=*&order=name.asc'),api('rohn_quotes','GET','select=*&order=issue_date.desc'),api('rohn_quote_items','GET','select=*&order=sort_order.asc'),api('rohn_quote_internal')]);
    return {profile,clients,quotes:quotes.map(q=>({...q,items:items.filter(i=>i.quote_id===q.id),internal:internals.find(i=>i.quote_id===q.id)||{rnd_percent:15,team_members:3,estimated_cost:0,private_note:''}}))};
  });
  if(result){state.profile=result.profile;state.clients=result.clients;state.quotes=result.quotes;render()}
  else{state.session=null;state.profile=null;localStorage.removeItem('rohn-session');renderAuth()}
}
function renderAuth(){
  state.view='login';$('#page-title').textContent='เข้าสู่ระบบ';$('#page-subtitle').textContent='เข้าใช้งานระบบใบเสนอราคา ROHN';
  $('#content').innerHTML=`<div class="panel login-panel" style="max-width:460px;padding:34px 30px;margin:6vh auto"><div style="text-align:center;margin-bottom:20px"><div class="logo-mark glow" style="margin:0 auto 12px;width:48px;height:48px;font-size:28px">R</div><h2 style="margin:0 0 6px">ยินดีต้อนรับสู่ ROHN</h2><p class="tiny" style="margin:0">ลงชื่อเข้าใช้ด้วย username และรหัสผ่านตัวเลข 8 หลัก</p></div><form id="login-form" class="form-grid"><label class="field span2">Username<input name="username" required autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="เช่น UN_HEAD"></label><label class="field span2">Password<input name="password" type="password" required minlength="8" maxlength="8" pattern="[0-9]{8}" inputmode="numeric" autocomplete="current-password" placeholder="รหัสผ่านตัวเลข 8 หลัก"></label><button class="primary span2" id="login-submit-btn" style="height:44px;display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px"><span class="btn-text">เข้าสู่ระบบ</span></button><div style="text-align:center;margin-top:16px;grid-column:1/-1;border-top:1px solid #2e2f3e;padding-top:16px"><span class="tiny">หรือเข้าสู่ระบบแบบไม่ต้องใช้รหัสผ่าน:</span><br><button type="button" class="secondary" id="demo-mode-btn" style="margin-top:10px;width:100%;padding:11px">ทดลองใช้งานโหมดตัวอย่าง (Demo Mode)</button></div></form></div>`;
  $('#new-quote').hidden=true;$('#signout').hidden=true;$('#user-badge').textContent='PRIVATE';
}
function render(){
  if(live&&!state.isDemo&&!state.session){renderAuth();return}
  $('#new-quote').hidden=state.view==='profile';$('#signout').hidden=false;
  $('#mode-label').textContent=(live&&!state.isDemo)?'เชื่อมต่อ Supabase':'ตัวอย่าง · เก็บในเบราว์เซอร์';
  $('#user-badge').textContent=(live&&!state.isDemo)?(state.profile?.username||'ACCOUNT'):(state.profile?.username||'DEMO');
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===state.view));
  let titles={dashboard:['ภาพรวมธุรกิจ','ติดตามใบเสนอราคาและงบประมาณล่าสุด'],quotes:['ใบเสนอราคาทั้งหมด','จัดการข้อเสนอ ตั้งแต่ฉบับร่างจนถึงการตอบรับ'],services:['บริการ & โปรโมชั่น','จัดการรายการบริการมาตรฐาน ราคาเริ่มต้น และแคมเปญส่วนลด'],clients:['ข้อมูลลูกค้า','เก็บข้อมูลติดต่อสำหรับออกใบเสนอราคา'],editor:['จัดทำใบเสนอราคา','แก้ไขข้อมูลและวางแผนงบประมาณภายใน'],profile:['โปรไฟล์','จัดการชื่อผู้ใช้และรหัสผ่านของคุณ']};
  let [title,sub]=titles[state.view]||titles.dashboard;$('#page-title').textContent=title;$('#page-subtitle').textContent=sub;
  $('#content').innerHTML=state.view==='dashboard'?dashboard():state.view==='quotes'?quotesView():state.view==='services'?servicesView():state.view==='clients'?clientsView():state.view==='profile'?profileView():editorView();
  if(state.view==='editor')recalc();
}
function profileView(){
  if(!live||state.isDemo)return '<div class="box"><h2>โปรไฟล์</h2><p>ตัวอย่างในเบราว์เซอร์ไม่มีบัญชีผู้ใช้</p></div>';
  return `<div class="profile-layout"><div class="box"><h2>ชื่อผู้ใช้</h2><p class="tiny">สิทธิ์: ${state.profile?.role==='admin'?'ผู้ดูแลระบบ':'ผู้พัฒนา'} · ใช้ username นี้เข้าระบบครั้งถัดไป</p><form id="username-form" class="form-grid"><label class="field span2">Username<input name="username" required minlength="3" maxlength="32" pattern="[A-Za-z][A-Za-z0-9_-]{2,31}" value="${esc(state.profile?.username)}" autocapitalize="none" spellcheck="false"></label><button class="primary">บันทึกชื่อผู้ใช้</button></form></div><div class="box"><h2>เปลี่ยนรหัสผ่าน</h2><p class="tiny">กรอกรหัสเดิมเพื่อยืนยัน แล้วเข้าสู่ระบบใหม่ด้วยรหัสตัวเลข 8 หลัก</p><form id="password-form" class="form-grid"><label class="field span2">รหัสผ่านปัจจุบัน<input name="current" type="password" required autocomplete="current-password"></label><label class="field span2">รหัสผ่านใหม่<input name="next" type="password" required minlength="8" maxlength="8" pattern="[0-9]{8}" inputmode="numeric" autocomplete="new-password"></label><label class="field span2">ยืนยันรหัสผ่านใหม่<input name="confirm" type="password" required minlength="8" maxlength="8" pattern="[0-9]{8}" inputmode="numeric" autocomplete="new-password"></label><button class="primary">เปลี่ยนรหัสผ่าน</button></form></div></div>`;
}
async function saveUsername(form){
  const username=form.elements.username.value.trim();
  if(!/^[A-Za-z][A-Za-z0-9_-]{2,31}$/.test(username)){notice('Username ต้องมี 3–32 ตัว ใช้อักษรอังกฤษ ตัวเลข _ หรือ -');return}
  const profile=await run(()=>endpoint({action:'username',username}));
  if(profile){state.profile=profile;render();notice('เปลี่ยน username แล้ว')}
}
async function savePassword(form){
  const {current,next,confirm:confirmation}=Object.fromEntries(new FormData(form));
  if(!/^[0-9]{8}$/.test(next)||next!==confirmation){notice('รหัสผ่านใหม่ต้องเป็นตัวเลข 8 หลัก และยืนยันให้ตรงกัน');return}
  if(current===next){notice('กรุณาตั้งรหัสผ่านใหม่ให้ต่างจากเดิม');return}
  const changed=await run(()=>endpoint({action:'password',current,next}));
  if(changed){state.session=null;state.profile=null;localStorage.removeItem('rohn-session');renderAuth();notice('เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่')}
}
function summaryRows(quotes){return quotes.map(q=>{const c=state.clients.find(c=>c.id===q.client_id);return `<tr><td><strong>${esc(q.quote_no)}</strong><small>${esc(q.title)}</small></td><td>${esc(c?.name||'ยังไม่ระบุลูกค้า')}</td><td>${date(q.issue_date)}</td><td><span class="pill ${esc(q.status)}">${statusNames[q.status]||esc(q.status)}</span></td><td><strong>฿${money(totals(q).total)}</strong></td><td><div class="row-actions"><button data-action="edit" data-id="${q.id}" title="แก้ไข">แก้ไข</button><button data-action="preview" data-id="${q.id}" title="พิมพ์">พิมพ์</button></div></td></tr>`}).join('')}
const tableRows=rows=>`<div class="panel table-wrap"><table><thead><tr><th>เลขที่ / โครงการ</th><th>ลูกค้า</th><th>วันที่ออก</th><th>สถานะ</th><th>ยอดเสนอ</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="6" class="empty"><b>ยังไม่มีใบเสนอราคา</b>เริ่มสร้างใบแรกได้จากปุ่มมุมขวาบน</td></tr>'}</tbody></table></div>`;
function dashboard(){let qs=state.quotes, total=qs.filter(q=>q.status==='accepted').reduce((s,q)=>s+totals(q).total,0);return `<div class="hero"><div><div class="eyebrow">QUOTATION WORKSPACE</div><h2>จัดการใบเสนอราคาอย่างเป็นระบบ</h2><p>วางแผนราคาขายและงบทีมส่วนตัว ก่อนเปิดตัวอย่างเอกสารที่พร้อมส่งลูกค้า</p></div><div class="hero-icon">◈</div></div><div class="stats"><div class="card"><div class="card-label">ใบเสนอราคาทั้งหมด</div><div class="card-value">${qs.length}</div><div class="card-hint">เอกสารในระบบ</div></div><div class="card"><div class="card-label">ร่าง / รอส่ง</div><div class="card-value accent">${qs.filter(x=>x.status==='draft').length}</div><div class="card-hint">แก้ไขและตรวจทาน</div></div><div class="card"><div class="card-label">ตอบรับแล้ว</div><div class="card-value mint">${qs.filter(x=>x.status==='accepted').length}</div><div class="card-hint">งานที่ตกลงแล้ว</div></div><div class="card"><div class="card-label">มูลค่างานตอบรับ</div><div class="card-value">฿${money(total)}</div><div class="card-hint">รวมจากใบเสนอราคาที่ตอบรับ</div></div></div><div class="section-heading"><h2>เอกสารล่าสุด</h2><button class="text-button" data-action="navigate" data-view="quotes">ดูทั้งหมด →</button></div>${tableRows(summaryRows(qs.slice(0,5)))}`}
function quotesView(){let search=state.search.toLowerCase(),qs=state.quotes.filter(q=>q.quote_no.toLowerCase().includes(search)||q.title.toLowerCase().includes(search)||state.clients.find(c=>c.id===q.client_id)?.name.toLowerCase().includes(search));return `<div class="toolbar"><input id="search" placeholder="ค้นหาเลขที่ โครงการ หรือลูกค้า" value="${esc(state.search)}"><span class="tiny">${qs.length} รายการ</span></div>${tableRows(summaryRows(qs))}`}
function servicesView(){
  const tab=state.servicesTab||'services';
  const search=(state.servicesSearch||'').toLowerCase();
  const tabsHtml=`<div class="sub-tabs"><button class="tab-btn ${tab==='services'?'active':''}" data-action="switch-services-tab" data-tab="services">❖ แคตตาล็อกบริการ (${state.services.length})</button><button class="tab-btn ${tab==='promotions'?'active':''}" data-action="switch-services-tab" data-tab="promotions">🏷 โปรโมชั่น & ส่วนลด (${state.promotions.length})</button></div>`;
  if(tab==='services'){
    const filtered=state.services.filter(s=>s.title.toLowerCase().includes(search)||(s.category||'').toLowerCase().includes(search)||(s.description||'').toLowerCase().includes(search));
    const rows=filtered.map(s=>`<tr><td style="width:150px"><span class="badge category">${esc(s.category||'ทั่วไป')}</span></td><td><strong>${esc(s.title)}</strong><small>${esc(s.description||'ไม่มีคำอธิบายเพิ่มเติม')}</small></td><td style="width:110px;text-align:center">${esc(s.default_quantity||1)} ${esc(s.unit||'งาน')}</td><td style="width:140px;color:#5cdfbd"><strong>฿${money(s.unit_price)}</strong><small style="color:#8f8ca4">ต่อ ${esc(s.unit||'งาน')}</small></td><td style="width:200px;text-align:right"><div class="row-actions" style="justify-content:flex-end"><button class="secondary" data-action="edit-service" data-id="${s.id}" title="แก้ไขบริการ">แก้ไข</button><button class="secondary" data-action="use-service-quote" data-id="${s.id}" title="สร้างใบเสนอราคาด้วยบริการนี้" style="color:#d3b5f9">＋ ใช้ในใบเสนอราคา</button><button class="danger" data-action="delete-service" data-id="${s.id}" title="ลบบริการ">ลบ</button></div></td></tr>`).join('');
    return `${tabsHtml}<div class="toolbar"><input id="services-search" placeholder="ค้นหาชื่อบริการ หมวดหมู่ หรือรายละเอียด..." value="${esc(state.servicesSearch)}"><button class="primary" data-action="new-service">＋ เพิ่มบริการใหม่</button></div><div class="panel table-wrap"><table><thead><tr><th>หมวดหมู่</th><th>ชื่อรายการบริการและรายละเอียด</th><th style="text-align:center">จำนวนเริ่มต้น</th><th>ราคาเริ่มต้น / หน่วย</th><th style="text-align:right">จัดการ</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty"><b>ไม่พบบริการ</b>กด "เพิ่มบริการใหม่" เพื่อบันทึกบริการมาตรฐานของคุณ</td></tr>'}</tbody></table></div>`;
  } else {
    const filtered=state.promotions.filter(p=>p.name.toLowerCase().includes(search)||(p.code||'').toLowerCase().includes(search)||(p.description||'').toLowerCase().includes(search));
    const rows=filtered.map(p=>`<tr><td style="width:160px"><strong>${esc(p.code||'—')}</strong></td><td><strong>${esc(p.name)}</strong><small>${esc(p.description||'ไม่มีรายละเอียดเงื่อนไข')}</small></td><td style="width:140px"><span class="badge ${p.type==='percent'?'promo-pct':'promo-fixed'}">${p.type==='percent'?`ส่วนลด ${p.value}%`:`ส่วนลด ฿${money(p.value)}`}</span></td><td style="width:130px"><button class="badge ${p.active?'active':'inactive'}" data-action="toggle-promo" data-id="${p.id}" style="cursor:pointer;border-style:solid">${p.active?'● เปิดใช้งาน':'○ ปิดใช้งาน'}</button></td><td style="width:140px;text-align:right"><div class="row-actions" style="justify-content:flex-end"><button class="secondary" data-action="edit-promotion" data-id="${p.id}" title="แก้ไขโปรโมชั่น">แก้ไข</button><button class="danger" data-action="delete-promotion" data-id="${p.id}" title="ลบโปรโมชั่น">ลบ</button></div></td></tr>`).join('');
    return `${tabsHtml}<div class="toolbar"><input id="services-search" placeholder="ค้นหาโปรโมชั่น หรือโค้ดส่วนลด..." value="${esc(state.servicesSearch)}"><button class="primary" data-action="new-promotion">＋ สร้างโปรโมชั่นใหม่</button></div><div class="panel table-wrap"><table><thead><tr><th>รหัสโปรโมชั่น</th><th>ชื่อแคมเปญ / รายละเอียด</th><th>สิทธิประโยชน์</th><th>สถานะ</th><th style="text-align:right">จัดการ</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty"><b>ไม่พบโปรโมชั่น</b>กด "สร้างโปรโมชั่นใหม่" เพื่อเพิ่มส่วนลดสำหรับใบเสนอราคา</td></tr>'}</tbody></table></div>`;
  }
}
function openServiceModal(s){
  modal(`<h2>${s?'แก้ไขรายการบริการ':'เพิ่มรายการบริการใหม่'}</h2><form id="service-form" data-id="${s?.id||''}" class="form-grid"><label class="field span2">ชื่อรายการบริการ *<input name="title" required value="${esc(s?.title||'')}" placeholder="เช่น ระบบจับเวลาการแข่งขัน Chip Timing"></label><label class="field">หมวดหมู่บริการ<input name="category" value="${esc(s?.category||'ระบบหลัก & Cloud')}" placeholder="เช่น ระบบหลัก, บุคลากร, กราฟิก"></label><label class="field">หน่วยนับ *<input name="unit" required value="${esc(s?.unit||'งาน')}" placeholder="เช่น งาน, วัน, คน, ระบบ, ชุด"></label><label class="field">ราคาเริ่มต้น / หน่วย (บาท) *<input name="unit_price" type="number" required min="0" step="0.01" value="${esc(s?.unit_price??0)}" placeholder="0.00"></label><label class="field">จำนวนเริ่มต้น<input name="default_quantity" type="number" required min="1" step="0.01" value="${esc(s?.default_quantity??1)}"></label><label class="field span2">รายละเอียดบริการ (จะแสดงในใบเสนอราคา)<textarea name="description" rows="3" placeholder="ระบุขอบเขตงานหรือรายละเอียดที่จะแสดงในใบเสนอราคา">${esc(s?.description||'')}</textarea></label><div class="modal-footer span2"><button type="button" class="secondary" id="modal-close">ยกเลิก</button><button class="primary">${s?'บันทึกการแก้ไข':'บันทึกบริการ'}</button></div></form>`);
}
function saveService(form){
  const fd=new FormData(form);
  const title=fd.get('title')?.toString().trim();
  if(!title){notice('กรุณาระบุชื่อบริการ');return}
  const id=form.dataset.id||uid();
  const service={id,title,category:fd.get('category')?.toString().trim()||'ทั่วไป',unit:fd.get('unit')?.toString().trim()||'งาน',unit_price:Number(fd.get('unit_price')||0),default_quantity:Number(fd.get('default_quantity')||1),description:fd.get('description')?.toString().trim()||''};
  const idx=state.services.findIndex(x=>x.id===id);
  if(idx>=0)state.services[idx]=service;else state.services.unshift(service);
  persistServices();closeModal();render();notice('บันทึกข้อมูลบริการมาตรฐานเรียบร้อยแล้ว');
}
function deleteService(id){
  const s=state.services.find(x=>x.id===id);if(!s)return;
  if(!confirm(`ยืนยันการลบบริการ "${s.title}" ออกจากแคตตาล็อก?`))return;
  state.services=state.services.filter(x=>x.id!==id);
  persistServices();render();notice('ลบรายการบริการเรียบร้อยแล้ว');
}
function useServiceInNewQuote(serviceId){
  const s=state.services.find(x=>x.id===serviceId);if(!s)return;
  const q=fresh();
  q.items=[{id:uid(),sort_order:0,title:s.title,description:s.description||'',quantity:Number(s.default_quantity||1),unit:s.unit||'งาน',unit_price:Number(s.unit_price||0)}];
  openEditor(q);notice(`เริ่มสร้างใบเสนอราคาด้วยบริการ "${s.title}"`);
}
function openPromotionModal(p){
  modal(`<h2>${p?'แก้ไขโปรโมชั่น':'สร้างโปรโมชั่นใหม่'}</h2><form id="promotion-form" data-id="${p?.id||''}" class="form-grid"><label class="field span2">ชื่อแคมเปญโปรโมชั่น *<input name="name" required value="${esc(p?.name||'')}" placeholder="เช่น ส่วนลด Early Bird 10%"></label><label class="field">รหัสโค้ดโปรโมชั่น<input name="code" value="${esc(p?.code||'')}" placeholder="เช่น EARLY2026 (เว้นว่างได้)" autocapitalize="characters"></label><label class="field">ประเภทส่วนลด *<select name="type"><option value="fixed" ${p?.type==='fixed'?'selected':''}>ลดเป็นจำนวนเงินคงที่ (บาท)</option><option value="percent" ${p?.type==='percent'?'selected':''}>ลดเป็นเปอร์เซ็นต์ (% จากยอดรวม)</option></select></label><label class="field">มูลค่าส่วนลด *<input name="value" type="number" required min="0.01" step="0.01" value="${esc(p?.value??'')}" placeholder="เช่น 2000 หรือ 10"></label><label class="field">สถานะเปิดใช้งาน<select name="active"><option value="true" ${p?.active!==false?'selected':''}>เปิดใช้งาน (Active)</option><option value="false" ${p?.active===false?'selected':''}>ปิดใช้งานชั่วคราว (Inactive)</option></select></label><label class="field span2">คำอธิบาย / เงื่อนไขการรับโปรโมชั่น<textarea name="description" rows="3" placeholder="เช่น สำหรับงานวิ่งระยะ 21K ขึ้นไป หรือจองล่วงหน้า 30 วัน">${esc(p?.description||'')}</textarea></label><div class="modal-footer span2"><button type="button" class="secondary" id="modal-close">ยกเลิก</button><button class="primary">${p?'บันทึกโปรโมชั่น':'สร้างโปรโมชั่น'}</button></div></form>`);
}
function savePromotion(form){
  const fd=new FormData(form);
  const name=fd.get('name')?.toString().trim();
  if(!name){notice('กรุณาระบุชื่อโปรโมชั่น');return}
  const id=form.dataset.id||uid();
  const val=Number(fd.get('value')||0);
  if(val<=0){notice('กรุณาระบุมูลค่าส่วนลดที่มากกว่า 0');return}
  const promo={id,name,code:(fd.get('code')?.toString().trim()||'').toUpperCase(),type:fd.get('type')?.toString()==='percent'?'percent':'fixed',value:val,active:fd.get('active')?.toString()==='true',description:fd.get('description')?.toString().trim()||''};
  const idx=state.promotions.findIndex(x=>x.id===id);
  if(idx>=0)state.promotions[idx]=promo;else state.promotions.unshift(promo);
  persistPromotions();closeModal();render();notice('บันทึกโปรโมชั่นเรียบร้อยแล้ว');
}
function deletePromotion(id){
  const p=state.promotions.find(x=>x.id===id);if(!p)return;
  if(!confirm(`ยืนยันการลบโปรโมชั่น "${p.name}"?`))return;
  state.promotions=state.promotions.filter(x=>x.id!==id);
  persistPromotions();render();notice('ลบโปรโมชั่นเรียบร้อยแล้ว');
}
function togglePromotion(id){
  const p=state.promotions.find(x=>x.id===id);if(!p)return;
  p.active=!p.active;
  persistPromotions();render();notice(`สถานะโปรโมชั่น "${p.name}": ${p.active?'เปิดใช้งาน':'ปิดใช้งาน'}`);
}
function openCatalogPickerModal(){
  modal(`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h2 style="margin:0">เลือกบริการจากแคตตาล็อกมาตรฐาน</h2><button class="text-button" data-action="go-to-services" style="font-size:12px">⚙ จัดการบริการ</button></div><p class="tiny" style="margin-top:-4px;margin-bottom:12px">คลิก "เลือกบริการนี้" เพื่อเพิ่มลงในใบเสนอราคา พร้อมราคาเริ่มต้นและรายละเอียดอัตโนมัติ</p><input id="picker-search" placeholder="ค้นหาบริการ..." style="background:#141522;border:1px solid #3a3a50;border-radius:8px;padding:9px 12px;width:100%;color:#fff;margin-bottom:10px"><div class="catalog-modal-list" id="picker-list">${renderPickerList('')}</div><div class="modal-footer" style="margin-top:16px"><button type="button" class="secondary" id="modal-close">ปิดหน้าต่าง</button></div>`);
  const searchInput=$('#picker-search');
  if(searchInput){
    searchInput.focus();
    searchInput.addEventListener('input',e=>{const list=$('#picker-list');if(list)list.innerHTML=renderPickerList(e.target.value.toLowerCase())});
  }
}
function renderPickerList(search){
  const filtered=state.services.filter(s=>s.title.toLowerCase().includes(search)||(s.category||'').toLowerCase().includes(search)||(s.description||'').toLowerCase().includes(search));
  if(!filtered.length)return '<div class="empty" style="padding:25px">ไม่พบบริการที่ค้นหา</div>';
  return filtered.map(s=>`<div class="catalog-item-card"><div class="catalog-info"><span class="badge category" style="margin-bottom:4px">${esc(s.category||'ทั่วไป')}</span><strong>${esc(s.title)}</strong><p>${esc(s.description||'')}</p></div><div class="catalog-price"><b>฿${money(s.unit_price)}</b><small>/ ${esc(s.unit||'งาน')}</small><button class="primary" data-action="add-service-to-quote" data-id="${s.id}" style="padding:6px 12px;font-size:12px;margin-top:6px;width:100%">＋ เลือกบริการนี้</button></div></div>`).join('');
}
function addServiceToCurrentQuote(serviceId){
  const s=state.services.find(x=>x.id===serviceId);if(!s||!state.current)return;
  collect();
  state.current.items.push({id:uid(),sort_order:state.current.items.length,title:s.title,description:s.description||'',quantity:Number(s.default_quantity||1),unit:s.unit||'งาน',unit_price:Number(s.unit_price||0)});
  render();recalc();notice(`เพิ่มบริการ "${s.title}" (ราคาเริ่มต้น ฿${money(s.unit_price)}) แล้ว`);
}
function clientsView(){return `<div class="section-heading"><h2>รายชื่อลูกค้า</h2><button class="primary" data-action="new-client">＋ เพิ่มลูกค้า</button></div><div class="panel table-wrap"><table><thead><tr><th>ลูกค้า</th><th>ผู้ติดต่อ</th><th>โทรศัพท์</th><th>อีเมล</th><th></th></tr></thead><tbody>${state.clients.map(c=>`<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.contact_name)}</td><td>${esc(c.phone)}</td><td>${esc(c.email)}</td><td><button class="text-button" data-action="edit-client" data-id="${c.id}">แก้ไข</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">ยังไม่มีลูกค้า</td></tr>'}</tbody></table></div>`}
const field=(label,key,v,type='text',extra='')=>`<label class="field ${extra}">${label}<input name="${key}" type="${type}" value="${esc(v)}" ${type==='number'?'min="0" step="0.01"':''}></label>`;
function editorView(){let q=state.current;if(!q)return '';return `<div class="editor-layout"><div class="editor-main"><div class="box"><h2>ข้อมูลเอกสาร</h2><div class="form-grid">${field('เลขที่ใบเสนอราคา *','quote_no',q.quote_no)}${field('ชื่อโครงการ','title',q.title)}${field('วันที่ออก','issue_date',q.issue_date,'date')}${field('ใช้ได้ถึง','valid_until',q.valid_until||'','date')}${field('วันจัดงาน','event_date',q.event_date||'','date')}<label class="field">สถานะ<select name="status">${Object.entries(statusNames).map(([v,t])=>`<option value="${v}" ${q.status===v?'selected':''}>${t}</option>`).join('')}</select></label><label class="field span2">ลูกค้า<select name="client_id"><option value="">— เลือกลูกค้า —</option>${state.clients.map(c=>`<option value="${c.id}" ${q.client_id===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><button class="text-button" data-action="new-client">＋ เพิ่มลูกค้าใหม่</button></div></div><div class="box"><div class="section-heading"><h2>รายการบริการ</h2><div style="display:flex;gap:8px"><button class="secondary" data-action="pick-service" style="padding:6px 12px;font-size:12px">❖ เลือกจากรายการบริการมาตรฐาน</button><button class="text-button" data-action="add-item">＋ เพิ่มรายการ</button></div></div><div class="items-head"><span>ชื่อรายการ / รายละเอียด</span><span>จำนวน</span><span>หน่วย</span><span>ราคา/หน่วย</span><span>รวม</span></div><div id="items">${q.items.map(itemEditor).join('')}</div></div><div class="box"><h2>ข้อมูลผู้เสนอราคาและเงื่อนไข</h2><div class="form-grid">${field('ชื่อผู้เสนอ','seller_name',q.seller_name)}${field('เบอร์โทรศัพท์','seller_phone',q.seller_phone)}${field('อีเมล','seller_email',q.seller_email)}${field('เลขประจำตัวผู้เสียภาษี','seller_tax_id',q.seller_tax_id)}<label class="field span2">ที่อยู่<textarea name="seller_address">${esc(q.seller_address)}</textarea></label><label class="field span2">เงื่อนไขที่แสดงให้ลูกค้าเห็น<textarea name="public_terms" rows="5">${esc(q.public_terms)}</textarea></label><label class="field span2">ข้อความเพิ่มเติมบนใบเสนอราคา<textarea name="public_note">${esc(q.public_note)}</textarea></label></div></div></div><div class="editor-side"><div class="box"><h2>สรุปราคาขาย</h2><label class="field" style="margin-bottom:8px">โปรโมชั่นส่วนลด (Promotion)<select name="promotion_id" id="editor-promo-select"><option value="">— ไม่ใช้โปรโมชั่น / กำหนดส่วนลดเอง —</option>${state.promotions.map(p=>`<option value="${p.id}" ${q.promotion_id===p.id?'selected':''}>${p.active?'●':'○'} ${esc(p.name)} [${p.type==='percent'?p.value+'%':'฿'+money(p.value)}]</option>`).join('')}</select></label><div id="promo-banner-container"></div>${field('ส่วนลด (บาท)','discount',q.discount,'number')}${field('ภาษี (%)','tax_percent',q.tax_percent,'number')}<div class="split"><div class="money-row"><span>รวมรายการ</span><b id="sum-sub">—</b></div><div class="money-row"><span>ภาษี</span><b id="sum-tax">—</b></div><div class="money-row big"><span>ราคาสุทธิ</span><b id="sum-total">—</b></div></div></div><div class="box internal"><h2>◈ แผนงานภายใน</h2><p class="tiny">ข้อมูลส่วนนี้แสดงเฉพาะในหน้าจัดการ</p><div class="form-grid">${field('กองทุน R&D/Server (%)','rnd_percent',q.internal.rnd_percent,'number')}${field('ทีมงาน (คน)','team_members',q.internal.team_members,'number')}${field('ต้นทุนคาดการณ์ (บาท)','estimated_cost',q.internal.estimated_cost,'number','span2')}<label class="field span2">บันทึกส่วนตัว<textarea name="private_note">${esc(q.internal.private_note)}</textarea></label></div><div class="split"><div class="money-row"><span>กองทุน R&D/Server</span><b id="int-rnd">—</b></div><div class="money-row"><span>หลังหักกองทุนและต้นทุน</span><b id="int-net">—</b></div><div class="money-row"><span>ประมาณต่อคน</span><b id="int-person">—</b></div></div></div><div class="box"><div class="editor-actions"><button class="primary" data-action="save">บันทึก</button><button class="secondary" data-action="preview-current">ดูตัวอย่างพิมพ์</button><button class="danger" data-action="delete">ลบ</button></div><p class="tiny">ตรวจสอบข้อมูลผู้เสนอและภาษีก่อนส่งเอกสารจริง</p></div></div></div>`}
function itemEditor(i,index){return `<div class="item-grid" data-item="${esc(i.id)}"><div><input data-key="title" aria-label="ชื่อรายการ" value="${esc(i.title)}" required><textarea data-key="description" aria-label="รายละเอียด" placeholder="รายละเอียดงาน">${esc(i.description)}</textarea></div><input type="number" data-key="quantity" aria-label="จำนวน" min="0" step="0.01" value="${esc(i.quantity)}"><input data-key="unit" aria-label="หน่วย" value="${esc(i.unit)}"><input type="number" data-key="unit_price" aria-label="ราคา/หน่วย" min="0" step="0.01" value="${esc(i.unit_price)}"><span class="item-total">฿${money(Number(i.quantity)*Number(i.unit_price))}</span><button class="remove" data-action="remove-item" data-index="${index}" aria-label="ลบรายการ">×</button></div>`}
function collect(){
  if(state.view!=='editor')return;
  let q=state.current;
  $$('#content [name]').forEach(el=>{
    if(el.closest('.internal'))q.internal[el.name]=el.value;
    else q[el.name]=el.value;
  });
  $$('#items .item-grid').forEach((el,index)=>{
    let i=q.items[index];
    if(i){$$('[data-key]',el).forEach(input=>i[input.dataset.key]=input.value)}
  });
  q.discount=Number(q.discount||0);
  q.tax_percent=Number(q.tax_percent||0);
  q.internal.rnd_percent=Number(q.internal.rnd_percent||0);
  q.internal.team_members=Number(q.internal.team_members||1);
  q.internal.estimated_cost=Number(q.internal.estimated_cost||0);
  q.items.forEach((i,k)=>{i.quantity=Number(i.quantity||0);i.unit_price=Number(i.unit_price||0);i.sort_order=k});
}
function recalc(){
  let q=state.current;if(!q)return;
  let sub=q.items.reduce((s,i)=>s+Number(i.quantity||0)*Number(i.unit_price||0),0);
  if(q.promotion_id){
    const promo=state.promotions.find(p=>p.id===q.promotion_id);
    if(promo){
      q.promotion_name=promo.name;
      if(promo.type==='percent'){
        q.discount=Math.round((sub*Number(promo.value||0)/100)*100)/100;
      } else {
        q.discount=Math.min(sub,Number(promo.value||0));
      }
      const discInput=$('[name="discount"]');
      if(discInput&&document.activeElement!==discInput){
        discInput.value=q.discount;
      }
      const banner=$('#promo-banner-container');
      if(banner){
        banner.innerHTML=`<div class="promo-badge-box"><div><b>🏷 ${esc(promo.name)}</b><br><small style="color:#9c98b2">${promo.type==='percent'?`ลด ${promo.value}% จากยอดรวม`:'ส่วนลดคงที่'}</small></div><span>−฿${money(q.discount)}</span></div>`;
      }
    }
  } else {
    q.promotion_name='';
    const banner=$('#promo-banner-container');
    if(banner)banner.innerHTML='';
  }
  let t=totals(q),rnd=t.total*Number(q.internal.rnd_percent||0)/100,net=t.total-rnd-Number(q.internal.estimated_cost||0);
  const set=(id,v)=>{let el=$(id);if(el)el.textContent='฿'+money(v)};
  set('#sum-sub',t.sub);set('#sum-tax',t.tax);set('#sum-total',t.total);set('#int-rnd',rnd);set('#int-net',net);set('#int-person',net/Math.max(1,Number(q.internal.team_members||1)));
  $$('#items .item-grid').forEach((el,j)=>{let x=q.items[j];$('.item-total',el).textContent='฿'+money(Number(x.quantity)*Number(x.unit_price))});
}
function openEditor(q){state.current=structuredClone(q||fresh());state.view='editor';render();$('main')?.scrollTo({top:0,behavior:'instant'});window.scrollTo(0,0)}
function validate(q){if(!q.quote_no.trim())throw Error('กรุณากรอกเลขที่ใบเสนอราคา');if(state.quotes.some(x=>x.quote_no===q.quote_no&&x.id!==q.id))throw Error('เลขที่ใบเสนอราคาซ้ำ');if(!q.client_id)throw Error('กรุณาเลือกลูกค้า');if(!q.items.length||q.items.some(i=>!i.title.trim()||i.quantity<0||i.unit_price<0))throw Error('ตรวจสอบรายการบริการและจำนวน');if(q.discount<0||q.discount>totals({...q,discount:0}).sub)throw Error('ส่วนลดต้องไม่เกินยอดรวม');if(q.tax_percent<0||q.tax_percent>100||q.internal.rnd_percent<0||q.internal.rnd_percent>100||q.internal.team_members<1||q.internal.estimated_cost<0)throw Error('ตรวจสอบภาษีและงบประมาณภายใน')}
async function saveQuote(){collect();let q=state.current;try{validate(q)}catch(e){notice(e.message);return}let btn=$('[data-action="save"]');btn.disabled=true;let result=await run(async()=>{if(!live||state.isDemo){let index=demo.quotes.findIndex(x=>x.id===q.id);if(index<0)demo.quotes.unshift(structuredClone(q));else demo.quotes[index]=structuredClone(q);persist();return q.id}let payload={quote_no:q.quote_no,title:q.title,issue_date:q.issue_date,valid_until:q.valid_until||null,event_date:q.event_date||null,status:q.status,client_id:q.client_id,seller_name:q.seller_name,seller_address:q.seller_address,seller_phone:q.seller_phone,seller_email:q.seller_email,seller_tax_id:q.seller_tax_id,discount:q.discount,tax_percent:q.tax_percent,public_terms:q.public_terms,public_note:q.public_note};let exists=state.quotes.some(x=>x.id===q.id);let saved=exists?await api('rohn_quotes','PATCH',`id=eq.${q.id}`,[payload][0]):await api('rohn_quotes','POST','',payload);let id=exists?q.id:saved[0].id;if(exists)await api('rohn_quote_items','DELETE',`quote_id=eq.${id}`);await api('rohn_quote_items','POST','',q.items.map((i,k)=>({quote_id:id,sort_order:k,title:i.title,description:i.description,quantity:i.quantity,unit:i.unit,unit_price:i.unit_price})));let internal={quote_id:id,rnd_percent:q.internal.rnd_percent,team_members:q.internal.team_members,estimated_cost:q.internal.estimated_cost,private_note:q.internal.private_note};if(exists)await api('rohn_quote_internal','PATCH',`quote_id=eq.${id}`,internal);else await api('rohn_quote_internal','POST','',internal);return id});btn.disabled=false;if(result){state.view='quotes';await load();notice('บันทึกใบเสนอราคาแล้ว')}}
function openClient(c){modal(`<h2>${c?'แก้ไขข้อมูลลูกค้า':'เพิ่มลูกค้าใหม่'}</h2><form id="client-form" data-id="${c?.id||''}" class="form-grid">${field('ชื่อบริษัท / ลูกค้า *','name',c?.name||'','text','span2')}${field('ผู้ติดต่อ','contact_name',c?.contact_name||'')}${field('โทรศัพท์','phone',c?.phone||'')}${field('อีเมล','email',c?.email||'','email')}${field('เลขประจำตัวผู้เสียภาษี','tax_id',c?.tax_id||'')}<label class="field span2">ที่อยู่<textarea name="address">${esc(c?.address||'')}</textarea></label><div class="modal-footer span2"><button type="button" class="secondary" id="cancel-client">ยกเลิก</button><button class="primary">บันทึกลูกค้า</button></div></form>`)}
async function saveClient(form){let payload=Object.fromEntries(new FormData(form));if(!payload.name.trim()){notice('กรุณากรอกชื่อลูกค้า');return}let id=form.dataset.id;let result=await run(async()=>{if(!live||state.isDemo){let c={...payload,id:id||uid()};let idx=demo.clients.findIndex(x=>x.id===id);if(idx<0)demo.clients.push(c);else demo.clients[idx]=c;persist();return c}let rows=id?await api('rohn_clients','PATCH',`id=eq.${id}`,payload):await api('rohn_clients','POST','',payload);return rows[0]});if(result){closeModal();let previous=state.current?.client_id;await load();if(state.view==='editor'){state.current.client_id=previous||result.id;render()}notice('บันทึกข้อมูลลูกค้าแล้ว')}}
async function deleteQuote(){if(!confirm('ลบใบเสนอราคานี้และรายการทั้งหมดอย่างถาวร?'))return;let id=state.current.id;let result=await run(async()=>{if(live&&!state.isDemo)await api('rohn_quotes','DELETE',`id=eq.${id}`);else{demo.quotes=demo.quotes.filter(x=>x.id!==id);persist()}return true});if(result){state.view='quotes';state.current=null;await load();notice('ลบใบเสนอราคาแล้ว')}}
function preview(q){let c=state.clients.find(c=>c.id===q.client_id),t=totals(q);let root=$('#print-root');root.innerHTML=`<div class="preview"><div class="preview-tools"><b>ตัวอย่างเอกสารสำหรับลูกค้า</b><div><button class="secondary" id="close-preview">← กลับ</button><button class="primary" id="print">พิมพ์ / บันทึก PDF</button></div></div><article class="paper"><div class="paper-head"><div><div class="paper-logo">ROHN</div><div class="paper-caption">TIMING & RACE SOLUTION</div><div class="paper-meta">${esc(q.seller_name)}<br>${esc(q.seller_address).replaceAll('\n','<br>')}<br>${esc(q.seller_phone)} ${esc(q.seller_email)}<br>${q.seller_tax_id?'เลขผู้เสียภาษี '+esc(q.seller_tax_id):''}</div></div><div><div class="paper-title">ใบเสนอราคา</div><div class="paper-meta" style="text-align:right">เลขที่: ${esc(q.quote_no)}<br>วันที่: ${date(q.issue_date)}<br>ใช้ได้ถึง: ${date(q.valid_until)}<br>${q.event_date?'วันจัดงาน: '+date(q.event_date):''}</div></div></div><div class="paper-details"><div><h3>เสนอถึง / BILL TO</h3><p><b>${esc(c?.name||'—')}</b><br>${esc(c?.contact_name||'')}<br>${esc(c?.address||'')}<br>${c?.tax_id?'เลขผู้เสียภาษี '+esc(c.tax_id):''}<br>${esc(c?.phone||'')} ${esc(c?.email||'')}</p></div><div><h3>โครงการ / PROJECT</h3><p>${esc(q.title)}</p></div></div><table><thead><tr><th style="width:7%">#</th><th style="width:45%">รายการบริการและขอบเขตงาน</th><th style="width:14%">จำนวน</th><th style="width:16%">ราคา/หน่วย</th><th style="width:18%">รวม (บาท)</th></tr></thead><tbody>${q.items.map((i,k)=>`<tr><td>${k+1}</td><td><b>${esc(i.title)}</b><small>${esc(i.description)}</small></td><td>${esc(i.quantity)} ${esc(i.unit)}</td><td>${money(i.unit_price)}</td><td>${money(Number(i.quantity)*Number(i.unit_price))}</td></tr>`).join('')}</tbody></table><div class="paper-totals"><div><span>รวมรายการ</span><b>${money(t.sub)} บาท</b></div>${Number(q.discount)?`<div><span>ส่วนลด ${q.promotion_name?`(${esc(q.promotion_name)})`:''}</span><b>−${money(q.discount)} บาท</b></div>`:''}${Number(q.tax_percent)?`<div><span>ภาษี (${esc(q.tax_percent)}%)</span><b>${money(t.tax)} บาท</b></div>`:''}<div class="final"><span>ยอดสุทธิ</span><span>${money(t.total)} บาท</span></div></div>${q.public_note?`<div class="paper-terms"><h3>หมายเหตุ</h3>${esc(q.public_note)}</div>`:''}<div class="paper-terms"><h3>เงื่อนไขและข้อตกลง</h3>${esc(q.public_terms)}</div><div class="paper-footer">${esc(q.seller_name)} · ขอบคุณที่ไว้วางใจ</div></article></div>`;root.hidden=false;document.body.style.overflow='hidden'}
function closePreview(){$('#print-root').hidden=true;$('#print-root').innerHTML='';document.body.style.overflow=''}
document.addEventListener('click',async e=>{
  let t=e.target.closest('[data-action]');
  if(t){
    let a=t.dataset.action,id=t.dataset.id;
    if(a==='navigate'){state.view=t.dataset.view;render()}
    if(a==='edit')openEditor(state.quotes.find(q=>q.id===id));
    if(a==='preview')preview(state.quotes.find(q=>q.id===id));
    if(a==='preview-current'){collect();preview(state.current)}
    if(a==='add-item'){collect();state.current.items.push({id:uid(),title:'',description:'',quantity:1,unit:'งาน',unit_price:0});render()}
    if(a==='remove-item'){collect();state.current.items.splice(Number(t.dataset.index),1);render()}
    if(a==='new-client')openClient();
    if(a==='edit-client')openClient(state.clients.find(c=>c.id===id));
    if(a==='save')saveQuote();
    if(a==='delete')deleteQuote();
    if(a==='switch-services-tab'){state.servicesTab=t.dataset.tab;render()}
    if(a==='new-service')openServiceModal();
    if(a==='edit-service')openServiceModal(state.services.find(s=>s.id===id));
    if(a==='delete-service')deleteService(id);
    if(a==='use-service-quote')useServiceInNewQuote(id);
    if(a==='new-promotion')openPromotionModal();
    if(a==='edit-promotion')openPromotionModal(state.promotions.find(p=>p.id===id));
    if(a==='delete-promotion')deletePromotion(id);
    if(a==='toggle-promo')togglePromotion(id);
    if(a==='pick-service')openCatalogPickerModal();
    if(a==='add-service-to-quote'){addServiceToCurrentQuote(id);closeModal()}
    if(a==='go-to-services'){closeModal();state.view='services';state.servicesTab='services';render()}
    return;
  }
  if(e.target.id==='new-quote')openEditor();
  if(e.target.id==='modal-close'||e.target.id==='cancel-modal'||e.target.id==='cancel-client')closeModal();
  if(e.target.id==='close-preview')closePreview();
  if(e.target.id==='print')window.print();
  if(e.target.id==='demo-mode-btn'){
    const btn=e.target;
    btn.disabled=true;
    btn.innerHTML='<span class="btn-spinner"></span> กำลังเข้าสู่โหมดตัวอย่าง...';
    showAuthLoader({
      text:'กำลังเริ่มต้นโหมดตัวอย่าง (Demo Mode)...',
      sub:'จำลองพื้นที่ทำงานในเบราว์เซอร์พร้อมข้อมูลตัวอย่าง',
      percent:25
    });
    await sleep(400);
    updateAuthLoader({
      text:'กำลังจัดเตรียมข้อมูลใบเสนอราคาและลูกค้า...',
      sub:'ตั้งค่าสิทธิ์ผู้ดูแลระบบ (Demo Admin)',
      percent:65
    });
    state.isDemo=true;
    state.profile={username:'DEMO USER',role:'admin'};
    state.view='dashboard';
    await load();
    await sleep(350);
    updateAuthLoader({
      text:'ยินดีต้อนรับสู่ ROHN Workspace!',
      sub:'กำลังเปิดหน้าต่างหลัก...',
      percent:100
    });
    await sleep(450);
    await hideAuthLoader(400);
  }
  if(e.target.id==='signout'){
    if(state.session&&!state.isDemo)endpoint({action:'logout'}).catch(()=>{});
    state.isDemo=false;state.session=null;state.profile=null;
    localStorage.removeItem('rohn-session');renderAuth();
  }
});
document.addEventListener('submit',async e=>{
  e.preventDefault();
  if(e.target.id==='client-form')return saveClient(e.target);
  if(e.target.id==='service-form')return saveService(e.target);
  if(e.target.id==='promotion-form')return savePromotion(e.target);
  if(e.target.id==='username-form')return saveUsername(e.target);
  if(e.target.id==='password-form')return savePassword(e.target);
  if(e.target.id==='login-form'){
    const form=e.target;
    const submitBtn=$('#login-submit-btn');
    const {username,password}=Object.fromEntries(new FormData(form));

    if(submitBtn){
      submitBtn.disabled=true;
      submitBtn.innerHTML='<span class="btn-spinner"></span> กำลังเข้าสู่ระบบ...';
    }

    showAuthLoader({
      text:'กำลังตรวจสอบข้อมูลบัญชีผู้ใช้...',
      sub:'ระบบความปลอดภัย ROHN กำลังยืนยันตัวตน',
      percent:25
    });

    const minWait=sleep(700);
    let s=null;
    try{
      [s]=await Promise.all([
        loginWithUsername(username.trim(),password).catch(()=>null),
        minWait
      ]);
    }catch{
      s=null;
    }

    if(!s){
      updateAuthLoader({
        text:'เข้าสู่ระบบไม่สำเร็จ',
        sub:'Username หรือ Password ไม่ถูกต้อง',
        percent:100
      });
      await sleep(400);
      await hideAuthLoader(250);

      if(submitBtn){
        submitBtn.disabled=false;
        submitBtn.innerHTML='<span class="btn-text">เข้าสู่ระบบ</span>';
      }
      const panel=form.closest('.panel');
      if(panel){
        panel.classList.remove('shake');
        void panel.offsetWidth;
        panel.classList.add('shake');
      }
      notice('Username หรือ Password ไม่ถูกต้อง (รหัสผ่านตัวเลข 8 หลัก)');
      return;
    }

    updateAuthLoader({
      text:'ยืนยันตัวตนสำเร็จ กำลังเชื่อมต่อระบบ...',
      sub:`ยินดีต้อนรับ ${username.trim()}`,
      percent:60
    });
    state.session=s;
    localStorage.setItem('rohn-session',JSON.stringify(s));
    state.view='dashboard';

    await sleep(350);
    updateAuthLoader({
      text:'กำลังโหลดข้อมูลใบเสนอราคาและลูกค้า...',
      sub:'ดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์',
      percent:85
    });

    await load();

    updateAuthLoader({
      text:'ยินดีต้อนรับ เข้าสู่ระบบสำเร็จ!',
      sub:'กำลังเปิดหน้าต่าง Workspace...',
      percent:100
    });
    await sleep(450);
    await hideAuthLoader(400);
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='services-search'){
    state.servicesSearch=e.target.value;
    render();
    const el=$('#services-search');
    if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}
  } else if(e.target.id==='search'){
    state.search=e.target.value;
    let pos=e.target.selectionStart;
    render();
    $('#search').focus();
    $('#search').setSelectionRange(pos,pos);
  } else if(state.view==='editor'){
    collect();recalc();
  }
});
document.addEventListener('change',e=>{
  if(e.target.id==='editor-promo-select'){
    collect();
    state.current.promotion_id=e.target.value;
    recalc();
  } else if(state.view==='editor'){
    collect();recalc();
  }
});
$$('.nav').forEach(n=>n.addEventListener('click',()=>{
  if(state.view==='editor')collect();
  state.view=n.dataset.view;
  render();
  $('main')?.scrollTo({top:0,behavior:'instant'});
}));
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
(async()=>{if(live){try{state.session=JSON.parse(localStorage.getItem('rohn-session'))}catch{}if(state.session?.expires_at&&Date.parse(state.session.expires_at)<Date.now()){state.session=null;localStorage.removeItem('rohn-session')}}await load()})();
