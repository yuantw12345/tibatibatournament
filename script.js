import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc, getDoc, onSnapshot, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AlzaSyDJSbXvoVqSPFbgwhRZzM4utTuJNgYsxb0",
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
  startSessionWatcher();
});

window.toggleMobileMenu = function() {
  document.getElementById('mobileMenu').classList.toggle('hidden');
}

window.openModal = function(id) {
  const modal = document.getElementById(id);
  if(modal) {
    modal.classList.add('active');
    if(id !== 'chatModal' && id !== 'rulesInfoModal') {
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
  if(chatModal) {
    chatModal.classList.remove('active');
  }
}

window.toggleChatModal = function() {
  const chatModal = document.getElementById('chatModal');
  if(chatModal) {
    if (chatModal.classList.contains('active')) {
      closeChatModal();
    } else {
      openChatModal();
    }
  }
}

window.openRulesInfoModal = function() {
  const modal = document.getElementById('rulesInfoModal');
  if(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

window.closeRulesInfoModal = function() {
  const modal = document.getElementById('rulesInfoModal');
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
    } catch (err) {
      console.error("Gagal memeriksa sesi:", err);
    }
  }, 10000);
}

function initRealtimeChats() {
  try {
    const q = query(collection(db, "chats"), orderBy("time", "asc"));
    onSnapshot(q, (snapshot) => {
      const chatBox = document.getElementById('chatBox');
      if (!chatBox) return;
      if (snapshot.empty) {
        chatBox.innerHTML = '<div class="text-center text-slate-500 py-6">Belum ada obrolan global. Yuk mulai mengobrol!</div>';
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
    const q = query(collection(db, "live_chats"), orderBy("time", "asc"));
    onSnapshot(q, (snapshot) => {
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
  const msg = input.value.trim();
  input.value = '';
  try {
    await addDoc(collection(db, "chats"), { username: loggedUser, message: msg, time: serverTimestamp() });
  } catch (err) { console.error(err); }
}

window.handleSendLiveChat = async function(e) {
  e.preventDefault();
  const loggedUser = localStorage.getItem('activeMemberUser');
  const input = document.getElementById('liveChatMessageInput');
  if (!loggedUser || !input || !input.value.trim()) return;
  const msg = input.value.trim();
  input.value = '';
  try {
    await addDoc(collection(db, "live_chats"), { username: loggedUser, message: msg, time: serverTimestamp() });
  } catch (err) { console.error(err); }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.showCustomAlert = function(title, text, isError = false) {
  const titleEl = document.getElementById('messageTitle');
  const textEl = document.getElementById('messageText');
  const icon = document.getElementById('messageIcon');
  if(titleEl) titleEl.innerText = title;
  if(textEl) textEl.innerText = text;
  if(icon) {
    icon.className = isError ? "fa-solid fa-triangle-exclamation text-crimson" : "fa-solid fa-circle-check text-emerald-accent";
  }
  openModal('messageModal');
}

window.showCustomConfirm = function(text, onYesCallback) {
  const confirmText = document.getElementById('confirmText');
  const yesBtn = document.getElementById('confirmYesBtn');
  if(confirmText) confirmText.innerText = text;
  if(yesBtn) {
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    newYesBtn.addEventListener('click', () => { 
      closeModal('confirmModal');
      if(typeof onYesCallback === 'function') onYesCallback(); 
    });
  }
  openModal('confirmModal');
}

let currentIndex = 0;
const slidesContainer = document.getElementById('carouselSlides');

window.nextSlide = function() { 
  if(!slidesContainer) return;
  currentIndex = (currentIndex + 1) % 3;
  slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`; 
}

window.prevSlide = function() { 
  if(!slidesContainer) return;
  currentIndex = (currentIndex - 1 + 3) % 3; 
  slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`; 
}

setInterval(nextSlide, 4500);

window.switchTab = function(tab) {
  const championsTab = document.getElementById('content-champions');
  const dynamicSection = document.getElementById('dynamic-section');
  if(championsTab) {
    championsTab.classList.add('hidden');
    if(tab === 'champions') {
      championsTab.classList.remove('hidden');
    }
  }
  if(dynamicSection) {
    dynamicSection.scrollIntoView({ behavior: 'smooth' });
  }
}

window.closeTab = function() { 
  const championsTab = document.getElementById('content-champions');
  if(championsTab) championsTab.classList.add('hidden'); 
}

window.checkAuthStatus = function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  const authGuestMenu = document.getElementById('authGuestMenu');
  const authMemberMenu = document.getElementById('authMemberMenu');
  const mobileAuthGuest = document.getElementById('mobileAuthGuest');
  const mobileAuthMember = document.getElementById('mobileAuthMember');
  const cardAuthAction = document.getElementById('cardAuthAction');
  const cardIcon = document.getElementById('cardIcon');
  const cardIconBox = document.getElementById('cardIconBox');
  const cardTitle = document.getElementById('cardTitle');
  const cardDesc = document.getElementById('cardDesc');
  const lockStatusText = document.getElementById('lockStatusText');

  if (!cardAuthAction) return;

  if (loggedUser) {
    if(authGuestMenu) authGuestMenu.classList.add('hidden');
    if(authMemberMenu) authMemberMenu.classList.remove('hidden');
    if(mobileAuthGuest) mobileAuthGuest.classList.add('hidden');
    if(mobileAuthMember) mobileAuthMember.classList.remove('hidden');

    const loggedInBadge = document.getElementById('loggedInUserBadge');
    const mobileBadge = document.getElementById('mobileUserBadge');
    const activeAccDisplay = document.getElementById('activeAccountDisplay');

    if(loggedInBadge) loggedInBadge.innerText = loggedUser;
    if(mobileBadge) mobileBadge.innerText = 'Akun: ' + loggedUser;
    if(activeAccDisplay) activeAccDisplay.innerText = loggedUser;

    if(cardIcon) cardIcon.className = "fa-solid fa-circle-check";
    if(cardIconBox) cardIconBox.className = "w-12 h-12 rounded-xl bg-emerald-accent/10 text-emerald-accent flex items-center justify-center text-xl mb-4 sm:mb-6 group-hover:bg-emerald-accent group-hover:text-black transition-all";
    if(cardTitle) cardTitle.innerText = "STATUS: TERLOGIN";
    if(cardDesc) cardDesc.innerHTML = `Masuk sebagai <strong class="text-emerald-accent">${loggedUser}</strong>. Akun siap digunakan untuk bertanding.`;
    cardAuthAction.onclick = () => showCustomAlert("INFO AKUN", `Anda sudah login sebagai ${loggedUser}`);
    if(lockStatusText) lockStatusText.innerHTML = '<span class="text-emerald-accent"><i class="fa-solid fa-unlock text-[10px]"></i> (Akses Terbuka)</span>';
  } else {
    if(authGuestMenu) authGuestMenu.classList.remove('hidden');
    if(authMemberMenu) authMemberMenu.classList.add('hidden');
    if(mobileAuthGuest) mobileAuthGuest.classList.remove('hidden');
    if(mobileAuthMember) mobileAuthMember.classList.add('hidden');

    if(cardIcon) cardIcon.className = "fa-solid fa-right-to-bracket";
    if(cardIconBox) cardIconBox.className = "w-12 h-12 rounded-xl bg-emerald-accent/10 text-emerald-accent flex items-center justify-center text-xl mb-4 sm:mb-6 group-hover:bg-emerald-accent group-hover:text-black transition-all";
    if(cardTitle) cardTitle.innerText = "1. LOGIN / BUAT AKUN";
    if(cardDesc) cardDesc.innerText = "Masuk ke akun Anda atau daftar baru untuk membuka akses pendaftaran turnamen.";
    cardAuthAction.onclick = () => openModal('loginModal');
    if(lockStatusText) lockStatusText.innerHTML = '<span class="text-amber-400"><i class="fa-solid fa-lock text-[10px]"></i> (Login terlebih dahulu untuk membuka)</span>';
  }
  updateChatAccessUI();
}

window.handleCardAuthClick = function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  if (!loggedUser) openModal('loginModal');
}

window.handleTournamentCardClick = async function() {
  const loggedUser = localStorage.getItem('activeMemberUser');
  if (!loggedUser) {
    showCustomAlert("AKSES DITUTUP", "Silakan Login atau Buat Akun Website terlebih dahulu sebelum mendaftar turnamen!", true);
    openModal('loginModal');
    return;
  }
  try {
    const q = query(collection(db, "pendaftar"), where("usernameDb", "==", loggedUser));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      showCustomAlert("SUDAH MENDAFTAR", `Akun ${loggedUser} sudah pernah terdaftar di turnamen ini!`, true);
    } else {
      openModal('registerModal');
    }
  } catch (err) { openModal('registerModal'); }
}

window.handleRegisterAccount = async function(event) {
  event.preventDefault();
  const regUser = document.getElementById('regUser');
  const regPass = document.getElementById('regPass');
  const btn = document.getElementById('regBtn');
  if(!regUser || !regPass || !btn) return;

  const username = regUser.value.trim().toLowerCase();
  const password = regPass.value.trim();
  
  btn.innerText = "MENDAFTARKAN AKUN...";
  btn.disabled = true;

  try {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      showCustomAlert("GAGAL", "Username sudah terpakai! Silakan gunakan username lain.", true);
      return;
    }
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setDoc(userRef, {
      username: username,
      password: password,
      sessionToken: sessionToken,
      isBanned: false,
      createdAt: serverTimestamp()
    });
    closeModal('registerAccountModal');
    localStorage.setItem('activeMemberUser', username);
    localStorage.setItem('sessionToken', sessionToken);
    checkAuthStatus();
    showCustomAlert("BERHASIL", "Akun berhasil dibuat dan masuk ke perangkat ini!");
    event.target.reset();
  } catch (error) {
    console.error(error);
    showCustomAlert("KESALAHAN", "Gagal mendaftar akun.", true);
  } finally {
    btn.innerText = "DAFTARKAN AKUN";
    btn.disabled = false;
  }
}

window.handleLogin = async function (event) {
  event.preventDefault();
  const loginUser = document.getElementById('loginUser');
  const loginPass = document.getElementById('loginPass');
  const btn = document.getElementById('loginBtn');
  if(!loginUser || !loginPass || !btn) return;

  const username = loginUser.value.trim().toLowerCase();
  const password = loginPass.value.trim();
  
  btn.innerText = "MENGECEK AKUN...";
  btn.disabled = true;

  try {
    const userRef = doc(db, "users", username);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      showCustomAlert("LOGIN GAGAL", "Username tidak ditemukan!", true);
      return;
    }
    const userData = userSnap.data();
    if (userData.isBanned === true) {
      showCustomAlert("AKUN DIBLOKIR", "Akun Anda telah di-banned oleh panitia karena melanggar aturan!", true);
      return;
    }
    if (userData.password !== password) {
      showCustomAlert("LOGIN GAGAL", "Password salah!", true);
      return;
    }
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await updateDoc(userRef, { sessionToken: sessionToken });
    localStorage.setItem('activeMemberUser', username);
    localStorage.setItem('sessionToken', sessionToken);
    closeModal('loginModal');
    checkAuthStatus();
    showCustomAlert("LOGIN BERHASIL", `Selamat datang kembali, ${username}!`);
    event.target.reset();
  } catch (error) {
    console.error(error);
    showCustomAlert("KESALAHAN", "Gagal melakukan proses login.", true);
  } finally {
    btn.innerText = "MASUK AKUN";
    btn.disabled = false;
  }
}

window.handleLogout = async function() {
  showCustomConfirm("Apakah Anda yakin ingin keluar dari akun ini?", async () => {
    const loggedUser = localStorage.getItem('activeMemberUser');
    if (loggedUser) {
      try {
        const userRef = doc(db, "users", loggedUser);
        await updateDoc(userRef, { sessionToken: "" });
      } catch(e) {}
    }
    localStorage.removeItem('activeMemberUser');
    localStorage.removeItem('sessionToken');
    checkAuthStatus();
    showCustomAlert("KELUAR", "Anda telah keluar dari akun.");
  });
}

window.handleFormSubmit = async function(event) {
  event.preventDefault();
  const loggedUser = localStorage.getItem('activeMemberUser');
  if (!loggedUser) {
    showCustomAlert("SESI HABIS", "Sesi login kedaluwarsa. Silakan login kembali.", true);
    openModal('loginModal');
    return;
  }
  const submitBtn = document.getElementById('submitBtn');
  if(!submitBtn) return;

  submitBtn.innerText = "MENGIRIM DATA...";
  submitBtn.disabled = true;

  try {
    await addDoc(collection(db, "pendaftar"), {
      nama: document.getElementById('tNama').value.trim(),
      idMI: document.getElementById('tIdMI').value.trim(),
      role1: document.getElementById('tRole1').value,
      whatsapp: document.getElementById('tWhatsapp').value.trim(),
      role2: document.getElementById('tRole2').value,
      payment: document.getElementById('tPayment').value,
      usernameDb: loggedUser,
      waktuDaftar: serverTimestamp()
    });
    closeModal('registerModal');
    showCustomAlert("REGISTRASI BERHASIL", "Data pendaftaran turnamen berhasil dikirim ke database Firestore!");
    event.target.reset();
  } catch (error) {
    console.error("Gagal kirim ke database: ", error);
    showCustomAlert("KESALAHAN", "Terjadi kesalahan saat menyimpan data ke database.", true);
  } finally {
    submitBtn.innerText = "SUBMIT DATA";
    submitBtn.disabled = false;
  }
}