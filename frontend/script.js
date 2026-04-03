/* ════════════════════════════════════════════════
   SMART COLLEGE CMS — script.js
   ════════════════════════════════════════════════ */

const API_BASE = 'https://smart-college-cms.onrender.com';

// ── NAVBAR ─────────────────────────────────────
const navbar   = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-menu a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ── SMOOTH SCROLL ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const el = document.querySelector(href);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── AOS (Animate On Scroll) ────────────────────
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('aos-animate'); } });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));

// ── COUNTER ANIMATION ──────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObserver.observe(el));

// ── FILE UPLOAD ────────────────────────────────
const fileDrop    = document.getElementById('fileDrop');
const fileInput   = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const fileNameEl  = document.getElementById('fileName');
const removeFile  = document.getElementById('removeFile');

if (fileInput) {
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) showFilePreview(file.name);
  });

  fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.style.borderColor = '#FF6B2B'; });
  fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor = ''; });
  fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    fileDrop.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      showFilePreview(file.name);
    }
  });

  removeFile.addEventListener('click', () => {
    fileInput.value = '';
    filePreview.style.display = 'none';
    fileDrop.style.display = 'block';
  });
}

function showFilePreview(name) {
  fileNameEl.textContent = name;
  filePreview.style.display = 'flex';
  fileDrop.style.display = 'none';
}

// ── COMPLAINT FORM SUBMIT ──────────────────────
const complaintForm = document.getElementById('complaintForm');
const formSuccess   = document.getElementById('formSuccess');
const formAlert     = document.getElementById('formAlert');
const submitBtn     = document.getElementById('submitBtn');
const complaintIdDisplay = document.getElementById('complaintIdDisplay');

if (complaintForm) {
  complaintForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    // basic validation
    const name = complaintForm.name.value.trim();
    const rollNumber = complaintForm.rollNumber.value.trim();
    const department = complaintForm.department.value;
    const category = complaintForm.category.value;
    const description = complaintForm.description.value.trim();

    if (!name || !rollNumber || !department || !category || !description) {
      showAlert('Please fill in all required fields.', 'error');
      return;
    }
    if (description.length < 20) {
      showAlert('Please provide a more detailed description (at least 20 characters).', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(complaintForm);
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.complaintId) {
        complaintForm.style.display = 'none';
        formSuccess.style.display = 'block';
        complaintIdDisplay.textContent = data.complaintId;
      } else {
        showAlert(data.message || 'Something went wrong. Please try again.', 'error');
      }
    } catch (err) {
      showAlert('Cannot connect to server. Please check your connection.', 'error');
    }

    setLoading(false);
  });
}

function showAlert(msg, type) {
  formAlert.textContent = msg;
  formAlert.className = `form-alert ${type}`;
  formAlert.style.display = 'block';
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert() { formAlert.style.display = 'none'; }
function setLoading(state) {
  submitBtn.classList.toggle('loading', state);
  submitBtn.innerHTML = state
    ? '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...'
    : '<i class="fa-solid fa-paper-plane"></i> Submit Complaint';
}

window.resetForm = function () {
  complaintForm.reset();
  complaintForm.style.display = 'block';
  formSuccess.style.display = 'none';
  if (filePreview) { filePreview.style.display = 'none'; }
  if (fileDrop) { fileDrop.style.display = 'block'; }
};

window.copyComplaintId = function () {
  const id = complaintIdDisplay.textContent;
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.querySelector('.complaint-id-box button');
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i>'; }, 1500);
  });
};

// ── TRACK COMPLAINT ────────────────────────────
window.trackComplaint = async function () {
  const id = document.getElementById('trackId').value.trim();
  const resultEl = document.getElementById('trackResult');
  const errorEl  = document.getElementById('trackError');

  resultEl.style.display = 'none';
  errorEl.style.display = 'none';

  if (!id) { alert('Please enter a complaint ID.'); return; }

  try {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    const data = await res.json();

    if (res.ok && data.complaint) {
      const c = data.complaint;
      const statusClass = {
        'New': 'status-new',
        'In Progress': 'status-inprogress',
        'Resolved': 'status-resolved',
        'Rejected': 'status-rejected'
      }[c.status] || 'status-new';

      resultEl.innerHTML = `
        <div class="track-result-header">
          <div>
            <h3>${c.category}</h3>
            <div class="track-result-id">ID: ${c.complaintId}</div>
          </div>
          <span class="status-badge ${statusClass}">
            <i class="fa-solid fa-circle" style="font-size:7px"></i> ${c.status}
          </span>
        </div>
        <div class="track-details">
          <div class="track-detail-item">
            <label>Student Name</label>
            <span>${c.name}</span>
          </div>
          <div class="track-detail-item">
            <label>Roll Number</label>
            <span>${c.rollNumber}</span>
          </div>
          <div class="track-detail-item">
            <label>Department</label>
            <span>${c.department}</span>
          </div>
          <div class="track-detail-item">
            <label>Submitted On</label>
            <span>${new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div class="track-detail-item" style="grid-column:1/-1">
            <label>Description</label>
            <span>${c.description}</span>
          </div>
          ${c.adminNote ? `<div class="track-detail-item" style="grid-column:1/-1">
            <label>Admin Note</label>
            <span>${c.adminNote}</span>
          </div>` : ''}
        </div>
      `;
      resultEl.style.display = 'block';
    } else {
      errorEl.style.display = 'flex';
    }
  } catch (err) {
    errorEl.style.display = 'flex';
    errorEl.querySelector('span').textContent = 'Could not connect to server.';
  }
};

// Allow pressing Enter in track field
const trackInput = document.getElementById('trackId');
if (trackInput) {
  trackInput.addEventListener('keydown', e => { if (e.key === 'Enter') trackComplaint(); });
}

// ── CONTACT FORM ───────────────────────────────
window.handleContact = function (e) {
  e.preventDefault();
  document.getElementById('contactSuccess').style.display = 'block';
  e.target.reset();
  setTimeout(() => { document.getElementById('contactSuccess').style.display = 'none'; }, 3000);
};

