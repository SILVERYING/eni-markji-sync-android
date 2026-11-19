// ENI-sync-v2: only add cards to the unified private English deck.
function main(){
 const name='考研英语一·作文语料';
 const names=['01 图画与图表描述','02 开篇与主旨提炼','03 因果与机制论证','04 对比与多角度论证','05 结尾与行动建议','06 通用主题语料','07 小作文功能句','08 个人错题与迁移'];
 const raw=getClipboardContent(); let p;try{p=JSON.parse((raw||'').trim());}catch(e){throw Error('请先复制新版 ENI-sync-v2 JSON，不要复制脚本或正文。');}
 if(!p||p.format!=='ENI-sync-v2'||!Array.isArray(p.cards)||p.cards.length<1||p.cards.length>5)throw Error('仅接受 ENI-sync-v2，每批1–5张。');
 const norm=s=>s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
 function answer(s){if(typeof s!=='string')return '';const parts=s.split('\n---\n');if(parts.length!==2)return '';const m=parts[1].match(/\[T#!6b7280#(?:参考表达|高频搭配|迁移答案)\]\s*\[T#B,!1d4ed8#([^\]]+)\]/);return m?norm(m[1]):'';}
 for(const c of p.cards)if(!c||c.deck!==name||!names.includes(c.chapter)||typeof c.content!=='string'||c.content.length>5000||!answer(c.content))throw Error('牌组、章节或卡片格式错误。');
 const token=String(getVariable('markji_token')||'').trim();if(!token||/\s/.test(token))throw Error('检查本地 Token');
 const base='https://open.maimemo.com/open/api/v1/markji/decks',headers={Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'};let last=0;
 function req(method,path,body){const pause=2100-(Date.now()-last);if(last&&pause>0)wait(pause);const opts={method,headers,followRedirects:false};if(body!==undefined)opts.body=JSON.stringify(body);last=Date.now();const r=sendHttpRequest(base+path,opts);if(r.status!=='success'||!r.response||r.response.statusCode<200||r.response.statusCode>=300)throw Error(method+' 失败：'+(r.response?'HTTP '+r.response.statusCode:'网络异常')+'；请先检查牌组再重试。');const j=JSON.parse(r.response.body);if(j.success!==true||!Array.isArray(j.errors)||j.errors.length||!j.data)throw Error('API 未确认成功');return j.data;}
 const matches=req('GET','').decks.filter(d=>d.name===name&&d.source==='SELF'&&d.is_private===true&&d.status==='NORMAL');if(matches.length!==1)throw Error('必须恰好存在一个同名、自建、私有、正常的英语牌组。');const d0=matches[0],target=d0.id;if(typeof target!=='string'||!/^mkjd_[A-Za-z0-9_.-]+$/.test(target))throw Error('牌组ID异常');
 function state(){const d=req('GET','/'+target+'/chapters?with_cards=true');if(!d.chapterset||d.chapterset.deck_id!==target||!Array.isArray(d.chapters)||!Array.isArray(d.cards)||d.chapters.length!==8||names.some(n=>d.chapters.filter(ch=>ch.name===n&&ch.deck_id===target).length!==1))throw Error('统一牌组章节不符');if(!Array.isArray(d.chapterset.chapter_ids)||d.chapterset.chapter_ids.length!==8||new Set(d.chapterset.chapter_ids).size!==8||d.chapters.some(ch=>!d.chapterset.chapter_ids.includes(ch.id)))throw Error('章节目录不一致');const map=new Map(d.cards.map(c=>[c.id,c]));const ids=new Set();if(map.size!==d.cards.length)throw Error('卡片ID重复');for(const ch of d.chapters){if(!Array.isArray(ch.card_ids))throw Error('章节数据不完整');for(const id of ch.card_ids){if(ids.has(id)||!map.has(id)||map.get(id).deck_id!==target)throw Error('卡片归属异常');ids.add(id);}}if(ids.size!==map.size)throw Error('卡片返回不完整');return d;}
 let d=state();if(d.cards.length!==d0.card_count)throw Error('牌组数量异常，请先核对。');
 const seen=new Set(d.cards.map(c=>answer(c.content)).filter(Boolean));const unknown=d.cards.filter(c=>!answer(c.content)).length;const existing=new Set(d.cards.map(c=>c.content));let skip=0;const plan=[];
 for(const c of p.cards){const a=answer(c.content);if(seen.has(a)||existing.has(c.content)){skip++;continue;}seen.add(a);existing.add(c.content);plan.push({c,ch:d.chapters.find(x=>x.name===c.chapter).id});}
 if(!plan.length){showDialog('全部重复，新增0张，跳过'+skip+'张。','英一同步');return;}
 if(!confirm((unknown?'注意：'+unknown+'张非标准卡无法按答案查重。\n':'')+'统一英语牌组：将新增'+plan.length+'张，跳过'+skip+'张。\n'+plan.map(x=>x.c.chapter+'\n'+x.c.content.split('\n---\n')[0].replace(/\[T#[^#]*#([^\]]+)\]/g,'$1').replace(/\[P#[^#]*#([^\]]+)\]/g,'$1')).join('\n\n')+'\n确认写入？'))return;
 let done=0;try{for(const x of plan){req('POST','/'+target+'/chapters/'+x.ch+'/cards',{card:{content:x.c.content,grammar_version:3}});d=state();if(d.cards.length!==d0.card_count+done+1)throw Error('回读数量异常，请检查是否有并发修改');const ch=d.chapters.find(y=>y.id===x.ch);if(!ch||!d.cards.some(y=>ch.card_ids.includes(y.id)&&y.content===x.c.content))throw Error('回读未确认，请检查墨墨。');done++;}}catch(e){throw Error('已回读确认'+done+'张；'+e.message);}
 showDialog('新增'+done+'张，跳过'+skip+'张。现有'+d.cards.length+'张。','同步成功');
}
try{main();}catch(e){showDialog(String(e.message||e),'墨墨同步已停止');}
