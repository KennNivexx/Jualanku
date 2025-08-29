// ================== Helper ==================
const rupiah = (n) => Number(n).toLocaleString("id-ID");
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const menuTableBody = $("#menu-table tbody");
const orderInBody = $("#order-table-in tbody");
const orderDoneBody = $("#order-table-done tbody");
const menuCount = $("#menu-count");
const orderCount = $("#order-count");

const btnAddMenu = $("#btn-add-menu");
const modal = $("#menu-modal");
const modalTitle = $("#menu-modal-title");
const form = $("#menu-form");

const inputId = $("#menu-id");
const inputName = $("#menu-name");
const inputPrice = $("#menu-price");
const inputImg = $("#menu-img");
const inputKat = $("#menu-kategori");

const toastEl = $("#toast");

// ================== Toast ==================
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  setTimeout(() => (toastEl.style.display = "none"), 1500);
}

// ================== Modal ==================
function openModal() {
  modal.style.display = "flex";
}
function closeModal() {
  modal.style.display = "none";
}

$$("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

// ================== Menus ==================
async function loadMenus() {
  const res = await fetch("/api/menus");
  const menus = await res.json();

  menuTableBody.innerHTML = menus
    .map(
      (m) => `
    <tr data-id="${m.id}">
      <td>
        <img src="${m.gambar || "/static/images/fallback.png"}"
             style="width:64px;height:64px;object-fit:cover;border-radius:8px"
             onerror="this.src='/static/images/fallback.png'">
      </td>
      <td>${m.nama}</td>
      <td>Rp ${rupiah(m.harga)}</td>
      <td>${m.kategori}</td>
      <td>
        <button class="btn" data-edit="${m.id}">Edit</button>
        <button class="btn danger" data-del="${m.id}">Hapus</button>
      </td>
    </tr>
  `
    )
    .join("");

  menuCount.textContent = `${menus.length} Menu`;

  // event edit
  $$("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.edit);
      const tr = menuTableBody.querySelector(`tr[data-id="${id}"]`);
      inputId.value = id;
      inputName.value = tr.cells[1].textContent.trim();
      inputPrice.value = tr.cells[2].textContent.replace(/[^\d]/g, "");
      inputImg.value = tr.querySelector("img").getAttribute("src") || "";
      inputKat.value = tr.cells[3].textContent.trim() || "makanan";

      modalTitle.textContent = "Edit Menu";
      openModal();
    });
  });

  // event hapus
  $$("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.del);
      if (!confirm("Hapus menu ini?")) return;

      const res = await fetch(`/api/menus/${id}`, { method: "DELETE" });
      const out = await res.json();

      if (out.ok) {
        showToast("Menu dihapus");
        loadMenus();
      } else alert("Gagal hapus");
    });
  });
}

// ================== Orders ==================
async function loadOrders() {
  const res = await fetch("/api/orders");
  const orders = await res.json();

  const masuk = orders.filter((o) => o.status === "dibayar");
  const selesai = orders.filter((o) => o.status === "selesai");

  // pesanan masuk
  orderInBody.innerHTML = masuk
    .map((o) => {
      const items = (o.items || [])
        .map((it) => `${it.nama} x${it.jumlah}`)
        .join("<br>");
      return `
      <tr data-id="${o.id}">
        <td>${new Date(o.created_at).toLocaleString("id-ID")}</td>
        <td>${o.nama_pembeli}</td>
        <td>${o.nomor_meja || "-"}</td>
        <td>${items || "-"}</td>
        <td>Rp ${rupiah(o.total)}</td>
        <td>
          <button class="btn primary" data-status="selesai" data-id="${
            o.id
          }">Selesai</button>
          <button class="btn danger" data-del-order="${o.id}">Hapus</button>
        </td>
      </tr>
    `;
    })
    .join("");
   // pesanan selesai
  orderDoneBody.innerHTML = selesai
    .map((o) => {
      const items = (o.items || [])
        .map((it) => `${it.nama} x${it.jumlah}`)
        .join("<br>");
      return `
      <tr data-id="${o.id}">
        <td>${new Date(o.created_at).toLocaleString("id-ID")}</td>
        <td>${o.nama_pembeli}</td>
        <td>${o.nomor_meja || "-"}</td>
        <td>${items || "-"}</td>
        <td>Rp ${rupiah(o.total)}</td>
        <td>
        <span class="badge-success">Selesai</span>
        </td>
      </tr>
    `;
    })
    .join("");

  orderCount.textContent = `${orders.length} Pesanan`;
  bindOrderActions();
}
function bindOrderActions() {
  // update status
  $$("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;

      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const out = await res.json();

      if (out.ok) {
        showToast("Status diupdate");
        loadOrders();
      } else alert("Gagal update");
    });
  });

  // hapus pesanan
  $$("[data-del-order]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delOrder;
      if (!confirm("Hapus pesanan ini?")) return;

      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const out = await res.json();

      if (out.ok) {
        showToast("Pesanan dihapus");
        loadOrders();
      } else alert("Gagal hapus");
    });
  });
}

// ================== Form Menu ==================
btnAddMenu.addEventListener("click", () => {
  inputId.value = "";
  inputName.value = "";
  inputPrice.value = "";
  inputImg.value = "";
  inputKat.value = "makanan";

  modalTitle.textContent = "Tambah Menu";
  openModal();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    nama: inputName.value.trim(),
    harga: Number(inputPrice.value || 0),
    gambar: inputImg.value.trim() || null,
    kategori: inputKat.value || "makanan",
  };

  if (!payload.nama || !payload.harga) {
    alert("Nama & harga wajib");
    return;
  }

  let url = "/api/menus",
    method = "POST";
  if (inputId.value) {
    url = `/api/menus/${inputId.value}`;
    method = "PATCH";
  }

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const out = await res.json();

  if (out.ok) {
    showToast(inputId.value ? "Menu diperbarui" : "Menu ditambahkan");
    closeModal();
    loadMenus();
  } else alert(out.msg || "Gagal simpan");
});
let chart;

async function fetchReport() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) {
    alert("Isi tanggal dulu!");
    return;
  }

  const res = await fetch(`/api/report?start=${start}&end=${end}`);
  const data = await res.json();
  if (!data.ok) {
    alert(data.msg || "Gagal ambil data");
    return;
  }

  const labels = data.data.map((r) => r.tgl);
  const totals = data.data.map((r) => r.total);

  // Update chart
  if (chart) chart.destroy();
  const ctx = document.getElementById("reportChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pendapatan Harian",
          data: totals,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
        },
      ],
    },
  });

  // Update table
  const tbody = document.querySelector("#reportTable tbody");
  tbody.innerHTML = "";
  data.data.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.tgl}</td><td>Rp ${r.total.toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById("btnFilter").addEventListener("click", fetchReport);

document.getElementById("btnDownload").addEventListener("click", () => {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) {
    alert("Isi tanggal dulu!");
    return;
  }
  window.location.href = `/api/report/download?start=${start}&end=${end}`;
});

// ================== Init ==================
$("#btn-refresh").addEventListener("click", () => loadOrders());
setInterval(loadOrders, 2000);
loadMenus();
loadOrders();
