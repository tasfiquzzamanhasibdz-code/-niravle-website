/* NIRAVLE premium UX enhancement. No payment claims or secret keys. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const storageKey='niravle-wishlist-v1';let favorites=[];
 try{favorites=JSON.parse(localStorage.getItem(storageKey)||'[]');if(!Array.isArray(favorites))favorites=[];}catch{}
 const favs=new Set(favorites.filter(x=>typeof x==='string'));
 const ids=['sareeGrid','threePieceGrid','hijabGrid','ornamentGrid','otherGrid'];
 const grids=ids.map($).filter(Boolean);let wishlistOnly=false;
 const read=card=>({id:card.dataset.id||card.dataset.productId||[card.querySelector('.product-category')?.textContent,card.querySelector('.product-name')?.textContent].join('|'),name:card.querySelector('.product-name')?.textContent||'',category:card.closest('.category-section')?.id||'',price:Number((card.querySelector('.product-price')?.textContent||'').replace(/[^0-9.]/g,''))||0});
 const setSaved=()=>{try{localStorage.setItem(storageKey,JSON.stringify([...favs]));}catch{}};
 function decorate(card){if(card.dataset.npReady)return;card.dataset.npReady='1';const p=read(card);if(!p.name)return;
  const b=document.createElement('button');b.type='button';b.className='np-wish';b.title='Add to wishlist';b.setAttribute('aria-label','Save '+p.name+' to wishlist');
  function sync(){const selected=favs.has(p.id);b.textContent=selected?'♥':'♡';b.setAttribute('aria-pressed',String(selected));b.title=selected?'Remove from wishlist':'Add to wishlist';}
  sync();b.addEventListener('click',event=>{event.stopPropagation();event.preventDefault();if(favs.has(p.id))favs.delete(p.id);else favs.add(p.id);setSaved();sync();filter();});card.appendChild(b);
 }
 function filter(){const term=($('npSearch')?.value||'').trim().toLowerCase(),category=$('npCategory')?.value||'all',sort=$('npSort')?.value||'featured';let count=0;
  grids.forEach(grid=>{const cards=[...grid.querySelectorAll('.product-card')];cards.forEach(decorate);
   cards.forEach(card=>{const p=read(card),match=(!term||((card.querySelector('.product-name')?.textContent||'')+' '+(card.querySelector('.product-description')?.textContent||'')+' '+(card.querySelector('.product-category')?.textContent||'')).toLowerCase().includes(term))&&(category==='all'||({sareeGrid:'saree',threePieceGrid:'threepiece',hijabGrid:'hijab',ornamentGrid:'ornament'}[grid.id]||'other')===category)&&(!wishlistOnly||favs.has(p.id));card.classList.toggle('np-hidden',!match);if(match)count++;});
   if(sort!=='featured')cards.sort((a,b)=>{const x=read(a),y=read(b);return sort==='price-low'?x.price-y.price:sort==='price-high'?y.price-x.price:x.name.localeCompare(y.name);}).forEach((card,index)=>{card.style.order=String(index);});
  });
  if($('npResult'))$('npResult').textContent=count+' product'+(count===1?'':'s')+' matching your selection';
 }
 let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;filter();});};
 grids.forEach(grid=>new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&n.matches?.('.product-card'))))schedule();}).observe(grid,{childList:true}));
 ['npSearch','npCategory','npSort'].forEach(id=>$(id)?.addEventListener(id==='npSearch'?'input':'change',filter));
 $('npFavorites')?.addEventListener('click',()=>{wishlistOnly=!wishlistOnly;$('npFavorites').setAttribute('aria-pressed',String(wishlistOnly));$('npFavorites').textContent=wishlistOnly?'♥ Saved only':'♡ Wishlist';filter();});
 // Product variants: optional values from catalog card data attributes.
 const detail=$('nvProductModal'),info=detail?.querySelector('.nv-detail-info'),picture=$('nvDetailImage');
 if(info){const section=document.createElement('div');section.id='npVariantArea';section.className='np-modal-extra';const actions=info.querySelector('.nv-actions');info.insertBefore(section,actions);}
 function openExtras(card){const area=$('npVariantArea');if(!area||!card)return;area.replaceChildren();const source=card.querySelector('.product-image img')||card.querySelector('img');const main=$('nvDetailImage');
  let images=[];try{const data=card.dataset.images?JSON.parse(card.dataset.images):[];if(Array.isArray(data))images=data.filter(x=>typeof x==='string'&&/^https?:\/\//.test(x));}catch{}
  if(source?.currentSrc||source?.getAttribute('src')){const first=source.currentSrc||source.getAttribute('src');if(!images.includes(first))images.unshift(first);}
  if(images.length>1){const row=document.createElement('div');row.className='np-gallery-thumbs';row.setAttribute('aria-label','Product image gallery');images.slice(0,8).forEach((url,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label','View image '+(i+1));b.setAttribute('aria-pressed',String(i===0));const img=document.createElement('img');img.src=url;img.alt='Product view '+(i+1);img.loading='lazy';b.appendChild(img);b.addEventListener('click',()=>{main.src=url;row.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});row.appendChild(b);});area.appendChild(row);}
  [['size','Size'],['color','Colour']].forEach(([attr,label])=>{const raw=card.dataset[attr];if(!raw)return;const values=raw.split('|').map(x=>x.trim()).filter(Boolean);if(!values.length)return;const l=document.createElement('label');l.textContent=label;const select=document.createElement('select');select.className='np-chooser';select.id='npSelected'+label;values.forEach(value=>{const option=document.createElement('option');option.value=option.textContent=value;select.appendChild(option);});l.appendChild(select);area.appendChild(l);});
  const note=document.createElement('p');note.className='np-detail-help';note.textContent='Please confirm fabric, sizing, availability and delivery before payment. Product photos may vary slightly by screen.';area.appendChild(note);
 }
 // Observe product detail opening after original click handler. No changes to original logic.
 document.addEventListener('click',event=>{const card=event.target.closest?.('.product-card');if(card&&!event.target.closest('.np-wish'))setTimeout(()=>openExtras(card),0);},true);
 // Where possible, include variant preferences in checkout notes without altering cart prices.
 const form=$('nvCheckoutForm');if(form){const notes=form.querySelector('[name="notes"]');if(notes){const parent=notes.closest('label');const hint=document.createElement('span');hint.className='np-brand-note';hint.textContent='For gift wrapping, preferred colour or size, mention it here. Availability is confirmed by the team.';parent.appendChild(hint);}}
 filter();
})();
