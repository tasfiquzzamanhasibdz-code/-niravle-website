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
