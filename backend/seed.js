import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// Mock Data
const mockProducts = [
  {
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    brand: "Cipla",
    batchNumber: "PAR0012024",
    expiryDate: "2025-12-31",
    packSize: "10 Tablets",
    hsnCode: "30049011",
    rate: 25.50,
    gstRate: 12,
    stock: 150,
    minStock: 20
  },
  {
    name: "Amoxicillin 250mg",
    category: "Antibiotic",
    brand: "Sun Pharma",
    batchNumber: "AMX0012024",
    expiryDate: "2025-08-15",
    packSize: "10 Capsules",
    hsnCode: "30031000",
    rate: 45.75,
    gstRate: 12,
    stock: 100,
    minStock: 15
  },
  {
    name: "Vitamin D3 60k",
    category: "Vitamin",
    brand: "Cadila",
    batchNumber: "VIT0012024",
    expiryDate: "2026-03-20",
    packSize: "4 Softgel Capsules",
    hsnCode: "30045010",
    rate: 95.00,
    gstRate: 12,
    stock: 80,
    minStock: 10
  },
  {
    name: "Cough Syrup 100ml",
    category: "Cough & Cold",
    brand: "Dr Reddy's",
    batchNumber: "COU0012024",
    expiryDate: "2025-06-30",
    packSize: "100ml",
    hsnCode: "30049099",
    rate: 65.25,
    gstRate: 12,
    stock: 60,
    minStock: 8
  },
  {
    name: "Blood Pressure Monitor",
    category: "Medical Equipment",
    brand: "Omron",
    batchNumber: "BPM0012024",
    expiryDate: "2027-01-01",
    packSize: "1 Unit",
    hsnCode: "90181990",
    rate: 2999.00,
    gstRate: 12,
    stock: 25,
    minStock: 5
  },
  {
    name: "Band Aid Pack",
    category: "First Aid",
    brand: "Johnson & Johnson",
    batchNumber: "BAN0012024",
    expiryDate: "2026-01-01",
    packSize: "20 Strips",
    hsnCode: "30051090",
    rate: 45.00,
    gstRate: 12,
    stock: 200,
    minStock: 30
  },
  {
    name: "Ibuprofen 200mg",
    category: "Pain Relief",
    brand: "GlaxoSmithKline",
    batchNumber: "IBU0012024",
    expiryDate: "2025-09-15",
    packSize: "15 Tablets",
    hsnCode: "30049011",
    rate: 75.50,
    gstRate: 12,
    stock: 120,
    minStock: 18
  },
  {
    name: "Cetirizine 10mg",
    category: "Allergy",
    brand: "Dr Reddy's",
    batchNumber: "CET0012024",
    expiryDate: "2025-11-30",
    packSize: "10 Tablets",
    hsnCode: "30049099",
    rate: 35.25,
    gstRate: 12,
    stock: 90,
    minStock: 12
  }
];

const mockCustomers = [
  {
    name: "Rajesh Kumar",
    mobile: "9876543210",
    email: "rajesh.kumar@email.com",
    address: "Flat 101, Shree Complex, Bandra East, Mumbai - 400051",
    gstin: "27AAAAA1234A1Z5",
    state: "Maharashtra"
  },
  {
    name: "Priya Sharma",
    mobile: "9988776655",
    email: "priya.sharma@email.com",
    address: "B/203,玫瑰 Nagar, Andheri West, Mumbai - 400058",
    gstin: null,
    state: "Maharashtra"
  },
  {
    name: "Amit Patel",
    mobile: "9123456789",
    email: "amit.patel@email.com",
    address: "12, Patel House, Borivali West, Mumbai - 400092",
    gstin: "24BBBBB5678B1Z9",
    state: "Maharashtra"
  },
  {
    name: "Sunita Reddy",
    mobile: "8765432109",
    email: "sunita.reddy@email.com",
    address: "A-45, Sai Apartment, Juhu, Mumbai - 400049",
    gstin: null,
    state: "Maharashtra"
  },
  {
    name: "Dr. Vikram Joshi",
    mobile: "7654321098",
    email: "vikram.joshi@hospital.com",
    address: "KEM Hospital, Parel, Mumbai - 400012",
    gstin: "27CCCCC9012C1Z3",
    state: "Maharashtra"
  }
];

const mockInvoices = [
  {
    invoiceNumber: "INV001/2025",
    date: "2025-01-15",
    customerId: "507f1f77bcf86cd799439011",
    customerName: "Rajesh Kumar",
    customerGst: "27AAAAA1234A1Z5",
    items: [
      {
        name: "Paracetamol 500mg",
        quantity: 2,
        discountPercent: 0,
        taxAmount: 7.65,
        totalAmount: 63.65,
        category: "Pain Relief",
        brand: "Cipla",
        batchNumber: "PAR0012024",
        expiryDate: "2025-12-31",
        packSize: "10 Tablets",
        hsnCode: "30049011",
        rate: 25.50,
        gstRate: 12
      },
      {
        name: "Cough Syrup 100ml",
        quantity: 1,
        discountPercent: 5,
        taxAmount: 7.41,
        totalAmount: 124.91,
        category: "Cough & Cold",
        brand: "Dr Reddy's",
        batchNumber: "COU0012024",
        expiryDate: "2025-06-30",
        packSize: "100ml",
        hsnCode: "30049099",
        rate: 65.25,
        gstRate: 12
      }
    ],
    subTotal: 162.50,
    totalDiscount: 5.00,
    totalTax: 15.06,
    roundOff: -0.06,
    grandTotal: 172.50,
    paymentMode: "Cash",
    notes: "Medication for flu symptoms"
  },
  {
    invoiceNumber: "INV002/2025",
    date: "2025-01-16",
    customerId: "507f1f77bcf86cd799439012",
    customerName: "Priya Sharma",
    customerGst: null,
    items: [
      {
        name: "Vitamin D3 60k",
        quantity: 1,
        discountPercent: 0,
        taxAmount: 11.40,
        totalAmount: 106.40,
        category: "Vitamin",
        brand: "Cadila",
        batchNumber: "VIT0012024",
        expiryDate: "2026-03-20",
        packSize: "4 Softgel Capsules",
        hsnCode: "30045010",
        rate: 95.00,
        gstRate: 12
      },
      {
        name: "Cetirizine 10mg",
        quantity: 1,
        discountPercent: 0,
        taxAmount: 3.48,
        totalAmount: 38.73,
        category: "Allergy",
        brand: "Dr Reddy's",
        batchNumber: "CET0012024",
        expiryDate: "2025-11-30",
        packSize: "10 Tablets",
        hsnCode: "30049099",
        rate: 35.25,
        gstRate: 12
      }
    ],
    subTotal: 130.25,
    totalDiscount: 0,
    totalTax: 14.88,
    roundOff: -0.13,
    grandTotal: 145.00,
    paymentMode: "UPI",
    notes: "Vitamin supplement and allergy medication"
  }
];

const mockSettings = {
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

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - remove if you want to keep existing data)
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Invoice.deleteMany({});
    await Settings.deleteMany({});

    // Insert mock products
    const insertedProducts = await Product.insertMany(mockProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    // Insert mock customers
    const insertedCustomers = await Customer.insertMany(mockCustomers);
    console.log(`Inserted ${insertedCustomers.length} customers`);

    // Insert mock settings
    const settings = new Settings(mockSettings);
    await settings.save();
    console.log('Inserted default settings');

    // Insert mock invoices (with proper customer IDs)
    for (let i = 0; i < mockInvoices.length; i++) {
      const invoice = mockInvoices[i];
      invoice.customerId = insertedCustomers[i]._id.toString();
      const newInvoice = new Invoice(invoice);
      await newInvoice.save();
    }
    console.log(`Inserted ${mockInvoices.length} invoices`);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
seedDatabase();
