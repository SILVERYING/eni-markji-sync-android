// ENI V0.4: reformat in place, only the unified private English deck.
function main(){
 const name='考研英语一·作文语料';
 const names=['01 图画与图表描述','02 开篇与主旨提炼','03 因果与机制论证','04 对比与多角度论证','05 结尾与行动建议','06 通用主题语料','07 小作文功能句','08 个人错题与迁移'];
 const token=String(getVariable('markji_token')||'').trim();if(!token||/\s/.test(token))throw Error('检查本地 Token');
 const dir=getDirectory('ENI'),base='https://open.maimemo.com/open/api/v1/markji/decks',headers={Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'};let last=0;
 function req(method,path,body){const pause=2100-(Date.now()-last);if(last&&pause>0)wait(pause);const opts={method,headers,followRedirects:false};if(body!==undefined)opts.body=JSON.stringify(body);last=Date.now();const r=sendHttpRequest(base+path,opts);if(r.status!=='success'||!r.response||r.response.statusCode<200||r.response.statusCode>=300)throw Error(method+' 失败：'+(r.response?'HTTP '+r.response.statusCode:'网络异常')+'；先回读，不要盲目重试。');const j=JSON.parse(r.response.body);if(j.success!==true||!Array.isArray(j.errors)||j.errors.length||!j.data)throw Error('API 未确认成功');return j.data;}
 function state(){const d=req('GET','/'+target+'/chapters?with_cards=true');if(!d.chapterset||d.chapterset.deck_id!==target||!Array.isArray(d.chapters)||!Array.isArray(d.cards)||d.chapters.length!==8||names.some(n=>d.chapters.filter(ch=>ch.name===n&&ch.deck_id===target).length!==1))throw Error('统一牌组章节不符');if(!Array.isArray(d.chapterset.chapter_ids)||d.chapterset.chapter_ids.length!==8||new Set(d.chapterset.chapter_ids).size!==8||d.chapters.some(ch=>!d.chapterset.chapter_ids.includes(ch.id)))throw Error('章节目录不一致');const map=new Map(d.cards.map(c=>[c.id,c]));const ids=new Set();if(map.size!==d.cards.length)throw Error('卡片ID重复');for(const ch of d.chapters){if(!Array.isArray(ch.card_ids))throw Error('章节数据不完整');for(const id of ch.card_ids){if(ids.has(id)||!map.has(id)||map.get(id).deck_id!==target)throw Error('卡片归属异常');ids.add(id);}}if(ids.size!==map.size)throw Error('卡片返回不完整');return d;}
 const matches=req('GET','').decks.filter(d=>d.name===name&&d.source==='SELF'&&d.is_private===true&&d.status==='NORMAL');if(matches.length!==1)throw Error('必须恰好存在一个同名、自建、私有、正常的英语牌组');const deck=matches[0],target=deck.id;if(typeof target!=='string'||!/^mkjd_[A-Za-z0-9_.-]+$/.test(target))throw Error('牌组ID异常');
 const d=state();if(d.cards.length!==deck.card_count)throw Error('数量异常，停止');
 function style(s){
  const l=s.split('\n');
  if(/^\[P#H1#(?:写作功能|主题搭配|个人错句复测)｜[^\]#]+\]$/.test(l[0])&&l[1]&&/^\[T#B,!7c3aed#可迁移 · [^\]#]+\]$/.test(l[1])&&s.includes('!!fff2cc#'))return s;
  const t=l[0].match(/^\[P#H1#(写作功能|主题搭配|个人错句复测)\]$/), f=(l[2]||'').match(/^\[T#!6b7280#([^\]#]+)\]$/), tags=(l[8]||'').match(/^\[T#!6b7280#可迁移\] \[T#B,!7c3aed#([^\]#]+)\]$/);
  if(!t||!f||!tags||!(l.length===9||l.length===10)||!/^\[T#B,!(?:b91c1c|9a3412)#(?:核心必背|进阶补充)\]$/.test(l[1])||!/^\[T#!6b7280#(?:请用英文写出|请默写该搭配|请独立写出订正后的表达)\] \[T#B,!111827#[^\]]+\]$/.test(l[3])||l[4]!=='---'||!/^\[T#!6b7280#(?:参考表达|高频搭配|迁移答案)\] \[T#B,!1d4ed8#[^\]]+\]$/.test(l[5])||!/^\[T#!6b7280#例句\] \[T#!0f766e#[^\]]+\]$/.test(l[6])||!/^\[T#!6b7280#用法\] \[T#B,!b45309#[^\]]+\]/.test(l[7])||(l.length===10&&!/^\[T#!9ca3af#S1LVER-ID [^\]]+\]$/.test(l[9])))throw Error('遇到非标准卡片，停止，未批量写入');
  const out=['[P#H1#'+t[1]+'｜'+f[1]+']','[T#B,!7c3aed#可迁移 · '+tags[1]+']','',l[1],'',l[3],l[4],l[5],'',l[7].replace('[T#B,!b45309#','[T#B,!78350f,!!fff2cc#'),'',l[6]];
  if(l.length===10)out.push(l[9]);
  return out.join('\n');
 }
 const plan=[];for(const c of d.cards){if(c.status!=='NORMAL'||c.grammar_version!==3||c.content_type!==1||!Array.isArray(c.files)||c.files.length||!Array.isArray(c.card_rids)||c.card_rids.length)throw Error('非标准纯文字卡片，停止');const after=style(c.content);if(after.length>5000)throw Error('卡片超长');if(after!==c.content)plan.push({id:c.id,before:c.content,after,root:c.root_id});}
 const count=d.cards.length, ready=count-plan.length;
 if(!plan.length){showDialog('全部 '+count+' 张已是新版排版。卡片总数不变。','美化完成');return;}
 const BATCH_LIMIT=1; // 确认样卡效果后可改为 15，建议不要超过15。
 const batch=plan.slice(0,BATCH_LIMIT);if(!confirm('已有 '+ready+'/'+count+' 张新版卡片。\n本次原地美化 '+batch.length+' 张，保留卡片ID、章节和原答案。\n先保存本批修改前的备份，不创建、不删除卡片。\n确认继续？'))return;
 const filename='ENI-before-style-'+Date.now()+'.json';const snapshot=JSON.stringify({deck,...d});dir.writeFile(filename,snapshot);if(dir.readFile(filename)!==snapshot)throw Error('备份回读失败，未写入');
 let submitted=0;try{for(const x of batch){req('POST','/'+target+'/cards/'+x.id,{card:{content:x.after,grammar_version:3}});submitted++;}const v=state(), old=new Map(d.cards.map(c=>[c.id,c])), changed=new Map(batch.map(c=>[c.id,c.after]));if(v.cards.length!==count||v.chapters.some(ch=>JSON.stringify(ch.card_ids)!==JSON.stringify(d.chapters.find(z=>z.id===ch.id).card_ids)))throw Error('章节或数量变化');for(const c of v.cards){const prior=old.get(c.id);if(!prior||c.root_id!==prior.root_id||c.content!==(changed.has(c.id)?changed.get(c.id):prior.content))throw Error('回读内容或ID不一致，请检查备份');}}catch(e){throw Error('本批收到成功响应 '+submitted+' 张，未完成核验。'+e.message+'\n备份：'+filename);}
 showDialog('已核对 '+(ready+batch.length)+'/'+count+' 张新版卡片。\n本批更新 '+batch.length+' 张，总数 '+count+' 张不变。\n'+(ready+batch.length===count?'全部美化完成。':'请在本次结束后再次运行。'),'美化进度');
}
try{main();}catch(e){showDialog(String(e.message||e),'美化已停止');}
