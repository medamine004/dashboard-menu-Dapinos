/**
 * MENU JS
 */
import { db, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from "../core/data.js";

const WHATSAPP_NUMBER = "21658052184"; 
const PLACEHOLDER_IMG = "https://placehold.co/400x300?text=Image";

let menu = [], categories = [], activeCat = "", cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initRealTimeMenu();
    window.addToCart = addToCart;
    window.filter = filter;
    window.order = order;
    window.modQty = modQty;
    window.toggleTableInput = () => {
        const grp = document.getElementById('table-group');
        const isSurPlace = document.querySelector('input[name="orderType"]:checked').value === 'Sur Place';
        grp.classList.toggle('hidden', !isSurPlace);
    };
});

function initRealTimeMenu() {
    onSnapshot(query(collection(db, "products"), orderBy("name")), (snap) => {
        menu = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(p => p.active);
        if(menu.length){
            categories = [...new Set(menu.map(p => p.cat))];
            if(!activeCat || !categories.includes(activeCat)) activeCat = categories[0];
            renderCats(); renderMenu();
        } else {
            document.getElementById('menu-list').innerHTML = `<div style="text-align:center;padding:2rem;color:#555">Menu vide</div>`;
        }
    });
}

function renderCats() {
    const c = document.getElementById('cat-list');
    if(!c) return;
    c.innerHTML = categories.map(cat => 
        `<button class="${cat===activeCat?'bg-primary text-black font-bold border-primary shadow-glow':'bg-surface text-gray-400 border-white/10'} border px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider whitespace-nowrap transition-all active:scale-95" onclick="filter('${cat}')">${cat}</button>`
    ).join('');
}

function filter(c) { activeCat = c; renderCats(); renderMenu(); }

function renderMenu() {
    const g = document.getElementById('menu-list');
    if(!g) return;
    const items = menu.filter(p => p.cat === activeCat);
    g.innerHTML = items.map(item => `
        <div class="dish-card group bg-surface border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 relative">
            <div class="relative w-full aspect-[4/3] bg-gray-900 border-b border-white/5">
                <img src="${item.img}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
                <button onclick="addToCart('${item.id}')" class="absolute bottom-1.5 right-1.5 w-7 h-7 bg-white text-black rounded flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-primary z-10"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>
            <div class="p-2.5">
                <h3 class="font-semibold text-gray-100 text-xs leading-snug line-clamp-2 mb-1.5">${item.name}</h3>
                <span class="text-primary font-bold text-sm">${parseFloat(item.price).toFixed(1)} <span class="text-[9px] text-gray-400">DT</span></span>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const p = menu.find(x => x.id === id);
    if(!p) return;
    const ex = cart.find(x => x.id === id);
    if(ex) ex.qty++; else cart.push({...p, qty:1});
    updateCart(); showToast(p.name + " ajouté");
}

function modQty(id, d) {
    const idx = cart.findIndex(x => x.id === id);
    if(idx === -1) return;
    cart[idx].qty += d;
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCart();
}

function updateCart() {
    const cnt = cart.reduce((a,b)=>a+b.qty,0);
    const badge = document.getElementById('nav-badge');
    if(badge) { badge.innerText = cnt; badge.classList.toggle('hidden', cnt===0); }
    
    const div = document.getElementById('cart-items');
    let total = 0;
    
    if(cart.length === 0) {
        div.innerHTML = `<div class="text-center text-gray-600 mt-10 text-sm">Panier vide</div>`;
    } else {
        div.innerHTML = cart.map(i => {
            total += i.price * i.qty;
            return `
            <div class="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mb-3">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-200 text-sm mb-1">${i.name}</h4>
                    <div class="text-primary text-xs font-mono">${parseFloat(i.price).toFixed(1)} DT</div>
                </div>
                <div class="flex items-center gap-3 bg-black/40 rounded-full p-1 border border-white/10 ml-3">
                    <button onclick="modQty('${i.id}', -1)" class="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300"><i class="fa-solid fa-minus text-[10px]"></i></button>
                    <span class="font-bold text-sm min-w-[16px] text-center text-white font-mono">${i.qty}</span>
                    <button onclick="modQty('${i.id}', 1)" class="w-7 h-7 rounded-full bg-primary text-black flex items-center justify-center shadow-glow"><i class="fa-solid fa-plus text-[10px]"></i></button>
                </div>
            </div>`;
        }).join('');
    }
    document.getElementById('cart-total').innerText = total.toFixed(1) + ' DT';
}

async function order() {
    if(!cart.length) return showToast("Panier vide");
    const type = document.querySelector('input[name="orderType"]:checked').value;
    const table = document.getElementById('table-num').value;
    if(type === 'Sur Place' && !table) return alert("Numéro de table requis !");
    
    const oid = "CMD-" + Math.floor(1000+Math.random()*9000);
    const tot = cart.reduce((a,b)=>a+(b.price*b.qty),0);
    
    showToast("Envoi...");
    
    try {
        await addDoc(collection(db, "orders"), {
            orderId: oid, items: cart, total: tot, type, table: table||'N/A',
            timestamp: serverTimestamp(), status: 'pending'
        });
        
        let msg = `🧾 *COMMANDE ${oid}*\n🏷️ *${type}* ${table?'('+table+')':''}\n────────────────\n`;
        cart.forEach(i => msg += `▪️ ${i.qty}x ${i.name}\n`);
        msg += `────────────────\n💰 *TOTAL: ${tot.toFixed(1)} DT*`;
        
        cart=[]; updateCart(); window.closeCart();
        setTimeout(() => window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, 1000);
    } catch(e) { alert("Erreur connexion"); }
}

function showToast(m) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div'); t.className="toast show";
    t.innerHTML = `<i class="fa-solid fa-check"></i><span>${m}</span>`;
    c.appendChild(t); setTimeout(()=>t.remove(), 2500);
}
