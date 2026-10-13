import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc, getDoc, onSnapshot, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJSbXvoVqSPFbgwhRZzM4utTuJNgYsxb0",
  authDomain: "tibatibaturnament.firebaseapp.com",
  projectId: "tibatibaturnament",
  storageBucket: "tibatibaturnament.firebasestorage.app",
  messagingSenderId: "626781978918",
  appId: "1:626781978918:web:9c4caf6a1d6a2ad03541e7",
  measurementId: "G-Q64PK4M8P4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => openModal('rulesModal'), 300);
  checkAuthStatus();
  initRealtimeChats();
  initRealtimeLiveChats();
  initPublicPendaftar();
  initRealtimeWebSettings();
  initRealtimeJadwal();
  startSessionWatcher();
});

window.toggleMobileMenu = function() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.add('active');
    if(id !== 'chatModal' && id !== 'rulesInfoModal' && id !== 'pendaftarModal') {
      document.body.style.overflow = 'hidden';
    }
  }
}

window.closeModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

window.openChatModal = function() {
  const chatModal = document.getElementById('chatModal');
  if(chatModal) {
    chatModal.classList.add('active');
    updateChatAccessUI();
  }
}

window.closeChatModal = function() {
  const chatModal = document.getElementById('chatModal');
  if(chatModal) { chatModal.classList.remove('active'); }
}

window.toggleChatModal = function() {
  const chatModal = document.getElementById('chatModal');
  if(chatModal) {
    if (chatModal.classList.contains('active')) { closeChatModal(); } else { openChatModal(); }
  }
}

window.openRulesInfoModal = function() {
  const modal = document.getElementById('rulesInfoModal');
  if(modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

window.closeRulesInfoModal = function() {
  const modal = document.getElementById('rulesInfoModal');
  if(modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

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

window.updateChatAccessUI = function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  const chatForm = document.getElementById('chatForm');
  const chatGuestNotice = document.getElementById('chatGuestNotice');
  const liveChatForm = document.getElementById('liveChatForm');
  const liveChatGuestNotice = document.getElementById('liveChatGuestNotice');

  if (!chatForm) return;

  if (loggedUser) {
    chatForm.classList.remove('hidden');
    if(chatGuestNotice) chatGuestNotice.classList.add('hidden');
    if(liveChatForm) liveChatForm.classList.remove('hidden');
    if(liveChatGuestNotice) liveChatGuestNotice.classList.add('hidden');
  } else {
    chatForm.classList.add('hidden');
    if(chatGuestNotice) chatGuestNotice.classList.remove('hidden');
    if(liveChatForm) liveChatForm.classList.add('hidden');
    if(liveChatGuestNotice) liveChatGuestNotice.classList.remove('hidden');
  }
}

function startSessionWatcher() {
  setInterval(async () => {
    const loggedUser = localStorage.getItem('activeMemberUser');
    const localToken = localStorage.getItem('sessionToken');
    if (!loggedUser || !localToken) return;

    try {
      const userRef = doc(db, "users", loggedUser);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.isBanned === true) {
          localStorage.removeItem('activeMemberUser');
          localStorage.removeItem('sessionToken');
          checkAuthStatus();
          showCustomAlert("AKUN DIBLOKIR", "Sesi diakhiri. Akun Anda telah di-banned oleh panitia.", true);
          return;
        }
        const serverToken = userData.sessionToken;
        if (serverToken && serverToken !== localToken) {
          localStorage.removeItem('activeMemberUser');
          localStorage.removeItem('sessionToken');
          checkAuthStatus();
          showCustomAlert("SESI BERAKHIR", "Akun Anda telah login di perangkat lain.", true);
        }
      }
    } catch (err) { console.error("Gagal memeriksa sesi:", err); }
  }, 10000);
}

function initRealtimeWebSettings() {
  try {
    const docRef = doc(db, "settings", "website");
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const bannerBadgeEl = document.getElementById('webBannerBadge');
        const bannerDotEl = document.getElementById('webBannerDot');
        const bannerTextEl = document.getElementById('webBannerText');
        const modalStatusEl = document.getElementById('modalRegStatusBadge');

        if (data.regStatus) {
          const isOpened = data.regStatus === "OPEN";
          if (isOpened) {
            if (bannerTextEl) bannerTextEl.innerText = "PENDAFTARAN DIBUKA";
            if (modalStatusEl) modalStatusEl.innerText = "ARENA REGISTRATION OPEN";
            if (bannerBadgeEl) bannerBadgeEl.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-accent/15 border border-emerald-accent/40 text-emerald-accent text-[10px] sm:text-xs font-tech font-semibold tracking-widest uppercase mb-3 shadow-emerald-glow";
            if (bannerDotEl) bannerDotEl.className = "w-1.5 h-1.5 rounded-full bg-emerald-accent animate-pulse";
          } else {
            if (bannerTextEl) bannerTextEl.innerText = "PENDAFTARAN DITUTUP";
            if (modalStatusEl) modalStatusEl.innerText = "REGISTRATION CLOSED";
            if (bannerBadgeEl) bannerBadgeEl.className = "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/15 border border-crimson/30 text-crimson text-[10px] sm:text-xs font-tech font-semibold tracking-widest uppercase mb-3 shadow-crimson-glow";
            if (bannerDotEl) bannerDotEl.className = "w-1.5 h-1.5 rounded-full bg-crimson animate-pulse";
          }
        }
      }
    });
  } catch (e) { console.error(e); }
}

// REAL-TIME SINKRONISASI JADWAL & BAGAN DARI PANEL PANITIA
function initRealtimeJadwal() {
  try {
    const docRef = doc(db, "settings", "jadwal_bagan");
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        ['m1', 'm2', 'sf1', 'sf2', 'gf'].forEach(id => {
          if (d[id]) {
            const t1El = document.getElementById(`web_${id}_t1`);
            const t2El = document.getElementById(`web_${id}_t2`);
            const skorEl = document.getElementById(`web_${id}_skor`);
            const statusEl = document.getElementById(`web_${id}_status`);
            const winEl = document.getElementById(`web_${id}_win`);

            if (t1El) t1El.innerText = d[id].tim1 || '-';
            if (t2El) t2El.innerText = d[id].tim2 || '-';
            if (skorEl) skorEl.innerText = d[id].skor || 'VS';
            if (winEl) winEl.innerText = d[id].pemenang || '-';

            if (statusEl) {
              statusEl.innerText = d[id].status || 'PENDING';
              if (d[id].status === 'LIVE') {
                statusEl.className = "px-2 py-0.5 bg-crimson/20 text-crimson rounded font-bold text-[9px] animate-pulse";
              } else if (d[id].status === 'SELESAI') {
                statusEl.className = "px-2 py-0.5 bg-emerald-500/20 text-emerald-accent rounded font-bold text-[9px]";
              } else {
                statusEl.className = "px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded font-bold text-[9px]";
              }
            }
          }
        });
      }
    });
  } catch (e) { console.error(e); }
}

function initPublicPendaftar() {
  try {
    onSnapshot(query(collection(db, "pendaftar"), where("status", "==", "Approved")), (snapshot) => {
      const container = document.getElementById('publicPendaftarList');
      const totalEl = document.getElementById('pubStatTotal');
      const timEl = document.getElementById('pubStatTim');
      if (!container) return;

      if (totalEl) totalEl.innerText = snapshot.size;
      if (timEl) timEl.innerText = Math.floor(snapshot.size / 5) + " Tim";

      if (snapshot.empty) {
        container.innerHTML = '<div class="text-center text-slate-500 py-8">Belum ada peserta yang dikonfirmasi oleh panitia.</div>';
        return;
      }

      let html = ''; let i = 1;
      snapshot.forEach((d) => {
        const data = d.data();
        html += `
          <div class="bg-obsidian border border-obsidian-border rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-3 overflow-hidden mr-2">
              <span class="text-amber-400 font-bold font-tech shrink-0">#${i}</span>
              <h4 class="text-white font-bold text-xs uppercase tracking-wide truncate">${data.nama || '-'}</h4>
            </div>
            <span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-accent border border-emerald-500/30 rounded font-bold text-[9px] shrink-0">CONFIRMED</span>
          </div>
        `;
        i++;
      });
      container.innerHTML = html;
    });
  } catch (e) { console.error(e); }
}

function initRealtimeChats() {
  try {
    onSnapshot(query(collection(db, "chats"), orderBy("time", "asc")), (snapshot) => {
      const chatBox = document.getElementById('chatBox');
      if (!chatBox) return;
      if (snapshot.empty) {
        chatBox.innerHTML = '<div class="text-center text-slate-500 py-6">Belum ada obrolan global.</div>';
        return;
      }
      const loggedUser = localStorage.getItem('activeMemberUser');
      let html = '';
      snapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const isMe = loggedUser && c.username && (c.username.toLowerCase() === loggedUser.toLowerCase());
        let formattedTime = (c.time && c.time.toDate) ? c.time.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        if (isMe) {
          html += `<div class="flex flex-col items-end"><span class="text-[9px] text-slate-400 mb-0.5">${c.username || ''} ${formattedTime}</span><div class="bg-sky-500 text-black px-3 py-1.5 rounded-xl rounded-tr-none max-w-[85%] break-words font-semibold shadow-md">${escapeHtml(c.message || '')}</div></div>`;
        } else {
          html += `<div class="flex flex-col items-start"><span class="text-[9px] text-emerald-accent mb-0.5 font-bold">${c.username || ''} <span class="text-slate-400 font-normal">${formattedTime}</span></span><div class="bg-obsidian-card border border-obsidian-border text-slate-200 px-3 py-1.5 rounded-xl rounded-tl-none max-w-[85%] break-words shadow-md">${escapeHtml(c.message || '')}</div></div>`;
        }
      });
      chatBox.innerHTML = html;
      chatBox.scrollTop = chatBox.scrollHeight;
    });
  } catch(e) { console.error(e); }
}

function initRealtimeLiveChats() {
  try {
    onSnapshot(query(collection(db, "live_chats"), orderBy("time", "asc")), (snapshot) => {
      const liveChatBox = document.getElementById('liveChatBox');
      if (!liveChatBox) return;
      if (snapshot.empty) {
        liveChatBox.innerHTML = '<div class="text-center text-slate-500 py-8">Belum ada komentar live.</div>';
        return;
      }
      const loggedUser = localStorage.getItem('activeMemberUser');
      let html = '';
      snapshot.forEach((docSnap) => {
        const c = docSnap.data();
        const isMe = loggedUser && c.username && (c.username.toLowerCase() === loggedUser.toLowerCase());
        let formattedTime = (c.time && c.time.toDate)? c.time.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        if (isMe) {
          html += `<div class="flex flex-col items-end"><span class="text-[9px] text-slate-400 mb-0.5">${c.username || ''} ${formattedTime}</span><div class="bg-crimson text-white px-3 py-1.5 rounded-xl rounded-tr-none max-w-[85%] break-words font-semibold shadow-md">${escapeHtml(c.message || '')}</div></div>`;
        } else {
          html += `<div class="flex flex-col items-start"><span class="text-[9px] text-sky-400 mb-0.5 font-bold">${c.username || ''} <span class="text-slate-400 font-normal">${formattedTime}</span></span><div class="bg-obsidian-card border border-obsidian-border text-slate-200 px-3 py-1.5 rounded-xl rounded-tl-none max-w-[85%] break-words shadow-md">${escapeHtml(c.message || '')}</div></div>`;
        }
      });
      liveChatBox.innerHTML = html;
      liveChatBox.scrollTop = liveChatBox.scrollHeight;
    });
  } catch(e) { console.error(e); }
}

window.handleSendChat = async function(e) {
  e.preventDefault();
  const loggedUser = localStorage.getItem('activeMemberUser');
  const input = document.getElementById('chatMessageInput');
  if (!loggedUser || !input || !input.value.trim()) return;
  const msg = input.value.trim(); input.value = '';
  try { await addDoc(collection(db, "chats"), { username: loggedUser, message: msg, time: serverTimestamp() }); } catch (err) { console.error(err); }
}

window.handleSendLiveChat = async function(e) {
  e.preventDefault();
  const loggedUser = localStorage.getItem('activeMemberUser');
  const input = document.getElementById('liveChatMessageInput');
  if (!loggedUser || !input || !input.value.trim()) return;
  const msg = input.value.trim(); input.value = '';
  try { await addDoc(collection(db, "live_chats"), { username: loggedUser, message: msg, time: serverTimestamp() }); } catch (err) { console.error(err); }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.showCustomAlert = function(title, text) {
  document.getElementById('messageTitle').innerText = title;
  document.getElementById('messageText').innerText = text;
  openModal('messageModal');
}

window.showCustomConfirm = function(text, onYesCallback) {
  document.getElementById('confirmText').innerText = text;
  const yesBtn = document.getElementById('confirmYesBtn');
  const newYesBtn = yesBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
  newYesBtn.addEventListener('click', () => { closeModal('confirmModal'); if(onYesCallback) onYesCallback(); });
  openModal('confirmModal');
}

let currentIndex = 0;
const slidesContainer = document.getElementById('carouselSlides');
window.nextSlide = function() { if(!slidesContainer) return; currentIndex = (currentIndex + 1) % 3; slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`; }
window.prevSlide = function() { if(!slidesContainer) return; currentIndex = (currentIndex - 1 + 3) % 3; slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`; }
setInterval(nextSlide, 4500);

window.switchTab = function(tab) {
  const jadwalTab = document.getElementById('content-jadwal');
  const championsTab = document.getElementById('content-champions');
  const dynamicSection = document.getElementById('dynamic-section');
  if(jadwalTab) jadwalTab.classList.add('hidden');
  if(championsTab) championsTab.classList.add('hidden');

  if(tab === 'jadwal' && jadwalTab) {
    jadwalTab.classList.remove('hidden');
    if(dynamicSection) dynamicSection.scrollIntoView({ behavior: 'smooth' });
  } else if(tab === 'champions' && championsTab) {
    championsTab.classList.remove('hidden');
    if(dynamicSection) dynamicSection.scrollIntoView({ behavior: 'smooth' });
  }
}

window.closeTab = function() {
  document.getElementById('content-jadwal').classList.add('hidden');
  document.getElementById('content-champions').classList.add('hidden');
}

window.checkAuthStatus = function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  const authGuestMenu = document.getElementById('authGuestMenu');
  const authMemberMenu = document.getElementById('authMemberMenu');
  const mobileAuthGuest = document.getElementById('mobileAuthGuest');
  const mobileAuthMember = document.getElementById('mobileAuthMember');
  const cardAuthAction = document.getElementById('cardAuthAction');
  const cardIcon = document.getElementById('cardIcon');
  const cardTitle = document.getElementById('cardTitle');
  const cardDesc = document.getElementById('cardDesc');
  const lockStatusText = document.getElementById('lockStatusText');
  if (!cardAuthAction) return;

  if (loggedUser) {
    if(authGuestMenu) authGuestMenu.classList.add('hidden');
    if(authMemberMenu) authMemberMenu.classList.remove('hidden');
    if(mobileAuthGuest) mobileAuthGuest.classList.add('hidden');
    if(mobileAuthMember) mobileAuthMember.classList.remove('hidden');
    document.getElementById('loggedInUserBadge').innerText = loggedUser;
    document.getElementById('mobileUserBadge').innerText = 'Akun: ' + loggedUser;
    document.getElementById('activeAccountDisplay').innerText = loggedUser;
    if(cardIcon) cardIcon.className = "fa-solid fa-circle-check";
    if(cardTitle) cardTitle.innerText = "STATUS: TERLOGIN";
    if(cardDesc) cardDesc.innerHTML = `Masuk sebagai <strong class="text-emerald-accent">${loggedUser}</strong>.`;
    cardAuthAction.onclick = () => showCustomAlert("INFO AKUN", `Anda sudah login sebagai ${loggedUser}`);
    if(lockStatusText) lockStatusText.innerHTML = '<span class="text-emerald-accent"><i class="fa-solid fa-unlock text-[10px]"></i> (Akses Terbuka)</span>';
  } else {
    if(authGuestMenu) authGuestMenu.classList.remove('hidden');
    if(authMemberMenu) authMemberMenu.classList.add('hidden');
    if(mobileAuthGuest) mobileAuthGuest.classList.remove('hidden');
    if(mobileAuthMember) mobileAuthMember.classList.add('hidden');
    if(cardIcon) cardIcon.className = "fa-solid fa-right-to-bracket";
    if(cardTitle) cardTitle.innerText = "1. LOGIN / BUAT AKUN";
    if(cardDesc) cardDesc.innerText = "Masuk ke akun Anda atau daftar baru.";
    cardAuthAction.onclick = () => openModal('loginModal');
    if(lockStatusText) lockStatusText.innerHTML = '<span class="text-amber-400"><i class="fa-solid fa-lock text-[10px]"></i> (Login dulu)</span>';
  }
  updateChatAccessUI();
}

window.handleCardAuthClick = function() {
  if (!localStorage.getItem('activeMemberUser')) openModal('loginModal');
}

window.handleTournamentCardClick = async function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  if (!loggedUser) { showCustomAlert("AKSES DITUTUP", "Silakan Login atau Buat Akun terlebih dahulu!", true); openModal('loginModal'); return; }
  try {
    const q = query(collection(db, "pendaftar"), where("usernameDb", "==", loggedUser));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) { showCustomAlert("SUDAH MENDAFTAR", `Akun ${loggedUser} sudah pernah terdaftar di turnamen ini!`, true); }
    else { openModal('registerModal'); }
  } catch (err) { openModal('registerModal'); }
}

window.handleRegisterAccount = async function(event) {
  event.preventDefault();
  const username = document.getElementById('regUser').value.trim().toLowerCase();
  const password = document.getElementById('regPass').value.trim();
  const btn = document.getElementById('regBtn');
  btn.innerText = "MENDAFTARKAN..."; btn.disabled = true;
  try {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) { showCustomAlert("GAGAL", "Username sudah dipakai!", true); return; }
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setDoc(userRef, { username, password, sessionToken, isBanned: false, createdAt: serverTimestamp() });
    closeModal('registerAccountModal');
    localStorage.setItem('activeMemberUser', username);
    localStorage.setItem('sessionToken', sessionToken);
    checkAuthStatus(); showCustomAlert("BERHASIL", "Akun berhasil dibuat!");
    event.target.reset();
  } catch (error) { showCustomAlert("KESALAHAN", "Gagal mendaftar akun.", true); }
  finally { btn.innerText = "DAFTARKAN AKUN"; btn.disabled = false; }
}

window.handleLogin = async function(event) {
  event.preventDefault();
  const username = document.getElementById('loginUser').value.trim().toLowerCase();
  const password = document.getElementById('loginPass').value.trim();
  const btn = document.getElementById('loginBtn');
  btn.innerText = "MENGECEK..."; btn.disabled = true;
  try {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) { showCustomAlert("GAGAL", "Username tidak ditemukan!", true); return; }
    const userData = userSnap.data();
    if (userData.isBanned === true) { showCustomAlert("DIBLOKIR", "Akun Anda di-banned panitia!", true); return; }
    if (userData.password !== password) { showCustomAlert("GAGAL", "Password salah!", true); return; }
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await updateDoc(userRef, { sessionToken });
    localStorage.setItem('activeMemberUser', username);
    localStorage.setItem('sessionToken', sessionToken);
    closeModal('loginModal'); checkAuthStatus();
    showCustomAlert("BERHASIL", `Selamat datang kembali, ${username}!`);
    event.target.reset();
  } catch (error) { showCustomAlert("KESALAHAN", "Gagal login.", true); }
  finally { btn.innerText = "MASUK AKUN"; btn.disabled = false; }
}

window.handleLogout = async function() {
  showCustomConfirm("Apakah Anda yakin ingin keluar?", async () => {
    const loggedUser = localStorage.getItem('activeMemberUser');
    if (loggedUser) { try { await updateDoc(doc(db, "users", loggedUser), { sessionToken: "" }); } catch(e){} }
    localStorage.removeItem('activeMemberUser');
    localStorage.removeItem('sessionToken');
    checkAuthStatus(); showCustomAlert("KELUAR", "Anda telah keluar dari akun.");
  });
}

window.handleFormSubmit = async function(event) {
  event.preventDefault();
  const loggedUser = localStorage.getItem('activeMemberUser');
  if (!loggedUser) { showCustomAlert("SESI HABIS", "Silakan login kembali.", true); openModal('loginModal'); return; }
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.innerText = "MENGIRIM..."; submitBtn.disabled = true;
  try {
    await addDoc(collection(db, "pendaftar"), {
      nama: document.getElementById('tNama').value.trim(),
      idMl: document.getElementById('tIdMI').value.trim(),
      role1: document.getElementById('tRole1').value,
      whatsapp: document.getElementById('tWhatsapp').value.trim(),
      role2: document.getElementById('tRole2').value,
      payment: document.getElementById('tPayment').value,
      usernameDb: loggedUser,
      status: "Pending",
      waktuDaftar: serverTimestamp()
    });
    closeModal('registerModal');
    showCustomAlert("BERHASIL", "Pendaftaran terkirim! Tunggu konfirmasi panitia (ACC).");
    event.target.reset();
  } catch (error) { showCustomAlert("KESALAHAN", "Gagal menyimpan data.", true); }
  finally { submitBtn.innerText = "SUBMIT DATA"; submitBtn.disabled = false; }
}
