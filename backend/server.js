require('dotenv').config({ path: './.env' });
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');
const fs       = require('fs');
const { nanoid } = require('nanoid');
const mongoose = require('mongoose');

const app = express();

// ── CONNECT MONGODB ────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));

// ── MONGOOSE SCHEMA ────────────────────────────
const complaintSchema = new mongoose.Schema({
  complaintId:  { type: String, unique: true },
  name:         { type: String, required: true, trim: true },
  rollNumber:   { type: String, required: true, trim: true },
  department:   { type: String, required: true },
  category:     { type: String, required: true },
  description:  { type: String, required: true },
  imageUrl:     { type: String, default: null },
  status:       { type: String, enum: ['New','In Progress','Resolved','Rejected'], default: 'New' },
  adminNote:    { type: String, default: '' },
  assignedTo:   { type: String, default: '' },
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);

// ── MIDDLEWARE ─────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── MULTER FILE UPLOAD ─────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images and PDFs allowed'));
  }
});

// ── POST /api/complaints ───────────────────────
app.post('/api/complaints', upload.single('image'), async (req, res) => {
  try {
    const { name, rollNumber, department, category, description } = req.body;
    if (!name || !rollNumber || !department || !category || !description) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const complaintId = `CMP-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;
    const complaint = await Complaint.create({
      complaintId,
      name: name.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      department, category,
      description: description.trim(),
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });
    console.log('✅ New complaint:', complaintId);
    res.status(201).json({ message: 'Complaint submitted successfully', complaintId: complaint.complaintId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/complaints/:id ────────────────────
app.get('/api/complaints/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id.toUpperCase() });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/complaints ────────────────────────
app.get('/api/complaints', async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json({ complaints, total: complaints.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /api/complaints/:id ──────────────────
app.patch('/api/complaints/:id', async (req, res) => {
  try {
    const { status, adminNote, assignedTo } = req.body;
    const complaint = await Complaint.findOneAndUpdate(
      { complaintId: req.params.id.toUpperCase() },
      { status, adminNote, assignedTo },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Not found' });
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Health check ───────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 Smart College CMS API Running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

console.log("ENV:", process.env.MONGODB_URI);
