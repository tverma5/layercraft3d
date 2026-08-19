(() => {
"use strict";

const CONFIG = { WHATSAPP_NUMBER: "919821434440", PRODUCTS_URL: "data/products.json", CART_KEY: "layercraft3d-cart-v3" };
let PRODUCTS = {boys:[], girls:[]};
let CART = [];

try {
  const saved = JSON.parse(localStorage.getItem(CONFIG.CART_KEY) || "[]");
  CART = Array.isArray(saved) ? saved : [];
} catch (_) { CART = []; }

const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const money = n => "₹" + Number(n).toLocaleString("en-IN");
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const getAll = () => [...(PRODUCTS.boys || []).map(p => ({...p, gender:"boys"})), ...(PRODUCTS.girls || []).map(p => ({...p, gender:"girls"}))];
const findProduct = id => getAll().find(p => String(p.id) === String(id));

function showToast(msg) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}
function saveCart(){ localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(CART)); updateCount(); }
function updateCount(){ $$(".cart-count").forEach(x => x.textContent = CART.reduce((n,i)=>n + Number(i.qty||0),0)); }
function keyFor(id, custom){ return String(id) + "|" + JSON.stringify(custom || {}); }
function cartTotal(){ return CART.reduce((sum,i)=>{const p=findProduct(i.id);return sum+(p ? p.price*Number(i.qty||0):0)},0); }
function customText(c){ return Object.entries(c||{}).filter(([,v])=>v && v!=="Not specified").map(([k,v])=>`${k}: ${v}`).join(" • "); }

function addToCart(id, custom={}, qty=1) {
  const p = findProduct(id); if (!p) { showToast("Product not found."); return; }
  const key = keyFor(id,custom);
  const existing = CART.find(i=>i.key===key);
  if (existing) existing.qty += qty; else CART.push({key,id,custom,qty});
  saveCart(); renderCartDrawer(); renderFullCart(); showToast("Added to cart ✓");
}
function changeQty(key,delta){
  const item=CART.find(i=>i.key===key); if(!item)return;
  item.qty=Number(item.qty)+delta;
  if(item.qty<=0) CART=CART.filter(i=>i.key!==key);
  saveCart(); renderCartDrawer(); renderFullCart();
}
function removeItem(key){ CART=CART.filter(i=>i.key!==key); saveCart(); renderCartDrawer(); renderFullCart(); }

function productImage(p, index=0) {
  const imgs = Array.isArray(p.images) && p.images.length ? p.images : [p.image];
  const src = imgs[index] || imgs[0];
  return `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML='<span class=&quot;placeholder&quot;>LC3D</span>'">`;
}
function productCard(p){
  return `<article class="card">
    <div class="card-image">${productImage(p)}${p.badge?`<span class="badge">${esc(p.badge)}</span>`:""}</div>
    <div class="card-body"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>
    ${p.customizable?'<span class="custom">✦ Customisable</span>':""}
    <strong class="price">${money(p.price)}</strong>
    <div class="card-actions"><a class="btn light small" href="product.html?id=${encodeURIComponent(p.id)}">View Details</a><button class="btn dark small" data-add="${esc(p.id)}">+ Add to Cart</button></div></div>
  </article>`;
}
function renderGrid(el, items){
  if(!el)return;
  el.innerHTML = items.length ? items.map(productCard).join("") : `<div class="empty-grid">No gifts found.</div>`;
  $$("[data-add]",el).forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.add)));
}

function cartItem(i){
  const p=findProduct(i.id); if(!p)return "";
  const img=(Array.isArray(p.images)&&p.images[0])||p.image;
  return `<div class="cart-item"><div class="cart-thumb"><img src="${esc(img)}" alt=""></div>
  <div class="cart-info"><h4>${esc(p.name)}</h4>${customText(i.custom)?`<small>${esc(customText(i.custom))}</small>`:""}
  <div class="qty"><button data-minus="${esc(i.key)}">−</button><span>${i.qty}</span><button data-plus="${esc(i.key)}">+</button></div>
  <button class="remove" data-remove="${esc(i.key)}">Remove</button></div><strong>${money(p.price*i.qty)}</strong></div>`;
}

function renderCartDrawer(){
  const root=$("#cart-root"); if(!root)return;
  root.innerHTML=`<div class="overlay" id="cart-overlay"><aside class="drawer"><div class="drawer-head"><h2>Your Cart</h2><button data-close-cart class="close">×</button></div>
  <div class="cart-list">${CART.length?CART.map(cartItem).join(""):`<div class="empty"><b>Your cart is waiting for something special. 🎁</b><a class="btn dark" href="products.html">Explore Gifts</a></div>`}</div>
  ${CART.length?`<div class="drawer-bottom"><div class="total"><span>Total</span><b>${money(cartTotal())}</b></div><button id="checkout-btn" class="whatsapp">Order on WhatsApp</button></div>`:""}</aside></div>`;
  const overlay=$("#cart-overlay");
  $$("[data-open-cart]").forEach(b=>b.onclick=()=>overlay.classList.add("open"));
  $("[data-close-cart]",overlay).onclick=()=>overlay.classList.remove("open");
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.classList.remove("open")});
  $$("[data-minus]",overlay).forEach(b=>b.onclick=()=>changeQty(b.dataset.minus,-1));
  $$("[data-plus]",overlay).forEach(b=>b.onclick=()=>changeQty(b.dataset.plus,1));
  $$("[data-remove]",overlay).forEach(b=>b.onclick=()=>removeItem(b.dataset.remove));
  $("#checkout-btn",overlay)?.addEventListener("click",renderCheckout);
}

function renderCheckout(){
  const drawer=$(".drawer"); if(!drawer)return;
  const bottom=$(".drawer-bottom",drawer);
  bottom.innerHTML=`<div class="checkout"><h3>Customer Details</h3>
  <label>Name *</label><input id="cust-name" placeholder="Your name">
  <label>Phone Number *</label><input id="cust-phone" inputmode="tel" placeholder="Your phone number">
  <label>Delivery / Society</label><input id="cust-area" placeholder="Optional">
  <label>Additional Note</label><textarea id="cust-note" rows="3" placeholder="Optional"></textarea>
  <button id="send-wa" class="whatsapp">Open WhatsApp</button></div>`;
  $("#send-wa",drawer).onclick=sendWhatsApp;
}

function sendWhatsApp(){
  const name=$("#cust-name")?.value.trim(), phone=$("#cust-phone")?.value.trim();
  if(!name||!phone){showToast("Please enter your name and phone number.");return;}
  const area=$("#cust-area")?.value.trim(), note=$("#cust-note")?.value.trim();
  let msg="Hello LayerCraft 3D! 👋\n\nI would like to place an order.\n\n🎁 ORDER DETAILS\n\n";
  CART.forEach((i,n)=>{
    const p=findProduct(i.id);
    msg += `${n+1}. ${p.name}\nQuantity: ${i.qty}\nPrice: ${money(p.price)} each\n`;
    Object.entries(i.custom||{}).forEach(([k,v])=>{if(v)msg+=`${k}: ${v}\n`;});
    msg += "\n";
  });
  msg += `--------------------\nTotal: ${money(cartTotal())}\n--------------------\n\nCUSTOMER DETAILS\n\nName: ${name}\nPhone: ${phone}\n`;
  if(area)msg += `Delivery Area: ${area}\n`;
  if(note)msg += `Note: ${note}\n`;
  msg += "\nPlease confirm availability and delivery details.\n\nThank you!";
  const url=`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  const w=window.open(url,"_blank"); if(!w) window.location.href=url;
}

function renderFullCart(){
  const el=$("#full-cart"); if(!el)return;
  el.innerHTML=`<div class="heading"><span class="eyebrow">YOUR SELECTION</span><h1>Shopping Cart</h1></div>`;
  if(!CART.length){el.innerHTML+=`<div class="empty page-empty"><b>Your cart is waiting for something special. 🎁</b><a class="btn dark" href="products.html">Explore Gifts</a></div>`;return;}
  el.innerHTML+=`<div class="full-list">${CART.map(cartItem).join("")}</div><div class="full-total"><div class="total"><span>Total</span><b>${money(cartTotal())}</b></div><button id="full-checkout" class="whatsapp">Order on WhatsApp</button></div>`;
  $$("[data-minus]",el).forEach(b=>b.onclick=()=>changeQty(b.dataset.minus,-1));
  $$("[data-plus]",el).forEach(b=>b.onclick=()=>changeQty(b.dataset.plus,1));
  $$("[data-remove]",el).forEach(b=>b.onclick=()=>removeItem(b.dataset.remove));
  $("#full-checkout").onclick=()=>{renderCartDrawer();$("#cart-overlay").classList.add("open");renderCheckout();};
}

function fieldHTML(f){
  if(f.type==="select")return `<label>${esc(f.label)}${f.required?" *":""}<select data-field="${esc(f.label)}" ${f.required?"required":""}><option value="">Choose…</option>${(f.options||[]).map(o=>`<option>${esc(o)}</option>`).join("")}</select></label>`;
  if(f.type==="textarea")return `<label>${esc(f.label)}${f.required?" *":""}<textarea data-field="${esc(f.label)}" rows="4" placeholder="${esc(f.placeholder||"")}" ${f.required?"required":""}></textarea></label>`;
  return `<label>${esc(f.label)}${f.required?" *":""}<input data-field="${esc(f.label)}" placeholder="${esc(f.placeholder||"")}" ${f.required?"required":""}></label>`;
}

function renderProductDetail(){
  const el=$("#product-detail");if(!el)return;
  const id=new URLSearchParams(location.search).get("id") || (location.hash?decodeURIComponent(location.hash.slice(1)):"");
  const p=findProduct(id);
  if(!p){el.innerHTML=`<div class="error-box"><h2>Product not found</h2><p>The product link is invalid or the product was removed.</p><a class="btn dark" href="products.html">Back to Shop</a></div>`;return;}
  const imgs=Array.isArray(p.images)&&p.images.length?p.images:[p.image];
  el.innerHTML=`<div class="detail">
  <div class="gallery"><div class="main-photo"><img id="main-photo" src="${esc(imgs[0])}" alt="${esc(p.name)}"></div>
  ${imgs.length>1?`<div class="thumbs">${imgs.map((src,i)=>`<button class="thumb ${i===0?"active":""}" data-img="${esc(src)}"><img src="${esc(src)}" alt="Product image ${i+1}"></button>`).join("")}</div>`:""}</div>
  <div class="detail-copy"><span class="eyebrow">${esc(p.gender)} · ${esc(p.category||"Gift")}</span><h1>${esc(p.name)}</h1><p>${esc(p.description)}</p><div class="detail-price">${money(p.price)}</div>
  <div class="included"><b>What's included</b><ul><li>3D-printed product</li><li>Quality checked before dispatch</li><li>Ready for gifting</li></ul></div>
  ${p.customizable?`<form id="custom-form">${p.customizationFields.map(fieldHTML).join("")}`:""}
  <div class="qty-row"><b>Quantity</b><div class="qty"><button id="qminus">−</button><span id="qval">1</span><button id="qplus">+</button></div></div>
  <button id="detail-add" class="whatsapp">Add to Cart</button>${p.customizable?"</form>":""}</div></div>`;
  $$(".thumb").forEach(b=>b.onclick=()=>{$("#main-photo").src=b.dataset.img;$$(".thumb").forEach(x=>x.classList.remove("active"));b.classList.add("active");});
  let q=1;$("#qminus").onclick=()=>{q=Math.max(1,q-1);$("#qval").textContent=q};$("#qplus").onclick=()=>{q++;$("#qval").textContent=q};
  $("#detail-add").onclick=()=>{
    const custom={};let ok=true;
    $$("#custom-form [data-field]").forEach(f=>{const v=f.value.trim();if(f.required&&!v)ok=false;custom[f.dataset.field]=v;});
    if(!ok){showToast("Please complete the required fields.");return;}
    addToCart(p.id,custom,q);
  };
}

function initShop(){
  const grid=$("#products-grid");if(!grid)return;
  const search=$("#search"),category=$("#category"),sort=$("#sort");
  const params=new URLSearchParams(location.search);
  if(params.get("category"))category.value=params.get("category");
  const budget=params.get("budget");let filter=budget?`under${budget}`:"all";
  function apply(){
    let a=getAll();const q=search.value.toLowerCase().trim();
    if(category.value!=="all")a=a.filter(p=>p.gender===category.value);
    if(q)a=a.filter(p=>(p.name+" "+p.description+" "+(p.category||"")).toLowerCase().includes(q));
    if(filter==="popular")a=a.filter(p=>p.badge==="Popular"||p.badge==="Best Seller");
    if(filter==="new")a=a.filter(p=>p.badge==="New");
    if(filter.startsWith("under"))a=a.filter(p=>p.price<=Number(filter.slice(5)));
    if(sort.value==="low")a.sort((x,y)=>x.price-y.price);if(sort.value==="high")a.sort((x,y)=>y.price-x.price);
    renderGrid(grid,a);
  }
  search.oninput=apply;category.onchange=apply;sort.onchange=apply;
  $$(".chips button").forEach(b=>b.onclick=()=>{$$(".chips button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;apply();});
  apply();
}

async function loadProducts(){
  // Directly opening HTML with file:// cannot fetch JSON. Use the generated fallback in that case.
  const isFile=location.protocol==="file:";
  if(!isFile){
    try{
      const r=await fetch(CONFIG.PRODUCTS_URL,{cache:"no-store"});
      if(r.ok){PRODUCTS=await r.json();}
    }catch(_){}
  }
  if((!PRODUCTS.boys?.length && !PRODUCTS.girls?.length) && window.LAYERCRAFT_CATALOG) PRODUCTS=window.LAYERCRAFT_CATALOG;
  if(!PRODUCTS.boys?.length && !PRODUCTS.girls?.length){
    const msg=`<div class="error-box"><h2>We couldn't load our gift collection.</h2><p>Please refresh the page.</p></div>`;
    $$("#boys-grid,#girls-grid,#products-grid").forEach(x=>x.innerHTML=msg);
    return;
  }
  const boys=$("#boys-grid"),girls=$("#girls-grid");
  if(boys)renderGrid(boys,(PRODUCTS.boys||[]).slice(0,5).map(p=>({...p,gender:"boys"})));
  if(girls)renderGrid(girls,(PRODUCTS.girls||[]).slice(0,5).map(p=>({...p,gender:"girls"})));
  initShop();renderProductDetail();renderFullCart();renderCartDrawer();
}
document.addEventListener("DOMContentLoaded",()=>{updateCount();loadProducts();});
})();