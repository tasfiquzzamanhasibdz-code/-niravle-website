/* NIRAVLE storefront repair 2026-10-10.
 * Replacement for shop.js; leave all other scripts, HTML and CSS unchanged.
 * Uses public Supabase REST with publishable key. Never use a secret/service key.
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = value => value !== '' && value != null && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const taka = value => '৳ ' + Number(value).toLocaleString('en-BD', {maximumFractionDigits: 2});
  const images = value => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch (_) {}
      return value.split('|');
    }
    return [];
  };
  const safeURLs = value => [...new Set(images(value).filter(v => typeof v === 'string' && /^https?:\/\//i.test(v.trim())).map(v => v.trim()))].slice(0,12);
  const CATALOG_VISIBILITY_KEY = 'catalog_visibility_v1';
  const DEPARTMENTS = ['womenswear','menswear','kids','unisex','fragrance','accessories','home','learning','essentials'];
  const DEPARTMENT_PATTERNS = {
    womenswear:/abaya|women|woman|ladies|dress|tops?|shirts?|t.?shirts?|blouse|saree|sari|sharee|three.?piece|hijab|scarf|skirt|palazzo|leggings|trousers?|pants?|tunic|kurti|modest wear|women.?s wear|মহিলা|নারী|আবায়া|আবায়া/i,
    menswear:/men.?s|menswear|men wear|kabli|panjabi|punjabi|sherwani|waistcoat|thobe|jubba|kurta|shirts?|t.?shirts?|tees?|polo|jeans|trousers?|pants?|shorts?|chinos|jacket|outerwear|men.?s essentials|পুরুষ|পাঞ্জাবি|শেরওয়ানি|শেরওয়ানি/i,
    kids:/kid|children|child|boys|girls|baby|toddler|pre.?winter|father and son|mother and daughter|kidswear|বাচ্চা|শিশু|ছেলেদের|মেয়েদের|মেয়েদের/i,
    unisex:/unisex|gender.?neutral|oversized|daily wear|layering|universal fit/i,
    fragrance:/fragrance|perfume|attar|oud|al haramain|body mist|deodorant|scent|parfum|eau de|আতর|সুগন্ধি/i,
    accessories:/accessor|bag|handbag|watch|wallet|card holder|passport holder|prayer cap|glasses|sunglasses|ring|belt|button|headband|simagh|shemagh|keffiyeh|shoe|footwear|sneaker|sandal|slipper|loafer|boot|জুতা|ব্যাগ|ঘড়ি|ঘড়ি/i,
    home:/home decor|bedsheet|bed sheet|prayer mat|tissue box|home essential|organizer|home living|বেডশিট|প্রেয়ার ম্যাট|প্রেয়ার ম্যাট/i,
    learning:/book|school|stationery|learning|educational|toy|puzzle|flash.?card|study|education|pencil|notebook|school supply|learning game|শিক্ষা|খেলনা|বই|খাতা|পেন্সিল/i,
    essentials:/daily essential|essential|personal care|storage|organization|organizer|travel essential|gift set|lifestyle|দৈনন্দিন/i
  };
  let departmentVisibility = Object.fromEntries(DEPARTMENTS.map(key => [key, true]));
  let visibilityStyleInstalled = false;
  let visibilityObserver = null;
  function isDepartmentVisible(key) { return departmentVisibility[key] !== false; }
  function installVisibilityStyle() {
    if (visibilityStyleInstalled || !document.head) return;
    const style = document.createElement('style');
    style.id = 'niravle-category-visibility-style';
    style.textContent = '.nv-category-hidden,.nv-hidden-department-product{display:none!important}';
    document.head.append(style);
    visibilityStyleInstalled = true;
  }
  function guardDepartmentNavigation() {
    const original = window.niravleOpenDepartmentView;
    if (typeof original !== 'function' || original.__niravleVisibilityGuard) return;
    const guarded = function (key, options) {
      if (DEPARTMENTS.includes(key) && !isDepartmentVisible(key)) {
        message('This department is currently unavailable.');
        return;
      }
      return original.apply(this, arguments);
    };
    guarded.__niravleVisibilityGuard = true;
    window.niravleOpenDepartmentView = guarded;
  }
  function applyCategoryVisibility() {
    installVisibilityStyle();
    guardDepartmentNavigation();
    document.querySelectorAll('[data-department-open]').forEach(el => {
      const key = el.dataset.departmentOpen;
      // The Ornaments homepage tile is a standalone editorial/product shortcut,
      // not the Women department tile, despite sharing its navigation target.
      if (el.dataset.nirProduct === 'Ornaments') return;
      el.classList.toggle('nv-category-hidden', !isDepartmentVisible(key));
    });
    document.querySelectorAll('.department-shelf').forEach(shelf => {
      const key = shelf.querySelector('[data-department-open]')?.dataset.departmentOpen ||
        shelf.querySelector('[data-shop-department]')?.dataset.shopDepartment;
      if (key) shelf.classList.toggle('nv-category-hidden', !isDepartmentVisible(key));
    });
    document.querySelectorAll('[data-shop-department]').forEach(el => {
      const key = el.dataset.shopDepartment;
      if (key && DEPARTMENTS.includes(key)) el.classList.toggle('nv-category-hidden', !isDepartmentVisible(key));
    });
    const selector = $('npCategory');
    if (selector) {
      DEPARTMENTS.forEach(key => {
        const option = selector.querySelector('option[value="' + key + '"]');
        if (option) option.hidden = !isDepartmentVisible(key);
      });
      if (selector.value !== 'all' && DEPARTMENTS.includes(selector.value) && !isDepartmentVisible(selector.value)) {
        selector.value = 'all';
        selector.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }
    const cards = document.querySelectorAll('#productGrid .product-card,.product-grid .product-card');
    cards.forEach(card => {
      const searchable = [card.dataset.category, card.dataset.name,
        card.querySelector('.product-category')?.textContent,
        card.querySelector('.product-name')?.textContent,
        card.querySelector('.product-description')?.textContent].filter(Boolean).join(' ');
      const belongsToHiddenDepartment = DEPARTMENTS.some(key => !isDepartmentVisible(key) && DEPARTMENT_PATTERNS[key]?.test(searchable));
      card.classList.toggle('nv-hidden-department-product', belongsToHiddenDepartment);
    });
    const browse = $('departmentBrowseView');
    if (browse && !browse.hidden) {
      const current = (location.hash.match(/^#department-([^&]*)/) || [])[1];
      if (current && DEPARTMENTS.includes(current) && !isDepartmentVisible(current)) {
        browse.hidden = true;
        document.body.classList.remove('department-view-active');
      }
    }
  }
  function parseCatalogVisibility(value) {
    let parsed = value;
    if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch (_) { parsed = null; } }
    const saved = parsed?.departments && typeof parsed.departments === 'object' ? parsed.departments : {};
    departmentVisibility = Object.fromEntries(DEPARTMENTS.map(key => [key, saved[key] !== false]));
    applyCategoryVisibility();
  }
  async function loadCategoryVisibility(url, key) {
    try {
      const endpoint = url + '/rest/v1/site_settings?select=key,value&key=eq.' + encodeURIComponent(CATALOG_VISIBILITY_KEY) + '&limit=1';
      const response = await fetch(endpoint, {
        headers: Object.assign({'apikey':key,'Accept':'application/json'}, key.startsWith('eyJ') ? {'Authorization':'Bearer '+key} : {}),
        cache:'no-store'
      });
      if (!response.ok) throw Error('Category settings request returned HTTP ' + response.status);
      const rows = await response.json();
      if (Array.isArray(rows) && rows[0]) parseCatalogVisibility(rows[0].value);
      else applyCategoryVisibility();
    } catch (error) {
      console.warn('NIRAVLE category visibility could not be loaded:', error);
      // Keep all departments visible if the optional public setting cannot be read.
      applyCategoryVisibility();
    }
  }
  function watchCategoryVisibility() {
    if (visibilityObserver || !document.body) return;
    let queued = false;
    visibilityObserver = new MutationObserver(records => {
      if (!records.some(record => record.addedNodes.length)) return;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; applyCategoryVisibility(); });
    });
    visibilityObserver.observe(document.body, {childList:true,subtree:true});
  }

  function message(value) {
    const result = $('npResult');
    if (result) result.textContent = value;
  }
  function render(items) {
    const source = $('productGrid');
    if (!source) throw Error('Product source container #productGrid missing');
    // The existing index.html moves default sample cards into four visible grids.
    // Remove ONLY those sample cards once real database results are available.
    ['sareeGrid','threePieceGrid','hijabGrid','ornamentGrid','otherGrid'].forEach(id => {
      const grid = $(id);
      if (grid) grid.querySelectorAll('.product-card[data-id^="niravle-"]').forEach(card => card.remove());
    });
    // Keep the original index.html cart / wishlist / sorting / modal machinery.
    // Its MutationObserver moves cards from this source into the visible grids.
    source.replaceChildren();
    const html = items.map(p => {
      const now = valid(p.price), previous = valid(p.compare_price);
      const sale = now !== null && now > 0 && previous !== null && previous > now;
      const base = sale ? previous : now;
      const galleries = safeURLs(p.gallery_images);
      const mainImage = typeof p.image_url === 'string' && /^(https?:\/\/|assets\/)/i.test(p.image_url) ? p.image_url : (galleries[0] || '');
      const discount = sale ? Math.round((previous - now)/previous * 100) : 0;
      const priceText = now === null ? 'Price on request' : sale
        ? `<span class="product-offer-price">${taka(now)}</span> <s class="nv-old-price">${taka(previous)}</s> <span class="nv-save-label">${discount}% OFF</span>`
        : taka(now);
      const variants = Array.isArray(p.variants) ? p.variants.map(v => typeof v === 'string' ? v : (v?.name || v?.label || '')).filter(Boolean).join('|') : '';
      return `<article class="product-card" data-id="${esc(p.id)}" data-product-id="${esc(p.id)}" data-name="${esc(p.name)}" data-category="${esc(p.category)}" ${base !== null ? `data-price="${base}"` : ''} ${sale ? `data-offer-price="${now}"` : ''} data-images="${esc(galleries.join('|'))}" data-variants="${esc(variants)}">
      <div class="product-image"><img src="${esc(mainImage)}" alt="${esc(p.name)}" loading="lazy"></div>
      ${sale ? '<div class="product-badge nv-offer-badge">SPECIAL OFFER</div>' : p.badge ? `<div class="product-badge">${esc(p.badge)}</div>` : ''}
      <div class="product-info"><div class="product-category">${esc(p.category)}</div><div class="product-name">${esc(p.name)}</div><div class="product-price" ${base !== null ? `data-original-price="${base}"` : ''} ${sale ? `data-offer-price="${now}"` : ''}>${priceText}</div><div class="product-description" hidden>${esc(p.description)}</div></div>
      </article>`;
    }).join('');
    if (html) source.innerHTML = html;
    // The last inserted cards are consumed by the original observer.
    // Supply a customer-visible notice only when the database is truly empty.
    if (!items.length) {
      ['sareeGrid','threePieceGrid','hijabGrid','ornamentGrid'].forEach(id => {
        const grid = $(id);
        if (grid) grid.querySelectorAll('.collection-placeholder').forEach(el => el.textContent = 'No products in this collection yet.');
      });
      message('No active products have been published yet.');
    }
    window.NIRAVLE_PRODUCTS_LOADED = true;
  }
  async function run() {
    const url = String(window.NIRAVLE_SUPABASE_URL || '').replace(/\/$/, '');
    const key = String(window.NIRAVLE_SUPABASE_ANON_KEY || '');
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) || !key || key.includes('YOUR_')) {
      throw Error('Supabase configuration is missing or incorrect.');
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 14000);
    try {
      const endpoint = url + '/rest/v1/products?select=*&active=eq.true&order=featured.desc,sort_order.asc,created_at.desc';
      const response = await fetch(endpoint, {
        headers: Object.assign({'apikey':key, 'Accept':'application/json'}, key.startsWith('eyJ') ? {'Authorization':'Bearer '+key} : {}),
        signal:controller.signal,
        cache:'no-store'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw Error('Supabase products request returned HTTP '+response.status+(payload?.message ? ': '+payload.message : ''));
      }
      if (!Array.isArray(payload)) throw Error('Unexpected products response format.');
      render(payload);
      console.info('NIRAVLE products loaded:', payload.length);
    } finally {clearTimeout(timeout);}
  }
  function begin() {
    const url = String(window.NIRAVLE_SUPABASE_URL || '').replace(/\/$/, '');
    const key = String(window.NIRAVLE_SUPABASE_ANON_KEY || '');
    if (url && key && !key.includes('YOUR_')) void loadCategoryVisibility(url, key);
    applyCategoryVisibility();
    watchCategoryVisibility();
    run().catch(error => {
      console.error('NIRAVLE storefront loading failed:',error);
      // Keep original hardcoded samples as fallback instead of breaking the site.
      message('Live products are temporarily unavailable. Please try again later.');
      ['sareeGrid','threePieceGrid','hijabGrid','ornamentGrid'].forEach(id => {
        const grid = $(id);
        if (grid) grid.querySelectorAll('.collection-placeholder').forEach(el => el.textContent = 'Collection temporarily unavailable.');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',begin,{once:true});
  else begin();
})();
