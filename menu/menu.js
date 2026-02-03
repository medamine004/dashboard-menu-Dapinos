/**
 * MENU JS - UI UPDATE
 * Logique intacte, Design Premium
 */
import { db, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from "../core/data.js";

const WHATSAPP_NUMBER = "21658052184"; 
const PLACEHOLDER_IMG = "https://placehold.co/400x300?text=No+Image";

let menu = [], categories = [], activeCat = "", cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initRealTimeMenu();
    // Exposition globale des fonctions existantes
    window.addToCart = addToCart;
    window.filter = filter;
    window.order = order;
    window.modQty = modQty;
    window.toggleTableInput = () => {
        const grp = document.getElementById('table-group');
        const isSurPlace = document.querySelector('input[name="orderType"]:checked').value === 'Sur Place';
        // Affichage conditionnel propre (Tailwind)
        if(isSurPlace) grp.classList.remove('hidden');
        else grp.classList.add('hidden');
    };
});

function initRealTimeMenu() {
    onSnapshot(query(collection(db, "products"), orderBy("name")), (snap) => {
        menu = snap.docs.map(d => ({id:d.id, ...d.data()})).filter(p => p.active);
        if(menu.length){
            categories = [...new Set(menu.map(p => p.cat))];
            if(!activeCat || !categories.includes(activeCat)) activeCat = categories[0];
            renderCats(); 
            renderMenu();
        } else {
            document.getElementById('menu-list').innerHTML = `<div class="col-span-2 text-center py-10 text-gray-500">Menu indisponible</div>`;
        }
    });
}

// 🎨 DESIGN CATÉGORIES (Pillules)
function renderCats() {
    const c = document.getElementById('cat-list');
    if(!c) return;
    c.innerHTML = categories.map(cat => 
        `<button class="${cat===activeCat ? 'bg-primary text-black font-bold shadow-glow border-primary' : 'bg-surface text-gray-400 border-white/10 hover:bg-white/5'} 
         border px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all active:scale-95" 
         onclick="filter('${cat}')">
            ${cat}
        </button>`
    ).join('');
}

function filter(c) { activeCat = c; renderCats(); renderMenu(); }

// 🎨 DESIGN PRODUIT (Carte Compacte Carrée)
function renderMenu() {
    const g = document.getElementById('menu-list');
    if(!g) return;
    const items = menu.filter(p => p.cat === activeCat);
    
    if(items.length === 0) {
        g.innerHTML = `<div class="col-span-2 text-center text-gray-500 py-10 text-sm">Aucun produit dans cette catégorie</div>`;
        return;
    }

    g.innerHTML = items.map(item => `
        <div class="dish-card group bg-surface border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 relative shadow-card">
            <div class="relative w-full aspect-square bg-gray-900 border-b border-white/5">
                <img src="${item.img}" 
                     class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700" 
                     loading="lazy" 
                     onerror="this.src='${PLACEHOLDER_IMG}'">
                
                <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white border border-white/10">
                    ${parseFloat(item.price).toFixed(1)} <span class="text-[9px] text-primary">DT</span>
                </div>

                <button onclick="addToCart('${item.id}')" 
                        class="absolute bottom-2 right-2 w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:bg-primary z-10">
                    <i class="fa-solid fa-plus text-xs"></i>
                </button>
            </div>

            <div class="p-3">
                <h3 class="font-semibold text-gray-100 text-sm leading-tight line-clamp-1 mb-1">${item.name}</h3>
                <p class="text-[10px] text-gray-500 line-clamp-1">${item.cat}</p>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const p = menu.find(x => x.id === id);
    if(!p) return;
    const ex = cart.find(x => x.id === id);
    if(ex) ex.qty++; else cart.push({...p, qty:1});
    updateCart(); 
    showToast(`${p.name} ajouté !`);
}

function modQty(id, d) {
    const idx = cart.findIndex(x => x.id === id);
    if(idx === -1) return;
    cart[idx].qty += d;
    if(cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCart();
}

// 🎨 DESIGN PANIER (Liste Pro + Boutons Larges)
function updateCart() {
    const cnt = cart.reduce((a,b)=>a+b.qty,0);
    const badge = document.getElementById('nav-badge');
    if(badge) { badge.innerText = cnt; badge.classList.toggle('hidden', cnt===0); }
    
    const div = document.getElementById('cart-items');
    let total = 0;
    
    if(cart.length === 0) {
        div.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 text-gray-600 opacity-50">
            <i class="fa-solid fa-cart-shopping text-5xl mb-3"></i>
            <p class="text-sm">Votre panier est vide</p>
        </div>`;
    } else {
        div.innerHTML = cart.map(i => {
            total += i.price * i.qty;
            return `
            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-200 text-sm leading-tight">${i.name}</h4>
                    <div class="text-primary text-xs font-mono mt-1">${parseFloat(i.price).toFixed(1)} DT</div>
                </div>

                <div class="flex items-center gap-3 bg-black rounded-full p-1 border border-white/10">
                    <button onclick="modQty('${i.id}', -1)" class="w-8 h-8 rounded-full bg-surface text-gray-400 hover:text-white flex items-center justify-center transition-colors active:bg-white/10">
                        <i class="fa-solid fa-minus text-xs"></i>
                    </button>
                    <span class="font-bold text-sm min-w-[20px] text-center text-white font-mono">${i.qty}</span>
                    <button onclick="modQty('${i.id}', 1)" class="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center shadow-glow active:scale-90 transition-transform">
                        <i class="fa-solid fa-plus text-xs"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }
    document.getElementById('cart-total').innerText = total.toFixed(1) + ' DT';
}

async function order() {
    if(!cart.length) return showToast("Votre panier est vide");
    
    const type = document.querySelector('input[name="orderType"]:checked').value;
    const table = document.getElementById('table-num').value;
    
    // Validation stricte UI
    if(type === 'Sur Place' && !table) {
        document.getElementById('table-num').focus();
        document.getElementById('table-group').classList.add('animate-pulse'); // Effet visuel
        setTimeout(() => document.getElementById('table-group').classList.remove('animate-pulse'), 500);
        return showToast("Veuillez entrer votre table !");
    }
    
    const oid = "CMD-" + Math.floor(1000+Math.random()*9000);
    const tot = cart.reduce((a,b)=>a+(b.price*b.qty),0);
    
    showToast("Envoi de la commande...", true);
    
    try {
        await addDoc(collection(db, "orders"), {
            orderId: oid, items: cart, total: tot, type, table: table||'N/A',
            timestamp: serverTimestamp(), status: 'pending'
        });
        
        let msg = `🧾 *COMMANDE ${oid}*\n🏷️ *${type}* ${table?'(Table '+table+')':''}\n────────────────\n`;
        cart.forEach(i => msg += `▪️ ${i.qty}x ${i.name}\n`);
        msg += `────────────────\n💰 *TOTAL: ${tot.toFixed(1)} DT*`;
        
        cart=[]; updateCart(); window.closeCart();
        setTimeout(() => window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, 1000);
    } catch(e) { 
        console.error(e);
        showToast("Erreur de connexion"); 
    }
}

function showToast(m, persistent=false) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div'); 
    t.className="toast show";
    t.innerHTML = `<i class="fa-solid fa-circle-check text-primary"></i><span>${m}</span>`;
    c.appendChild(t); 
    if(!persistent) setTimeout(()=>t.remove(), 2500);
}
