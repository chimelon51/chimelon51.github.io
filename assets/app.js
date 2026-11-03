(() => {
  'use strict';
  const root = new URL(document.documentElement.dataset.siteRoot || './', document.baseURI);
  const dialog = document.getElementById('search-dialog');
  const results = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const input = document.getElementById('dialog-query');
  const key = location.pathname;
  let indexPromise, toastTimer;
  function toast(message) {
    const node = document.getElementById('site-toast');
    node.textContent = message; node.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2800);
  }
  function loadIndex() {
    if (window.NOVEL_SEARCH_INDEX) return Promise.resolve(window.NOVEL_SEARCH_INDEX);
    if (!indexPromise) indexPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('assets/search-index.js', root).href;
      script.onload = () => resolve(window.NOVEL_SEARCH_INDEX || []);
      script.onerror = () => {indexPromise = null; reject(new Error('index'));};
      document.head.appendChild(script);
    });
    return indexPromise;
  }
  function openSearch() { if (!dialog.open) dialog.showModal(); input.focus(); }
  async function search(query) {
    query = query.trim().slice(0, 100); openSearch(); input.value = query;
    if (!query) {status.textContent = '请输入书名或故事关键词。'; return;}
    status.textContent = '正在搜索…'; results.replaceChildren();
    try {
      const entries = await loadIndex(), term = query.toLocaleLowerCase();
      const found = entries.filter(x => x.t.toLocaleLowerCase().includes(term) || x.d.toLocaleLowerCase().includes(term));
      status.textContent = found.length ? `找到 ${found.length} 篇，显示前 ${Math.min(30, found.length)} 篇。` : '暂未找到匹配的故事，请换个关键词。';
      found.slice(0, 30).forEach(x => {
        const link = document.createElement('a'), title = document.createElement('strong'), desc = document.createElement('p');
        link.href = new URL(x.p, root).href; title.textContent = x.t; desc.textContent = x.d;
        link.append(title, desc); results.append(link);
      });
    } catch (_) {status.textContent = '搜索索引加载失败，请检查 assets 文件夹是否完整。';}
  }
  document.querySelectorAll('[data-search-form]').forEach(form => form.addEventListener('submit', event => {event.preventDefault(); search(new FormData(form).get('q') || '');}));
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', openSearch));
  document.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {if (event.target === dialog) {const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  document.querySelector('[data-menu-toggle]').addEventListener('click', event => {
    const button=event.currentTarget, open=document.getElementById('main-menu').classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));
  });
  document.querySelectorAll('[data-home]').forEach(node => {
    const go = () => {location.href=node.dataset.home;};node.addEventListener('click',go);node.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  });
  function toggleSaved(type, button) {
    try {const id='yunlan-'+type+'-'+key, active=localStorage.getItem(id)!=='1';localStorage.setItem(id,active?'1':'0');button.setAttribute('aria-pressed',String(active));toast(active?(type==='bookmark'?'已收藏到当前浏览器':'已记录喜欢'):'已取消');}
    catch(_){toast('当前浏览器无法保存，请使用浏览器收藏功能。');}
  }
  document.querySelectorAll('[data-action]').forEach(button => {
    const action=button.dataset.action;
    if(action==='bookmark'||action==='like'){try{button.setAttribute('aria-pressed',String(localStorage.getItem('yunlan-'+action+'-'+key)==='1'));}catch(_){}}
    button.addEventListener('click', async () => {
      if(action==='bookmark'||action==='like')return toggleSaved(action,button);
      if(action==='top')return window.scrollTo({top:0,behavior:'smooth'});
      if(action==='share'){
        const url=document.querySelector('link[rel=canonical]').href;
        try{await navigator.clipboard.writeText(url);toast('已复制页面链接');}catch(_){window.prompt('复制这个页面链接：',url);}
      }
    });
  });
  const query=new URL(location.href).searchParams.get('q');if(query)search(query);
  document.querySelectorAll('img.lazy-load').forEach(img=>{if(img.complete)img.classList.remove('lazy-load');else img.addEventListener('load',()=>img.classList.remove('lazy-load'),{once:true});});
})();
