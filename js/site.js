
(() => {
  const body = document.body;
  const page = body.dataset.page || '';
  const nav = document.getElementById('site-nav');
  const toggle = document.getElementById('menu-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === page) link.classList.add('active');
  });
  const back = document.getElementById('back-to-top');
  if (back) back.addEventListener('click', e => { e.preventDefault(); window.scrollTo({top:0, behavior:'smooth'}); });

  const storeKey = 'oudeMolenDemoV1';
  const escText = x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const decodeText=x=>String(x??'').replace(/&(amp|lt|gt|quot|#39);/g,(_,c)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[c]));
  const safeText=(item,k)=>escText(item.studioEscaped?decodeText(item[k]):item[k]);
  const defaultData = { announcements: [], events: [], documents: [], gallery: [] };
  const getData = () => {
    try { const raw=JSON.parse(localStorage.getItem(storeKey)||'{}'); return Object.fromEntries(Object.keys(defaultData).map(k=>[k,Array.isArray(raw?.[k])?raw[k].filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[]])); }
    catch { return structuredClone(defaultData); }
  };
  const saveData = data => localStorage.setItem(storeKey, JSON.stringify(data));

  const renderAnnouncements = () => {
    const target = document.getElementById('announcements');
    if (!target) return;
    const items = getData().announcements;
    target.innerHTML = items.length ? items.slice().reverse().map(item => `
      <article class="announcement-card">
        <strong>${safeText(item,"title")}</strong>
        <p>${safeText(item,"body")}</p>
        <small>${escText(item.date || 'Demo update')}</small>
      </article>`).join('') : `<div class="empty-state">No demo announcements yet. Use the Staff Demo page to add one.</div>`;
  };

  const renderDocs = () => {
    const target = document.getElementById('documents-list'); if (!target) return;
    const categories = ['General','Admissions','Policies','Academics'];
    const samples = [
      ['School Prospectus','General','An example of a guide to school life, facilities and values.'],
      ['Grade 8 Application Form','Admissions','An example listing for admissions forms and application guidance.'],
      ['School Code of Conduct','Policies','An example listing for school expectations and learner responsibilities.'],
      ['2026 Examination Timetable','Academics','An example listing for assessment schedules; no actual dates are supplied.'],
      ['Parent Information Guide','General','An example listing for school communication and parent information.'],
      ['Subject Selection Guide','Academics','An example listing for subject choices and academic pathways.']
    ].map(([title,category,body])=>({title,category,body,sample:true}));
    const docs = [...samples,...getData().documents.map(d=>({...d,category:categories.includes(d.category)?d.category:'General'}))];
    const safeLink = url => { try {const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';} };
    const icons={General:'<path d="M7 5h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V8a3 3 0 0 1 2-3ZM5 17h14M9 9h6"/>',Admissions:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h4"/>',Policies:'<path d="M12 2 21 6v6c0 5-5 8-9 10-4-2-9-5-9-10V6Z M8 12l3 3 5-6"/>',Academics:'<path d="m2 8 10-5 10 5-10 5Z M6 10v6q6 5 12 0v-6M22 8v8"/>'};
    const search=document.getElementById('doc-search'), filters=document.getElementById('doc-filters'), dialog=document.getElementById('doc-preview'), frame=document.getElementById('doc-frame'), link=document.getElementById('doc-preview-link'); let active='All';
    // Documents-only statistics: animate once per page load when the strip enters view.
    const stats=document.querySelector('.resource-stats');
    document.getElementById('doc-count').textContent=String(docs.length).padStart(2,'0');
    if(stats && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      const numbers=Array.from(stats.querySelectorAll('strong'));
      const targets=[docs.length,4,24];
      const format=(n,i)=>i===2?`${n}/7`:String(n).padStart(2,'0');
      numbers.forEach((n,i)=>n.textContent=format(0,i));
      let started=false;
      const observer=new IntersectionObserver(entries=>{
        if(started || !entries.some(e=>e.isIntersecting && e.intersectionRatio>=0.35))return;
        started=true;observer.disconnect();
        let start;
        function tick(now){
          if(start===undefined)start=now;
          const progress=Math.min(1,(now-start)/1400), eased=1-Math.pow(1-progress,3);
          numbers.forEach((n,i)=>n.textContent=format(Math.floor(targets[i]*eased),i));
          if(progress<1)requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },{threshold:0.35});
      observer.observe(stats);
    }
    const el=(tag,cls,text)=>{let n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
    const show=d=>{document.getElementById('doc-preview-title').textContent=d.title;document.getElementById('doc-preview-text').textContent=(d.body||'')+(d.sample?' This is a demonstration entry only; no official PDF has been provided.':' This link was added locally and has not been verified by the school.');const url=safeLink(d.url);link.hidden=!url;frame.hidden=!(url&&/\.pdf(?:[?#]|$)/i.test(url));if(url)link.href=url;if(!frame.hidden)frame.src=url;dialog.showModal();};
    document.getElementById('doc-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{frame.removeAttribute('src');frame.hidden=true;});
    function draw(){target.replaceChildren();const q=search.value.trim().toLowerCase();const entries=docs.filter(d=>(active==='All'||d.category===active)&&[d.title,d.body,d.category].join(' ').toLowerCase().includes(q));document.getElementById('doc-results').textContent=`${entries.length} document entries`;filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===active)));for(const d of entries){const card=el('article','doc-card resource-card');const top=el('div','resource-top');const icon=el('span','resource-icon '+d.category.toLowerCase());icon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[d.category]+'</svg>';top.append(icon,el('span','resource-tag',d.sample?'SAMPLE':safeLink(d.url)?'EXTERNAL LINK':'LOCAL DEMO'));const controls=el('div','resource-controls');const preview=el('button','small-btn','Preview entry');preview.type='button';preview.onclick=()=>show(d);controls.append(preview);const url=safeLink(d.url);if(url){const open=el('a','resource-open','Open / download ↗');open.href=url;open.target='_blank';open.rel='noopener noreferrer';controls.append(open);}card.append(top,el('small','resource-category',d.category),el('h3','',d.title),el('p','',d.body),controls);target.append(card);}if(!entries.length)target.append(el('p','empty-state','No matching documents.'));}
    for(const c of ['All',...categories]){const b=el('button','small-btn',c);b.type='button';b.onclick=()=>{active=c;draw();};filters.append(b);}search.addEventListener('input',draw);draw();
  };

  const renderGalleryList = () => {
    const target = document.getElementById('gallery-list');
    if (!target) return;
    const extras = getData().gallery;
    if (!extras.length) return;
    target.insertAdjacentHTML('beforeend', extras.slice().reverse().map((item, i) => `
      <article class="story-card" data-category="Local demo">
        <div class="story-art"><img src="assets/images/demo-gallery.svg" alt="Illustrative local demo graphic"></div>
        <div class="story-text"><span class="eyebrow">Demo gallery</span><h3>${safeText(item,"title")}</h3><p>${safeText(item,"body")}</p></div>
      </article>`).join(''));
  };

  const renderStats = () => {
    const target = document.getElementById('dashboard-counts');
    if (!target) return;
    const d = getData();
    const items = [
      ['Updates', d.announcements.length],
      ['Events', d.events.length],
      ['Documents', d.documents.length],
      ['Gallery', d.gallery.length],
    ];
    target.innerHTML = items.map(([label, count]) => `<div><strong>${count}</strong><span>${label}</span></div>`).join('');
  };

  const renderPreview = () => {
    const target = document.getElementById('dashboard-preview');
    if (!target) return;
    const d = getData();
    const merged = [
      ...d.announcements.map(x => ({type:'Update', ...x})),
      ...d.events.map(x => ({type:'Event', ...x})),
      ...d.documents.map(x => ({type:'Document', ...x})),
      ...d.gallery.map(x => ({type:'Gallery', ...x}))
    ].slice().reverse();
    target.innerHTML = merged.length ? merged.map(item => `<div class="preview-card"><strong>${item.type}: ${safeText(item,"title")}</strong><p>${safeText(item,"body")}</p><small>${escText(item.date || 'Demo item')}</small></div>`).join('') : '<div class="empty-state">No demo content yet.</div>';
  };

  const fieldSets = {
    announcement: `
      <label>Headline<input name="title" required placeholder="School closes early on Friday"></label>
      <label>Update text<textarea name="body" required placeholder="Write the demo announcement..."></textarea></label>
      <label>Date<input name="date" type="date"></label>`,
    event: `
      <label>Event name<input name="title" required placeholder="Matric Parent Meeting"></label>
      <label>Event details<textarea name="body" required placeholder="Time, venue and note..."></textarea></label>
      <label>Date<input name="date" type="date"></label>`,
    document: `
      <label>Document title<input name="title" required placeholder="Admissions Form"></label>
      <label>Description<textarea name="body" placeholder="What is this document for?"></textarea></label>
      <label>Category<select name="category"><option>General</option><option>Admissions</option><option>Policies</option><option>Academics</option></select></label>
      <label>External document URL (optional)<input name="url" type="url" placeholder="https://example.org/document.pdf" pattern="https?://.+"></label>
      <label>Date<input name="date" type="date"></label>`,
    gallery: `
      <label>Gallery title<input name="title" required placeholder="Open Day Highlights"></label>
      <label>Caption<textarea name="body" placeholder="Short gallery caption..."></textarea></label>
      <label>Date<input name="date" type="date"></label>`
  };

  const renderFields = (tab = 'announcement') => {
    const fields = document.getElementById('staff-fields');
    if (!fields) return;
    fields.innerHTML = fieldSets[tab];
    fields.dataset.activeTab = tab;
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  };

  if (page === 'staff-login') {
    const loginForm = document.getElementById('login-form');
    const msg = document.getElementById('login-message');
    if (loginForm) loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const ok = fd.get('username') === 'staff' && fd.get('password') === 'demo123';
      if (ok) { sessionStorage.setItem('oudeMolenDemoAuth', 'yes'); location.href = 'staff-demo.html'; }
      else if (msg) { msg.textContent = 'Incorrect demo credentials. Try staff / demo123.'; }
    });
  }

  if (page === 'staff-demo') {
    if (sessionStorage.getItem('oudeMolenDemoAuth') !== 'yes') {
      location.href = 'staff-login.html';
      return;
    }
    renderStats();
    renderPreview();
    renderFields('announcement');
    document.querySelectorAll('.tabs button').forEach(btn => btn.addEventListener('click', () => renderFields(btn.dataset.tab)));
    const form = document.getElementById('staff-form');
    const status = document.getElementById('form-status');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const fields = document.getElementById('staff-fields');
      const tab = fields.dataset.activeTab;
      const fd = new FormData(form);
      const item = Object.fromEntries(fd.entries());
      const data = getData();
      const map = {announcement:'announcements', event:'events', document:'documents', gallery:'gallery'}; data[map[tab]].push(item);
      saveData(data);
      renderStats(); renderPreview();
      form.reset(); renderFields(tab);
      if (status) status.textContent = `${tab.charAt(0).toUpperCase()+tab.slice(1)} saved to the local demo.`;
    });
    const reset = document.getElementById('reset-demo');
    if (reset) reset.addEventListener('click', () => { saveData(structuredClone(defaultData)); renderStats(); renderPreview(); });
    const logout = document.getElementById('logout-demo');
    if (logout) logout.addEventListener('click', () => { sessionStorage.removeItem('oudeMolenDemoAuth'); location.href = 'staff-login.html'; });
  }

  const renderCalendar = () => {
    const grid = document.getElementById('calendar-grid'); if (!grid) return;
    const monthTitle = document.getElementById('month-title'), selectedDate = document.getElementById('selected-date'), dayEvents = document.getElementById('day-events'), upcomingEvents = document.getElementById('upcoming-events');
    const now=new Date(); const prefix=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const samples = [
      {date:'2026-11-12',title:'Year-end assessment preparation',short:'Revision',type:'academic',body:'Illustrative November revision and assessment preparation session. This is a demonstration event, not an official school date.'},
      {date:'2026-11-19',title:'Matric parent briefing',short:'Matric briefing',type:'community',body:'Illustrative information session for Grade 12 families about final preparation and support.'},
      {date:'2026-11-26',title:'Community open afternoon',short:'Open afternoon',type:'school',body:'Illustrative showcase celebrating learner work, school history and community engagement.'}
    ];
    samples.push(
      {date:'2026-12-02',title:'Year-end academic awards',short:'Awards',type:'school',body:'Illustrative learner recognition ceremony. Demonstration only; not an official school event.'},
      {date:'2026-12-04',title:'Teacher assessment moderation',short:'Staff review',type:'staff',body:'Teachers only: illustrative assessment moderation and year-end record review.'},
      {date:'2026-12-09',title:'Learner report collection',short:'Reports',type:'academic',body:'Illustrative report collection for learners and families. Confirm actual arrangements with the school.'},
      {date:'2026-12-11',title:'Teacher year-end administration',short:'Staff admin',type:'staff',body:'Teachers only: illustrative final administration and planning session.'}
    );
    const labels={academic:'Academic',community:'Community',school:'School event',staff:'Teachers only'};
    const events=[...samples,...getData().events.filter(e=>!samples.some(x=>x.date===e.date&&(x.title===e.title||x.title+' demo'===e.title)))].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const kind=e=>Object.hasOwn(labels,e.type)?e.type:'school';
    const dateText=iso=>new Date(iso+'T12:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'long',year:'numeric'});
    const detail=e=>`<article class="calendar-event-detail event-${kind(e)}"><span class="event-label">${labels[kind(e)]} · Demo</span><strong>${esc(e.title)}</strong><p>${esc(e.body)}</p><small>${esc(dateText(e.date))}</small></article>`;
    grid.insertAdjacentHTML('beforebegin','<div class="calendar-legend"><span class="event-academic">Academic</span><span class="event-community">Community</span><span class="event-school">School event</span><span class="event-staff">Teachers only</span></div>');
    let current=new Date(now.getFullYear(),now.getMonth(),1), selected='';
    const choose=iso=>{selected=iso; selectedDate.textContent=dateText(iso);const items=events.filter(e=>e.date===iso);dayEvents.innerHTML=items.length?items.map(detail).join(''):'<div class="empty-state">No demonstration events on this date.</div>';grid.querySelectorAll('button[data-date]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.date===iso)));};
    const render=()=>{const y=current.getFullYear(),m=current.getMonth(),start=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate(); monthTitle.textContent=current.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});grid.innerHTML=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<strong>${x}</strong>`).join('');for(let i=0;i<start;i++)grid.insertAdjacentHTML('beforeend','<div class="day-cell empty"></div>');for(let d=1;d<=days;d++){const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,items=events.filter(e=>e.date===iso),b=document.createElement('button');b.className='day-cell';b.type='button';b.dataset.date=iso;const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;if(iso===today){b.classList.add('om-today');b.setAttribute('aria-current','date');}b.setAttribute('aria-label',dateText(iso)+ (items.length?', '+items.map(e=>e.title).join(', '):''));b.innerHTML=`<span class="day-number">${d}</span>`+items.map(e=>`<span class="event-pill event-${kind(e)}">${esc(e.short||e.title)}</span>`).join('');b.onclick=()=>choose(iso);grid.appendChild(b);}selected='';selectedDate.textContent=monthTitle.textContent;dayEvents.innerHTML='<div class="empty-state">Select a date to preview demonstration events.</div>';const prefix=`${y}-${String(m+1).padStart(2,'0')}`;const list=events.filter(e=>e.date.startsWith(prefix));upcomingEvents.innerHTML=list.length?list.map(detail).join(''):'<div class="empty-state">No demonstration events this month.</div>';};
    document.getElementById('prev-month').onclick=()=>{current=new Date(current.getFullYear(),current.getMonth()-1,1);render();};document.getElementById('next-month').onclick=()=>{current=new Date(current.getFullYear(),current.getMonth()+1,1);render();};document.getElementById('today-month').onclick=()=>{const now=new Date();current=new Date(now.getFullYear(),now.getMonth(),1);render();choose(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);};render();
  };

  renderAnnouncements();
  renderDocs();
  renderGalleryList();
  renderCalendar();
})();

// A small, diffuse white highlight follows a mouse within each blue banner.
document.querySelectorAll('.hero').forEach(hero => {
  hero.addEventListener('pointermove', e => {
    if(e.pointerType !== 'mouse'||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    hero.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
    hero.classList.add('pointer-lit');
  });
  hero.addEventListener('pointerleave', () => hero.classList.remove('pointer-lit'));
});


;(()=>{
 const root=document.querySelector('.editorial-panel'); if(!root)return;
 const cards=[...root.querySelectorAll('[data-review]')],dots=[...root.querySelectorAll('[data-review-dot]')],pause=root.querySelector('[data-review-pause]'),slides=root.querySelector('.editorial-slides');
 let index=0, stopped=window.matchMedia('(prefers-reduced-motion: reduce)').matches, timer=null;
 function show(n){index=(n+cards.length)%cards.length;cards.forEach((c,i)=>c.hidden=i!==index);dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===index)));}
 function start(){window.clearInterval(timer);timer=null;if(!stopped&&!document.hidden)timer=window.setInterval(()=>show(index+1),8000);}
 function sync(){pause.textContent=stopped?'▶':'Ⅱ';pause.setAttribute('aria-label',stopped?'Resume automatic rotation':'Pause automatic rotation');slides.setAttribute('aria-live',stopped?'polite':'off');}
 function manual(n){show(n);start();}
 root.querySelector('[data-review-prev]').addEventListener('click',()=>manual(index-1));root.querySelector('[data-review-next]').addEventListener('click',()=>manual(index+1));dots.forEach((d,i)=>d.addEventListener('click',()=>manual(i)));
 pause.addEventListener('click',()=>{stopped=!stopped;sync();start();});document.addEventListener('visibilitychange',start);show(0);sync();start();
})();

// Source-image fallback: preserve the actual source link; never invent a school photograph.
for(const im of document.querySelectorAll('img[data-fallback]')){const fail=()=>{if(!im.dataset.failed){im.dataset.failed='yes';im.src=im.dataset.fallback;im.alt='Source image unavailable — see the credited original';}};im.addEventListener('error',fail);if(im.complete&&!im.naturalWidth)fail();}
// One-time count-up and accessible reduced-motion defaults.
const countNodes=[...document.querySelectorAll('[data-om-count]')];const reducedOM=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reducedOM&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;observer.unobserve(e.target);const n=Number(e.target.dataset.omCount),suffix=e.target.dataset.omSuffix||'';let start;const frame=t=>{start??=t;const p=Math.min(1,(t-start)/1400);e.target.textContent=Math.round(n*(1-(1-p)**3))+suffix;if(p<1)requestAnimationFrame(frame)};requestAnimationFrame(frame)}},{threshold:.3});countNodes.forEach(n=>observer.observe(n));}
// Escape closes a mobile navigation menu.
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const n=document.getElementById('site-nav'),b=document.getElementById('menu-toggle');n?.classList.remove('open');b?.setAttribute('aria-expanded','false');}});
