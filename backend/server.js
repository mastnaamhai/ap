import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Allow your frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  packSize: { type: String, required: true },
  hsnCode: { type: String, required: true },
  rate: { type: Number, required: true },
  gstRate: { type: Number, required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, required: true },
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: String,
  address: String,
  gstin: String,
  state: { type: String, required: true },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerGst: String,
  items: [{
    name: String,
    quantity: Number,
    discountPercent: Number,
    taxAmount: Number,
    totalAmount: Number,
    category: String,
    brand: String,
    batchNumber: String,
    expiryDate: String,
    packSize: String,
    hsnCode: String,
    rate: Number,
    gstRate: Number,
  }],
  subTotal: Number,
  totalDiscount: Number,
  totalTax: Number,
  roundOff: Number,
  grandTotal: Number,
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Card', 'Credit'], required: true },
  notes: String,
});

const settingsSchema = new mongoose.Schema({
  pharmacyName: { type: String, required: true },
  address: { type: String, required: true },
  gstin: { type: String, required: true },
  dlNumber: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  terms: { type: String, required: true },
  state: { type: String, required: true },
  signatureImage: String,
});

const Product = mongoose.model('Product', productSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes

// Products
app.get('/api/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/products', authMiddleware, async (req, res) => {
  const product = new Product(req.body);
  try {
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Customers
app.get('/api/customers', authMiddleware, async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/customers', authMiddleware, async (req, res) => {
  const customer = new Customer(req.body);
  try {
    const savedCustomer = await customer.save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/customers/:id', authMiddleware, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invoices
app.get('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/invoices', authMiddleware, async (req, res) => {
  const invoice = new Invoice(req.body);
  try {
    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/invoices/:id', authMiddleware, async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedInvoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/invoices/:id', authMiddleware, async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Settings
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await Settings.findOne() || {
      pharmacyName: "MediCare Plus Pharmacy",
      address: "Shop 12, Wellness Plaza, Andheri East, Mumbai 400069",
      gstin: "27ABCDE1234F1Z5",
      dlNumber: "MH-MZ1-123456",
      phone: "9876543210",
      email: "billing@medicareplus.com",
      bankName: "HDFC Bank",
      accountNumber: "50100123456789",
      ifsc: "HDFC0001234",
      terms: "Goods once sold will not be taken back. Keep in cool dry place.",
      state: "Maharashtra",
      signatureImage: ""
    };
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
      res.json(settings);
    } else {
      const newSettings = new Settings(req.body);
      await newSettings.save();
      res.json(newSettings);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    // Simple check - in production, hash and compare properly
    if (password === 'admin123') {
      const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/update-password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    // Store hashed password, but for now just acknowledge
    res.json({ success: true, message: 'Password updated (implement hashing)' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Backup and export (simplified)
app.get('/api/backup', authMiddleware, async (req, res) => {
  try {
    const data = {
      settings: await Settings.findOne(),
      products: await Product.find(),
      customers: await Customer.find(),
      invoices: await Invoice.find(),
      timestamp: new Date().toISOString(),
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
