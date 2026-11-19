const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname,'..');
const names = fs.readFileSync(path.join(root,'examples/chapters.txt'),'utf8').trim().split('\n');
const name='考研英语一·作文语料';
const first=JSON.parse(fs.readFileSync(path.join(root,'examples/first-card.json')));
const three=JSON.parse(fs.readFileSync(path.join(root,'examples/three-types.json')));
const clone=x=>JSON.parse(JSON.stringify(x));
// Synthetic fixtures: no live credentials, account data or network.
function environment({cards=[],accept=true,privateDeck=true,duplicateDeck=false,badChapters=false,failWrite=false,failReadback=false,token='mock-local-value',badBackup=false,authFail=false}={}) {
 const id='mkjd_TEST_FIXTURE';
 const ch=names.map((name,i)=>({id:'chapter-fixture-'+i,deck_id:id,name,card_ids:[]}));
 if(badChapters)ch[0].name='incorrect chapter';
 const state={chapterset:{deck_id:id,chapter_ids:ch.map(x=>x.id)},chapters:ch,cards:[]};
 let seq=0;
 function add(content,chapter){const c={id:'card-fixture-'+(++seq),deck_id:id,root_id:'root-fixture-'+seq,status:'NORMAL',grammar_version:3,content_type:1,files:[],card_rids:[],content};state.cards.push(c);ch[chapter].card_ids.push(c.id);return c;}
 for(const c of cards)add(c.content,names.indexOf(c.chapter));
 const dialogs=[],requests=[],files=new Map();let writes=0,confirmations=0;
 const deck=()=>({id,name,source:'SELF',is_private:privateDeck,status:'NORMAL',card_count:state.cards.length,chapter_count:ch.length});
 const response=(data,status=200)=>({status:'success',response:{statusCode:status,body:JSON.stringify({success:status===200,errors:status===200?[]:['failure'],data})}});
 const ctx={getVariable:()=>token,getClipboardContent:()=>ctx.clipboard,clipboard:'',wait:()=>{},confirm:()=>{confirmations++;return accept},showDialog:(message,title)=>dialogs.push({message,title}),getDirectory:()=>({writeFile:(f,s)=>files.set(f,s),readFile:f=>badBackup?'wrong':files.get(f)}),sendHttpRequest:(url,opts)=>{
  const u=new URL(url);assert.equal(u.origin,'https://open.maimemo.com');assert.equal(opts.followRedirects,false);assert.equal(opts.headers.Authorization,'Bearer '+token);requests.push({url,method:opts.method});
  const p=u.pathname.replace('/open/api/v1/markji/decks','');
  if(authFail)return response({},401);
  if(opts.method==='GET'&&p==='')return response({decks:duplicateDeck?[deck(),{...deck(),id:'mkjd_TEST_DUPLICATE'}]:[deck(),{id:'mkjd_TEST_OTHER',name:'政治',source:'SELF',is_private:true,status:'NORMAL',card_count:100,chapter_count:1}]});
  if(opts.method==='GET'&&p===`/${id}/chapters`){if(failReadback&&writes)return response({},503);return response(clone(state));}
  if(opts.method==='POST'){
   if(failWrite)return response({},429);
   const payload=JSON.parse(opts.body);assert.equal(payload.card.grammar_version,3);assert.equal(typeof payload.card.content,'string');
   const create=p.match(/^\/([^/]+)\/chapters\/([^/]+)\/cards$/);const update=p.match(/^\/([^/]+)\/cards\/([^/]+)$/);
   if(create){assert.equal(create[1],id);const idx=ch.findIndex(c=>c.id===create[2]);assert.ok(idx>=0);add(payload.card.content,idx);}
   else if(update){assert.equal(update[1],id);const c=state.cards.find(x=>x.id===update[2]);assert.ok(c);c.content=payload.card.content;}
   else throw Error('Unexpected mutation route');
   writes++;return response({ok:true});
  }throw Error('Unexpected route');
 }};
 function run(script,payload){ctx.clipboard=typeof payload==='string'?payload:JSON.stringify(payload??{});vm.runInNewContext(fs.readFileSync(path.join(root,'scripts',script),'utf8'),ctx,{timeout:3000});return dialogs.at(-1);}
 return {run,state,files,requests,get writes(){return writes},get confirmations(){return confirmations}};
}
const sync='ENI-sync.js', beautify='ENI-beautify.js';
const legacy={...first.cards[0],content:'[P#H1#写作功能]\n[T#B,!b91c1c#核心必背]\n[T#!6b7280#解释具体作用]\n[T#!6b7280#请用英文写出] [T#B,!111827#及时的反馈能帮助学习者调整自己的方法。]\n---\n[T#!6b7280#参考表达] [T#B,!1d4ed8#Timely feedback enables learners to refine their approach.]\n[T#!6b7280#例句] [T#!0f766e#Clear instructions enable volunteers to work more efficiently.]\n[T#!6b7280#用法] [T#B,!b45309#enable + 人 + to do]\n[T#!6b7280#可迁移] [T#B,!7c3aed#教育、合作]'};
test('empty private deck passes read-only configuration',()=>{const e=environment();assert.match(e.run('ENI-check.js').title,/通过/);assert.equal(e.writes,0);});
test('first card succeeds and readback matches',()=>{const e=environment();assert.match(e.run(sync,first).message,/新增1张/);assert.equal(e.writes,1);assert.equal(e.state.cards[0].content,first.cards[0].content);});
test('same card is skipped in another chapter',()=>{const e=environment({cards:first.cards});const p=clone(first);p.cards[0].chapter=names[0];assert.match(e.run(sync,p).message,/新增0张，跳过1张/);assert.equal(e.writes,0);});
test('three types across chapters; one known duplicate',()=>{const e=environment({cards:first.cards});assert.match(e.run(sync,three).message,/新增2张，跳过1张/);assert.equal(e.writes,2);assert.equal(e.state.chapters[5].card_ids.length,1);assert.equal(e.state.chapters[7].card_ids.length,1);});
test('batch duplicates suppressed',()=>{const e=environment();const p=clone(first);p.cards.push(clone(p.cards[0]));assert.match(e.run(sync,p).message,/新增1张，跳过1张/);assert.equal(e.writes,1);});
test('invalid clipboard and wrong chapter stop before network',()=>{const e=environment();assert.match(e.run(sync,'// javascript').title,/停止/);const p=clone(first);p.cards[0].chapter='wrong';assert.match(e.run(sync,p).title,/停止/);assert.equal(e.requests.length,0);});
test('cancel makes no mutation',()=>{const e=environment({accept:false});e.run(sync,first);assert.equal(e.confirmations,1);assert.equal(e.writes,0);});
test('non-private or ambiguous deck stops safely',()=>{for(const opt of [{privateDeck:false},{duplicateDeck:true},{badChapters:true}]){const e=environment(opt);assert.match(e.run(sync,first).title,/停止/);assert.equal(e.writes,0);}});
test('auth and missing token stop safely',()=>{for(const opt of [{authFail:true},{token:''}]){const e=environment(opt);assert.match(e.run(sync,first).title,/停止/);assert.equal(e.writes,0);}});
test('HTTP 429 stops without blind retry',()=>{const e=environment({failWrite:true});assert.match(e.run(sync,three).message,/429/);assert.equal(e.requests.filter(r=>r.method==='POST').length,1);});
test('uncertain readback is not reported as success',()=>{const e=environment({failReadback:true});assert.match(e.run(sync,three).title,/停止/);assert.equal(e.writes,1);});
test('backup writes local snapshot and is read-only',()=>{const e=environment({cards:first.cards});assert.match(e.run('ENI-backup.js').title,/成功/);const snap=JSON.parse([...e.files.values()][0]);assert.equal(snap.cards[0].content,first.cards[0].content);assert.equal(e.writes,0);});
test('beautify preserves ID, root, content and chapter; repeat is safe',()=>{const e=environment({cards:[legacy]});const old=clone(e.state.cards[0]);assert.match(e.run(beautify).message,/已核对 1\/1/);const now=e.state.cards[0];assert.equal(now.id,old.id);assert.equal(now.root_id,old.root_id);assert.equal(now.content,first.cards[0].content);assert.equal(e.state.chapters[2].card_ids[0],old.id);assert.equal(e.files.size,1);assert.match(e.run(beautify).title,/完成/);assert.equal(e.writes,1);});
test('beautify refuses unknown content or bad backup',()=>{const unknown={...legacy,content:'unsupported card'};for(const opt of [{cards:[unknown]},{cards:[legacy],badBackup:true}]){const e=environment(opt);assert.match(e.run(beautify).title,/停止/);assert.equal(e.writes,0);}});
