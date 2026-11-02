/* NIRAVLE Supabase storefront — preserves current site settings and connects
   admin Price (price) + Compare / old price (compare_price) to sale display. */
(function(){
  'use strict';
  const ready=window.NIRAVLE_SUPABASE_URL&&!window.NIRAVLE_SUPABASE_URL.includes('YOUR_')&&window.NIRAVLE_SUPABASE_ANON_KEY&&!window.NIRAVLE_SUPABASE_ANON_KEY.includes('YOUR_');
  if(!ready||!window.supabase)return;
  const sb=window.supabase.createClient(window.NIRAVLE_SUPABASE_URL,window.NIRAVLE_SUPABASE_ANON_KEY);
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const setting={};
  async function load(){
    const [settingsRes,productsRes]=await Promise.all([
      sb.from('site_settings').select('key,value'),
      sb.from('products').select('*').eq('active',true).order('featured',{ascending:false}).order('sort_order',{ascending:true}).order('created_at',{ascending:false})
    ]);
    if(settingsRes.data)settingsRes.data.forEach(x=>setting[x.key]=x.value);
    applySettings();
    if(productsRes.error){console.error('NIRAVLE: products load failed',productsRes.error.message);return;}
    renderProducts(productsRes.data||[]);
  }
  function text(key,fallback){return setting[key]||fallback||'';}
  function lines(key,fallback){return text(key,fallback).split('|').map(esc).join('<br>');}
  function setText(sel,key,fallback){const el=document.querySelector(sel);if(el)el.innerHTML=esc(text(key,fallback)).replace(/\n/g,'<br>');}
  function setLines(sel,key,fallback){const el=document.querySelector(sel);if(el)el.innerHTML=lines(key,fallback);}
  function setImg(sel,key,fallback){const el=document.querySelector(sel);if(!el)return;const u=text(key,'');if(u)el.src=u;else if(fallback)el.src=fallback;}
  function applySettings(){
    document.title=text('brand_name','NIRAVLE')+' — '+text('tagline','Defined with elegance');
    setText('.top','announcement','NIRAVLE · DEFINED WITH ELEGANCE');
    document.querySelectorAll('.brand-lockup span,.hero h1,.final-logo').forEach(e=>e.textContent=text('brand_name','NIRAVLE'));
    setText('.mini','hero_eyebrow','The NIRAVLE identity');setText('.hero-logo-label','tagline','Defined with elegance');setText('.tagline','tagline','Defined with elegance');
    setLines('.intro h2','intro_title','A quiet identity.|A clear presence.');setText('.intro-copy','intro_text','NIRAVLE is built around a simple idea: clothing should elevate the person wearing it.');
    setText('.values h2','meaning_title','The NIRAVLE code');setLines('.identity h2','identity_title','One world, every touchpoint.');
    const cap=document.querySelectorAll('.identity-card .caption');if(cap[0])cap[0].textContent=text('identity_caption','The NIRAVLE identity');if(cap[1])cap[1].textContent=text('palette_caption','Signature palette');if(cap[2])cap[2].textContent=text('mark_caption','Signature mark');
    setLines('.botanical-section h2','botanical_title','Where nature meets refinement.');setText('.botanical-section p','botanical_text','The botanical detail is part of the NIRAVLE visual language.');
    setLines('.shop h2','collection_title','The NIRAVLE collection.');setText('.shop-intro','collection_intro','Every piece will carry its own image, name, category and price.');
    setLines('.packaging > h2','packaging_title','The NIRAVLE experience.');setText('.packaging-side .kicker','packaging_kicker','Signature packaging');setLines('.packaging-side h3','packaging_headline','One identity.|Every detail.');setText('.packaging-side p','packaging_text','The NIRAVLE mark, botanical language and refined palette continue across every touchpoint.');
    setText('.final-sub','final_subtitle','Defined with elegance');setText('.contact','final_contact','A brand built on identity · refinement · authenticity');
    const foot=document.querySelectorAll('.footer span');if(foot[0])foot[0].textContent=text('footer_left','© 2026 NIRAVLE');if(foot[1])foot[1].textContent=text('footer_right','More than just clothes.');
    setImg('.brand-lockup img','logo_url','assets_nstar_logo.png');setImg('.mark img','logo_url','assets_nstar_logo.png');setImg('.hero-mark img','logo_url','assets_nstar_logo.png');setImg('.identity-card.tall img','identity_image_url','assets/brand-identity.png');setImg('.hero-identity','hero_image_url','assets/brand-identity.png');setImg('.packaging-main img','packaging_image_url','assets_packaging-latest.png');
    const botanical=text('botanical_image_url','');if(botanical){const p=document.querySelector('.packaging-side');if(p)p.style.setProperty('--botanical-url',`url("${botanical.replace(/["\\\n\r]/g,'')}")`);}
    const nav=document.querySelector('.brand-lockup');if(nav)nav.setAttribute('aria-label',text('brand_name','NIRAVLE')+' home');
  }
  function galleryURLs(value){let list=value;if(typeof list==='string'){try{list=JSON.parse(list)}catch{list=[]}}if(!Array.isArray(list))return [];return [...new Set(list.filter(u=>typeof u==='string'&&/^https?:\/\//i.test(u.trim())).map(u=>u.trim()))].slice(0,12);}
  const taka=v=>'৳ '+Number(v).toLocaleString('en-BD',{maximumFractionDigits:2});
  function validNumber(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
  function renderProducts(items){
    const grid=document.getElementById('productGrid');if(!grid)return;
    if(!items.length){grid.innerHTML='<div class="empty-products"><strong>Your collection begins here.</strong><span>Products will appear here automatically after they are published from the NIRAVLE product dashboard.</span></div>';return;}
    grid.innerHTML=items.map(p=>{
      const galleries=galleryURLs(p.gallery_images),price=validNumber(p.price),old=validNumber(p.compare_price);
      const sale=price!==null&&price>0&&old!==null&&old>price;
      const original=sale?old:price;
      const reduction=sale?Math.round((old-price)/old*100):0;
      const priceHTML=price===null?'Price on request':sale?`<span class="product-offer-price">${taka(price)}</span> <s class="nv-old-price">${taka(old)}</s> <span class="nv-discount">${reduction}% OFF</span>`:taka(price);
      // The base price + offer attributes are consumed by index.html's cart/detail code.
      return `<article class="product-card" data-product-id="${esc(p.id)}" data-id="${esc(p.id)}" data-category="${esc(p.category||'')}" data-name="${esc(p.name||'')}" ${original!==null?`data-price="${original}"`:''} ${sale?`data-offer-price="${price}"`:''} data-images="${esc(JSON.stringify(galleries))}">
        <div class="product-image"><img src="${esc(p.image_url||'')}" alt="${esc(p.name||'')}" loading="lazy"></div>
        ${sale?'<div class="product-badge" style="background:#647250;color:#fff">SPECIAL OFFER</div>':p.badge?`<div class="product-badge">${esc(p.badge)}</div>`:''}
        <div class="product-body product-info"><div class="product-category">${esc(p.category||'')}</div><div class="product-name">${esc(p.name||'')}</div><div class="product-price" ${original!==null?`data-original-price="${original}"`:''} ${sale?`data-offer-price="${price}"`:''}>${priceHTML}</div>${p.description?`<div class="product-description" hidden>${esc(p.description)}</div>`:''}</div>
      </article>`;
    }).join('');
  }
  load();
})();
