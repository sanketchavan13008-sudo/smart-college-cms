/* ════════════════════════════════════════════════
   SMART COLLEGE CMS — admin.js
   ════════════════════════════════════════════════ */

const API_BASE = 'https://smart-college-cms-api.onrender.com';

// ── ADMIN CREDENTIALS ─────────────────────────
const ADMIN_USER = 'Sanket Chavan';
const ADMIN_PASS = 'Sanket@13';

// ── AUTH ───────────────────────────────────────
const loginPage   = document.getElementById('loginPage');
const adminLayout = document.getElementById('adminLayout');

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  showDashboard();
}

// Login form
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('loginUsername').value.trim();
  const pass = document.getElementById('loginPassword').value.trim();
  const errEl = document.getElementById('loginError');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    errEl.style.display = 'none';
    showDashboard();
  } else {
    errEl.style.display = 'flex';
  }
});

// Toggle password visibility
document.getElementById('togglePass').addEventListener('click', () => {
  const input = document.getElementById('loginPassword');
  const icon = document.querySelector('#togglePass i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
});

function showDashboard() {
  loginPage.style.display = 'none';
  adminLayout.style.display = 'flex';
  loadComplaints();
}

window.logout = function () {
  sessionStorage.removeItem('adminLoggedIn');
  loginPage.style.display = 'flex';
  adminLayout.style.display = 'none';
};

// ── SIDEBAR TOGGLE (mobile) ────────────────────
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ── NAVIGATION ─────────────────────────────────
const pageTitles = {
  dashboard:  ['Dashboard', 'Overview of all complaints'],
  complaints: ['All Complaints', 'View and manage every complaint'],
  new:        ['New Complaints', 'Freshly submitted complaints'],
  inprogress: ['In Progress', 'Complaints being handled'],
  resolved:   ['Resolved', 'Successfully closed complaints'],
};

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchPage(item.dataset.page);
  });
});

window.switchPage = function (page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target page
  document.getElementById(`page-${page}`).style.display = 'block';
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  // Update topbar title
  const [title, sub] = pageTitles[page] || ['Page', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSub').textContent = sub;

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
};

// ── LOAD COMPLAINTS FROM API ───────────────────
let allComplaints = [];
let currentComplaint = null;

window.loadComplaints = async function () {
  try {
    const res = await fetch(`${API_BASE}/complaints`);
    const data = await res.json();
    allComplaints = data.complaints || [];
    renderAll();
  } catch (err) {
    console.error('Could not load complaints:', err);
    allComplaints = [];
    renderAll();
  }
};

function renderAll() {
  updateStats();
  renderTable('recentTableBody',   allComplaints.slice(0, 5));
  renderTable('allTableBody',      applyFilters(true));
  renderTable('newTableBody',      allComplaints.filter(c => c.status === 'New'));
  renderTable('progressTableBody', allComplaints.filter(c => c.status === 'In Progress'));
  renderTable('resolvedTableBody', allComplaints.filter(c => c.status === 'Resolved'));
}

// ── STATS ──────────────────────────────────────
function updateStats() {
  const total    = allComplaints.length;
  const newC     = allComplaints.filter(c => c.status === 'New').length;
  const progress = allComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = allComplaints.filter(c => c.status === 'Resolved').length;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statNew').textContent      = newC;
  document.getElementById('statProgress').textContent = progress;
  document.getElementById('statResolved').textContent = resolved;

  document.getElementById('badgeNew').textContent      = newC;
  document.getElementById('badgeProgress').textContent = progress;
  document.getElementById('badgeResolved').textContent = resolved;
}

// ── FILTERS ────────────────────────────────────
window.applyFilters = function (returnOnly = false) {
  const status = document.getElementById('filterStatus')?.value || '';
  const dept   = document.getElementById('filterDept')?.value || '';

  let filtered = [...allComplaints];
  if (status) filtered = filtered.filter(c => c.status === status);
  if (dept)   filtered = filtered.filter(c => c.department === dept);

  if (returnOnly) return filtered;
  renderTable('allTableBody', filtered);
};

// ── RENDER TABLE ───────────────────────────────
function renderTable(tbodyId, complaints) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!complaints.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No complaints found</td></tr>`;
    return;
  }

  tbody.innerHTML = complaints.map(c => `
    <tr>
      <td><span class="complaint-id-cell">${c.complaintId}</span></td>
      <td>
        <div style="font-weight:500;color:var(--dark)">${c.name}</div>
        <div style="font-size:12px;color:var(--text-muted)">${c.rollNumber}</div>
      </td>
      <td>${c.department}</td>
      <td>${c.category}</td>
      <td><span class="status-badge status-${c.status.replace(' ','-')}">${c.status}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${formatDate(c.createdAt)}</td>
      <td>
        <button class="btn-view" onclick="openModal('${c.complaintId}')">
          <i class="fa-solid fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join('');
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

// ── MODAL ──────────────────────────────────────
window.openModal = function (complaintId) {
  const c = allComplaints.find(x => x.complaintId === complaintId);
  if (!c) return;
  currentComplaint = c;

  document.getElementById('modalTitle').textContent = c.category;
  document.getElementById('modalId').textContent    = c.complaintId;
  document.getElementById('mName').textContent  = c.name;
  document.getElementById('mRoll').textContent  = c.rollNumber;
  document.getElementById('mDept').textContent  = c.department;
  document.getElementById('mCat').textContent   = c.category;
  document.getElementById('mDate').textContent  = formatDate(c.createdAt);
  document.getElementById('mDesc').textContent  = c.description;

  // Status badge
  document.getElementById('mStatus').innerHTML =
    `<span class="status-badge status-${c.status.replace(' ','-')}">${c.status}</span>`;

  // Image
  if (c.imageUrl) {
    document.getElementById('mImage').src = `http://localhost:5000${c.imageUrl}`;
    document.getElementById('mImageWrap').style.display = 'block';
  } else {
    document.getElementById('mImageWrap').style.display = 'none';
  }

  // Pre-fill update fields
  document.getElementById('updateStatus').value  = c.status;
  document.getElementById('updateAssign').value  = c.assignedTo || '';
  document.getElementById('updateNote').value    = c.adminNote || '';
  document.getElementById('updateSuccess').style.display = 'none';

  document.getElementById('modalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

window.closeModal = function (e) {
  if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
};

window.closeModalDirect = function () {
  document.getElementById('modalOverlay').style.display = 'none';
  document.body.style.overflow = '';
};

// ── UPDATE COMPLAINT ───────────────────────────
window.updateComplaint = async function () {
  if (!currentComplaint) return;

  const status     = document.getElementById('updateStatus').value;
  const adminNote  = document.getElementById('updateNote').value.trim();
  const assignedTo = document.getElementById('updateAssign').value;

  try {
    const res = await fetch(`${API_BASE}/complaints/${currentComplaint.complaintId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote, assignedTo })
    });
    const data = await res.json();

    if (res.ok) {
      // Update local data
      const idx = allComplaints.findIndex(c => c.complaintId === currentComplaint.complaintId);
      if (idx !== -1) allComplaints[idx] = data.complaint;
      currentComplaint = data.complaint;

      // Update status badge in modal
      document.getElementById('mStatus').innerHTML =
        `<span class="status-badge status-${data.complaint.status.replace(' ','-')}">${data.complaint.status}</span>`;

      document.getElementById('updateSuccess').style.display = 'flex';
      renderAll();

      setTimeout(() => {
        document.getElementById('updateSuccess').style.display = 'none';
      }, 3000);
    }
  } catch (err) {
    alert('Could not update. Server not reachable.');
  }
};

// ── CLOSE MODAL ON ESC ─────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModalDirect();
});

// ── AUTO REFRESH every 30 seconds ─────────────
setInterval(() => {
  if (sessionStorage.getItem('adminLoggedIn') === 'true') loadComplaints();
}, 30000);

