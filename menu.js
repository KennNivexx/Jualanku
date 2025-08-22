// util
const rupiah = n => Number(n).toLocaleString('id-ID');

// state
let cart = [];

// elements
const grid = document.getElementById('menu-grid');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');

const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsBox = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const checkoutModal = document.getElementById('checkout-modal');
const closeCheckout = document.getElementById('close-checkout');
const checkoutItemsBox = document.getElementById('checkout-items');
const checkoutTotalEl = document.getElementById('checkout-total');
const customerName = document.getElementById('customer-name');
const confirmPayBtn = document.getElementById('confirm-payment-btn');

const receiptModal = document.getElementById('receipt-modal');
const closeReceipt = document.getElementById('close-receipt');
const receiptContent = document.getElementById('receipt-content');
const finishBtn = document.getElementById('finish-btn');

// helper
function open(modal){ modal.style.display = 'flex'; }
function close(modal){ modal.style.display = 'none'; }
function updateBadge(){ cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0); }

// load menus from API
async function loadMenus(){
  const res = await fetch('/api/menus');
  const data = await res.json();
  grid.innerHTML = data.map(it => `
    <div class="menu-item" data-id="${it.id}" data-name="${it.nama}" data-price="${it.harga}" data-img="${it.gambar || '/static/images/fallback.png'}">
      <img src="${it.gambar || '/static/images/fallback.png'}" alt="${it.nama}" onerror="this.src='/static/images/fallback.png'"/>
      <h3>${it.nama}</h3>
      <p class="price">Rp ${rupiah(it.harga)}</p>
      <button class="add-to-cart">Tambah</button>
    </div>
  `).join('');

  grid.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.menu-item');
      const id = Number(card.dataset.id);
      const name = card.dataset.name;
      const price = Number(card.dataset.price);
      const img = card.dataset.img || '/static/images/fallback.png';
      const found = cart.find(x=>x.id===id);
      if(found) found.qty += 1;
      else cart.push({id, name, price, img, qty:1});
      updateBadge();
    });
  });
}
loadMenus();

// render cart
function renderCart(){
  cartItemsBox.innerHTML = '';
  let total = 0;
  cart.forEach((it, idx)=>{
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <img src="${it.img}" alt="${it.name}" onerror="this.src='/static/images/fallback.png'"/>
      <div>
        <div><strong>${it.name}</strong></div>
        <div>Rp ${rupiah(it.price)} / item</div>
      </div>
      <div style="text-align:right">
        <div class="qty">
          <button data-act="dec" data-idx="${idx}">−</button>
          <span style="margin:0 8px">${it.qty}</span>
          <button data-act="inc" data-idx="${idx}">+</button>
        </div>
        <div>Rp ${rupiah(it.price * it.qty)}</div>
        <button data-act="del" data-idx="${idx}" style="margin-top:6px">Hapus</button>
      </div>
    `;
    cartItemsBox.appendChild(row);
    total += it.price * it.qty;
  });
  cartTotalEl.textContent = rupiah(total);

  cartItemsBox.querySelectorAll('button[data-act]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const idx = Number(b.dataset.idx);
      const act = b.dataset.act;
      if(act==='inc') cart[idx].qty++;
      if(act==='dec') cart[idx].qty = Math.max(1, cart[idx].qty-1);
      if(act==='del') cart.splice(idx,1);
      renderCart(); updateBadge();
    });
  });
}

// render checkout modal list
function renderCheckout(){
  const box = document.getElementById('checkout-items');
  const totEl = document.getElementById('checkout-total');
  box.innerHTML = '';
  let total = 0;
  cart.forEach(it=>{
    const row = document.createElement('div');
    row.style.display='flex'; row.style.gap='12px'; row.style.alignItems='center'; row.style.padding='8px 0';
    row.innerHTML = `<img src="${it.img}" style="width:56px;height:56px;object-fit:cover;border-radius:8px"/><div><strong>${it.name}</strong> x${it.qty}<div>Rp ${rupiah(it.price*it.qty)}</div></div>`;
    box.appendChild(row);
    total += it.price*it.qty;
  });
  totEl.textContent = rupiah(total);
}

// event bindings
cartBtn.addEventListener('click', ()=>{ renderCart(); open(cartModal); });
closeCart.addEventListener('click', ()=>close(cartModal));
checkoutBtn.addEventListener('click', ()=>{
  if(cart.length===0){ alert('Keranjang kosong'); return; }
  close(cartModal); renderCheckout(); open(checkoutModal);
});
closeCheckout.addEventListener('click', ()=>close(checkoutModal));

// confirm payment (send order)
document.getElementById('confirm-payment-btn').addEventListener('click', async ()=>{
  const nama = (document.getElementById('customer-name').value || '').trim();
  if(!nama){ alert('Nama pembeli harus diisi'); return; }
  const payload = { nama, cart: cart.map(i=>({ id: i.id, qty: i.qty })) };
  const res = await fetch('/api/orders', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  const out = await res.json();
  if(!out.ok){ alert(out.msg || 'Gagal membuat pesanan'); return; }
  const itemsStr = cart.map(i=>`${i.name} x${i.qty} Rp ${rupiah(i.price*i.qty)}`).join('\n');
  const tgl = new Date().toLocaleString('id-ID');
  receiptContent.textContent = `No.Order: ORD${String(out.order_id).padStart(6,'0')}\nTanggal: ${tgl}\nNama: ${nama}\n\n${itemsStr}\n\nTotal: Rp ${rupiah(out.total)}\nStatus: Transaksi Berhasil ✅`;
  close(checkoutModal); open(receiptModal);
  cart = []; updateBadge();
});

// receipt modal
closeReceipt.addEventListener('click', ()=>close(receiptModal));
finishBtn.addEventListener('click', ()=>close(receiptModal));

// click outside to close
[cartModal, checkoutModal, receiptModal].forEach(m=>{
  m.addEventListener('click', e=>{ if(e.target===m) close(m); });
});