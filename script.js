window.openPendaftarModal = function() {
  const modal = document.getElementById('pendaftarModal');
  if(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

window.closePendaftarModal = function() {
  const modal = document.getElementById('pendaftarModal');
  if(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

// MEMUAT DATA PENDAFTAR YANG SUDAH DI-ACC KE DALAM MODAL POP-UP (HANYA NOMOR URUT & NAMA LENGKAP)
function initPublicPendaftar() {
  try {
    const q = query(collection(db, "pendaftar"), where("status", "==", "Approved"), orderBy("waktuDaftar", "desc"));
    onSnapshot(q, (snapshot) => {
      const container = document.getElementById('publicPendaftarList');
      if (!container) return;

      if (snapshot.empty) {
        container.innerHTML = '<div class="text-center text-slate-500 py-8">Belum ada peserta yang dikonfirmasi oleh panitia.</div>';
        return;
      }

      let html = '';
      let i = 1;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();

        html += `
          <div class="bg-obsidian border border-obsidian-border rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-amber-400 font-bold font-tech">#${i}</span>
              <h4 class="text-white font-bold text-xs uppercase tracking-wide">${d.nama || '-'}</h4>
            </div>
            <span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-accent border border-emerald-500/30 rounded font-bold text-[9px]">CONFIRMED</span>
          </div>
        `;
        i++;
      });
      container.innerHTML = html;
    });
  } catch (e) {
    console.error("Gagal memuat pendaftar publik:", e);
  }
}
