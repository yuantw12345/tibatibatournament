// MEMUAT DATA PENDAFTAR YANG SUDAH DI-ACC KE DALAM MODAL POP-UP (TANPA SYARAT COMPOSITE INDEX)
function initPublicPendaftar() {
  try {
    // Kueri hanya filter status 'Approved' tanpa orderBy di Firestore
    const q = query(collection(db, "pendaftar"), where("status", "==", "Approved"));
    
    onSnapshot(q, (snapshot) => {
      const container = document.getElementById('publicPendaftarList');
      if (!container) return;

      if (snapshot.empty) {
        container.innerHTML = '<div class="text-center text-slate-500 py-8">Belum ada peserta yang dikonfirmasi oleh panitia.</div>';
        return;
      }

      // Ambil dokumen dan urutkan berdasarkan waktuDaftar secara lokal di JavaScript
      const docsData = [];
      snapshot.forEach((docSnap) => {
        docsData.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Urutkan dari yang terbaru ke terlama
      docsData.sort((a, b) => {
        const timeA = a.waktuDaftar && a.waktuDaftar.seconds ? a.waktuDaftar.seconds : 0;
        const timeB = b.waktuDaftar && b.waktuDaftar.seconds ? b.waktuDaftar.seconds : 0;
        return timeB - timeA;
      });

      let html = '';
      let i = 1;

      docsData.forEach((d) => {
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
    }, (error) => {
      console.error("Error Firestore listener:", error);
      const container = document.getElementById('publicPendaftarList');
      if (container) {
        container.innerHTML = '<div class="text-center text-red-400 py-6 text-xs">Gagal memuat data peserta. Cek koneksi atau pendaftaran.</div>';
      }
    });
  } catch (e) {
    console.error("Gagal memuat pendaftar publik:", e);
  }
}
