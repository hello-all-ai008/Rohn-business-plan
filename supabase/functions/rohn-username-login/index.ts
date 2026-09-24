// ROHN custom accounts; all business queries are scoped after server-side session verification.
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey, content-type, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:cors});
const base=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const name=/^[A-Za-z][A-Za-z0-9_-]{2,31}$/;
const columns:Record<string,string[]>={
 rohn_clients:['name','contact_name','email','phone','address','tax_id'],
 rohn_quotes:['quote_no','title','issue_date','valid_until','event_date','status','client_id','seller_name','seller_address','seller_phone','seller_email','seller_tax_id','discount','tax_percent','public_terms','public_note'],
 rohn_quote_items:['quote_id','sort_order','title','description','quantity','unit','unit_price'],
 rohn_quote_internal:['quote_id','rnd_percent','team_members','estimated_cost','private_note']
};
async function db(path:string,method='GET',body?:unknown){
 const r=await fetch(`${base}/rest/v1/${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const data=await r.json().catch(()=>null);
 if(!r.ok)throw Error(data?.message||'Database unavailable');
 return data;
}
async function hash(raw:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')}
function clean(input:unknown,allowed:string[]){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid payload');
 const obj=input as Record<string,unknown>;
 if(!Object.keys(obj).length||Object.keys(obj).some(k=>!allowed.includes(k)))throw Error('Invalid fields');
 return obj;
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(req.method!=='POST')return reply(405,{message:'Method not allowed'});
 try{
  if(Number(req.headers.get('content-length')||0)>128000)return reply(413,{message:'Request too large'});
  const input=await req.json();
  if(input.action==='login'){
   const {username,password}=input;
   if(typeof username!=='string'||!name.test(username)||typeof password!=='string'||password.length<8||password.length>256)return reply(401,{message:'Invalid credentials'});
   const accounts=await db('rpc/rohn_verify_password','POST',{p_username:username,p_password:password});
   if(!accounts?.length)return reply(401,{message:'Invalid credentials'});
   const access_token=randomToken(),expires_at=new Date(Date.now()+7*86400000).toISOString();
   await db('rohn_sessions','POST',{token_hash:await hash(access_token),account_id:accounts[0].id,expires_at});
   return reply(200,{access_token,expires_at,profile:{username:accounts[0].username,role:accounts[0].role}});
  }
  const bearer=req.headers.get('authorization')||'';
  const raw=bearer.startsWith('Bearer ')?bearer.slice(7):'';
  if(!/^[0-9a-f]{64}$/.test(raw))return reply(401,{message:'Session expired'});
  const token_hash=await hash(raw);
  const sessions=await db(`rohn_sessions?select=account_id,expires_at&token_hash=eq.${token_hash}&limit=1`);
  if(!sessions?.length||Date.parse(sessions[0].expires_at)<=Date.now())return reply(401,{message:'Session expired'});
  const owner=sessions[0].account_id;
  if(input.action==='logout'){await db(`rohn_sessions?token_hash=eq.${token_hash}`,'DELETE');return reply(200,{ok:true})}
  if(input.action==='profile'){const a=await db(`rohn_accounts?select=username,role&id=eq.${owner}`);return reply(200,a[0])}
  if(input.action==='username'){
   if(typeof input.username!=='string'||!name.test(input.username))return reply(400,{message:'Invalid username'});
   const a=await db(`rohn_accounts?id=eq.${owner}`,'PATCH',{username:input.username});
   return reply(200,{username:a[0].username,role:a[0].role});
  }
  if(input.action==='password'){
   if(typeof input.current!=='string'||typeof input.next!=='string'||!/^[0-9]{8}$/.test(input.next)||input.current===input.next)return reply(400,{message:'Invalid password'});
   const changed=await db('rpc/rohn_update_password','POST',{p_account:owner,p_current:input.current,p_next:input.next});
   if(!changed)return reply(401,{message:'รหัสผ่านปัจจุบันไม่ถูกต้อง'});
   await db(`rohn_sessions?account_id=eq.${owner}`,'DELETE');
   return reply(200,{ok:true});
  }
  if(input.action!=='data')return reply(400,{message:'Invalid action'});
  const {table,method='GET',query='',body}=input;
  if(typeof table!=='string'||!Object.hasOwn(columns,table)||!['GET','POST','PATCH','DELETE'].includes(method)||typeof query!=='string')return reply(400,{message:'Invalid request'});
  const p=new URLSearchParams(query);
  if([...p.keys()].some(k=>!['select','order','id','quote_id'].includes(k))||(p.has('select')&&p.get('select')!=='*')||(p.has('order')&&!['name.asc','issue_date.desc','sort_order.asc'].includes(p.get('order')!)))return reply(400,{message:'Invalid filter'});
  if(p.has('quote_id')&&!['rohn_quote_items','rohn_quote_internal'].includes(table))return reply(400,{message:'Invalid filter'});
  for(const k of ['id','quote_id'])if(p.has(k)&&(!p.get(k)?.startsWith('eq.')||!uuid.test(p.get(k)!.slice(3))))return reply(400,{message:'Invalid ID'});
  if(method==='POST'){
   if(query)return reply(400,{message:'Invalid filter'});
   const rows=Array.isArray(body)?body:[body];
   if(!rows.length||rows.length>100)return reply(400,{message:'Invalid rows'});
   const valid=rows.map(x=>({...clean(x,columns[table]),owner_id:owner}));
   return reply(200,await db(table,method,Array.isArray(body)?valid:valid[0]));
  }
  if(method!=='GET'&&(p.size!==1||(!p.has('id')&&!p.has('quote_id'))))return reply(400,{message:'Record ID required'});
  p.set('owner_id',`eq.${owner}`);
  const path=`${table}?${p.toString()}`;
  if(method==='PATCH')return reply(200,await db(path,method,clean(body,columns[table])));
  return reply(200,(await db(path,method))||[]);
 }catch(e){
  const msg=e instanceof Error?e.message:'Request failed';
  return reply(/duplicate key/i.test(msg)?409:400,{message:/password_hash|token_hash/i.test(msg)?'Request failed':msg});
 }
});
