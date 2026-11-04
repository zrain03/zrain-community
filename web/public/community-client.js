/*
 * Pembangun / Developer: Zrain
 * Dicipta / Created: Unknown (rekod asal belum disahkan)
 * Dikemas kini / Last updated: 2026-11-04
 * Fail / File: web/public/community-client.js
 * BM: Fail Community client dikekalkan mengikut kontrak Zrain Community.
 * EN: Preserve the Community client file according to Zrain Community contracts.
 */
(()=>{
  'use strict';
  const params=new URL(location.href).searchParams;
  const productId=params.get('product')||'';
  const instance=params.get('instance')||'';
  const $=id=>document.getElementById(id);
  const cfg=window.ZRAIN_COMMUNITY_CONFIG||{};
  const api=String(cfg.apiBase||'').replace(/\/$/,'');
  let tokenWidget=null,replyId=null,nextCursor=null,loading=false;let own=null;
  const localPreview=cfg.devMode===true&&location.hostname==='127.0.0.1';
  const list=$('commentsList'),loadMore=$('loadMore');
  const types={discussion:'Discussion',suggestion:'Suggestion',bug_report:'Bug report',appreciation:'Appreciation'};
  const roadmaps={under_review:'Under review',planned:'Planned',implemented:'Implemented'};
  const valid=/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId)&&productId.length<=80;
  const doc=document;
  // A comment management token is a 24-hour, per-comment capability, not an account.
  // Keep up to five unexpired tokens per product on this Community origin only.
  // Never copy them into the parent website or include them in a URL.
  const storageKey='zrain-community:comment-ownership:v1:'+productId;
  let owned=[],storageWorks=true;
  function validOwned(item){
    return item&&Number.isSafeInteger(item.id)&&item.id>0&&
      typeof item.key==='string'&&/^zrc_c_[0-9a-f]{64}$/.test(item.key)&&
      typeof item.text==='string'&&typeof item.expires==='string'&&
      Number.isFinite(Date.parse(item.expires))&&Date.parse(item.expires)>Date.now();
  }
  function saveOwned(){
    try{window.localStorage.setItem(storageKey,JSON.stringify(owned));storageWorks=true;return true;}
    catch{storageWorks=false;return false;}
  }
  function loadOwned(){
    try{
      const raw=window.localStorage.getItem(storageKey);
      const values=raw?JSON.parse(raw):[];
      owned=Array.isArray(values)?values.filter(validOwned).slice(0,5):[];
      if(raw&&(!Array.isArray(values)||values.length!==owned.length))saveOwned();
    }catch{owned=[];storageWorks=false;}
  }
  function selectOwned(item,expand=false){
    own=item||null;
    const panel=$('ownPanel');
    if(!own){panel.classList.add('hidden');panel.open=false;return;}
    panel.classList.remove('hidden');panel.open=!!expand;
    $('ownText').value=own.text;
    if(expand){panel.scrollIntoView({behavior:'smooth',block:'nearest'});$('ownText').focus();}
    resize();
  }
  function rememberOwned(item){
    owned=[item,...owned.filter(previous=>previous.id!==item.id)].slice(0,5);
    const saved=saveOwned();selectOwned(item,false);return saved;
  }
  function removeOwned(id){
    owned=owned.filter(item=>item.id!==id);saveOwned();selectOwned(owned[0]||null,false);
  }
  loadOwned();
  function node(tag,className,text){const x=doc.createElement(tag);if(className)x.className=className;if(text!==undefined)x.textContent=text;return x;}
  function status(element,message,kind=''){element.textContent=message;element.className='status '+kind;resize();}
  function resize(){if(!instance||window.parent===window)return;const height=Math.max(300,Math.ceil(doc.documentElement.scrollHeight+8));window.parent.postMessage({type:'zrain-community:height',instance,height},'*');}
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(doc.body);
  async function request(path,opts={}){
    const res=await fetch(api+path,{...opts,headers:{'Accept':'application/json',...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});
    const data=await res.json();if(!res.ok)throw Error(data.error||'Community is unavailable');return data;
  }
  function showComment(comment,isReply=false){
    const article=node('article','comment'+(isReply?' reply':''));
    const top=node('div','comment-top'),avatar=node('div','avatar',String(comment.name||'G').slice(0,1).toUpperCase());avatar.setAttribute('aria-hidden','true');
    top.append(avatar,node('strong','',comment.name||'Guest'));
    top.append(node('span','mini',new Date(comment.createdAt).toLocaleDateString()));
    if(!isReply)top.append(node('span','tag',types[comment.category]||'Discussion'));
    const thisMine=owned.find(item=>item.id===Number(comment.id));
    if(thisMine)top.append(node('span','tag zrc-your-comment','Your comment'));
    if(comment.roadmapStatus&&roadmaps[comment.roadmapStatus])top.append(node('span','tag',roadmaps[comment.roadmapStatus]));
    article.append(top,node('p','comment-text',comment.text));
    const actions=node('div','comment-actions');
    if(thisMine){const manage=node('button','','Manage my comment');manage.type='button';
      manage.addEventListener('click',()=>selectOwned(thisMine,true));actions.append(manage);}
    if(!isReply){const b=node('button','','Reply');b.type='button';b.addEventListener('click',()=>{
      replyId=comment.id;$('replyNote').classList.remove('hidden');$('replyLabel').textContent='Replying to '+comment.name;
      $('commentText').focus();resize();
    });actions.append(b);}
    const report=node('button','','Report');report.type='button';const panel=node('div','report-form hidden');
    const reason=node('select');reason.setAttribute('aria-label','Report reason');for(const [k,v]of [['spam','Spam'],['abusive','Abusive'],['off_topic','Off topic'],['other','Other']]){const opt=node('option','',v);opt.value=k;reason.append(opt);}
    const send=node('button','','Submit report');send.type='button';const msg=node('span','mini');
    send.addEventListener('click',async()=>{
      const t=turnstileToken();if(!t){msg.textContent='Complete the anti-spam check above first.';return;}
      send.disabled=true;try{await request('/api/reports',{method:'POST',body:JSON.stringify({productId,commentId:comment.id,reason:reason.value,turnstileToken:t})});msg.textContent='Report received.';resetTurnstile();}
      catch(e){msg.textContent=e.message;resetTurnstile();}finally{send.disabled=false;resize();}
    });panel.append(reason,send,msg);
    report.addEventListener('click',()=>{panel.classList.toggle('hidden');resize();});actions.append(report);article.append(actions,panel);
    return article;
  }
  function renderItem(c){const root=showComment(c);for(const reply of c.replies||[])root.append(showComment(reply,true));return root;}
  async function load(reset=false){
    if(loading)return;loading=true;loadMore.disabled=true;
    if(reset){nextCursor=null;list.replaceChildren(node('div','loading','Loading discussion...'));}
    try{
      const query=new URLSearchParams({productId,limit:'10',category:$('publicCategory').value,sort:$('publicSort').value});if(nextCursor)query.set('cursor',String(nextCursor));
      const data=await request('/api/comments?'+query);
      $('productLine').textContent=`${data.product.name} · Share your ideas, questions and experiences.`;
      if(reset)list.replaceChildren();
      for(const c of data.comments)list.append(renderItem(c));
      if(!list.children.length)list.append(node('div','empty','No comments yet. Start the conversation!'));
      nextCursor=data.nextCursor;loadMore.classList.toggle('hidden',!nextCursor);
      status($('listStatus'),'');
    }catch(e){if(reset)list.replaceChildren();status($('listStatus'),e.message,'error');}
    finally{loading=false;loadMore.disabled=false;resize();}
  }
  function turnstileToken(){if(localPreview)return 'LOCAL-PREVIEW-TOKEN';return window.turnstile&&tokenWidget!==null?window.turnstile.getResponse(tokenWidget):'';}
  function resetTurnstile(){if(!localPreview&&window.turnstile&&tokenWidget!==null)window.turnstile.reset(tokenWidget);}
  function renderTurnstile(){
    if(tokenWidget!==null)return;
    if(localPreview){tokenWidget='offline';$('turnstile').textContent='Local preview only: anti-spam verification is simulated. Production requires real Turnstile.';return;}
    if(!window.turnstile)return;
    if(!cfg.siteKey||cfg.siteKey==='REPLACE_ME'){status($('sendStatus'),'Turnstile site key has not been configured.','error');return;}
    tokenWidget=window.turnstile.render('#turnstile',{sitekey:cfg.siteKey,theme:'light'});resize();
  }
  if(!localPreview){const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.addEventListener('load',renderTurnstile);script.addEventListener('error',()=>status($('sendStatus'),'Anti-spam service unavailable. Try again later.','error'));document.head.append(script);}
  const clock=setInterval(()=>{if(tokenWidget!==null){clearInterval(clock);return;}renderTurnstile();},300);
  setTimeout(()=>clearInterval(clock),20000);
  $('cancelReply').addEventListener('click',()=>{replyId=null;$('replyNote').classList.add('hidden');resize();});
  $('commentForm').addEventListener('submit',async ev=>{
    ev.preventDefault();const token=turnstileToken();if(!token){status($('sendStatus'),'Please complete the anti-spam check first.','error');return;}
    $('sendBtn').disabled=true;status($('sendStatus'),'Submitting...');
    const body={productId,name:$('displayName').value,text:$('commentText').value,category:$('commentCategory').value,parentId:replyId,turnstileToken:token};
    try{const result=await request('/api/comments',{method:'POST',body:JSON.stringify(body)});
      status($('sendStatus'),result.message,'ok');
      if(result.id&&result.manageToken&&result.manageExpiresAt){
        const saved=rememberOwned({id:Number(result.id),key:result.manageToken,text:body.text,expires:result.manageExpiresAt});
        if(!saved)status($('sendStatus'),'Published, but this browser blocks saving edit access. This comment may not be recognized after refresh.','ok');
      }
      $('commentText').value='';replyId=null;$('replyNote').classList.add('hidden');await load(true);}
    catch(e){status($('sendStatus'),e.message,'error');}
    finally{$('sendBtn').disabled=false;resetTurnstile();resize();}
  });
  $('ownEdit').addEventListener('click',async()=>{
    if(!own)return;
    try{const d=await request('/api/comments/'+own.id,{method:'PATCH',headers:{'X-Comment-Token':own.key},body:JSON.stringify({productId,text:$('ownText').value})});
      own.text=$('ownText').value;saveOwned();status($('ownStatus'),d.message,'ok');await load(true);}
    catch(e){status($('ownStatus'),e.message,'error');}
  });
  $('ownDelete').addEventListener('click',async()=>{
    if(!own||!confirm('Permanently delete your recent comment?'))return;
    try{const id=own.id;await request('/api/comments/'+id,{method:'DELETE',headers:{'X-Comment-Token':own.key}});
      removeOwned(id);status($('sendStatus'),'Your comment was deleted.','ok');await load(true);}
    catch(e){status($('ownStatus'),e.message,'error');}
  });
  loadMore.addEventListener('click',()=>void load(false));
  $('publicCategory').addEventListener('change',()=>void load(true));
  $('publicSort').addEventListener('change',()=>void load(true));
  if(owned.length)selectOwned(owned[0],false);
  if(!valid||!api.startsWith('http')){
    $('commentForm').classList.add('hidden');list.replaceChildren();status($('listStatus'),'Community configuration is missing or invalid.','error');
  }else void load(true);
  resize();
})();
