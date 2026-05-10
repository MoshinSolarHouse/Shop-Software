import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizmanager';

// Inline schemas to avoid import issues with ts-node
const ShopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['super-admin', 'admin', 'sales-man'], required: true, default: 'sales-man' },
  shopIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
  permissions: { type: Map, of: [String], default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

const CategorySchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
CategorySchema.index({ shopId: 1, name: 1 }, { unique: true });

const ProductSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, default: 'pcs' },
  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  totalDue: { type: Number, default: 0 },
}, { timestamps: true });

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);

const RESOURCES = ['dashboard', 'shops', 'products', 'categories', 'customers', 'sales', 'payments', 'reports', 'users', 'permissions'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

const DEFAULT_PERMISSIONS: Record<string, any> = {
  'super-admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'sales-man': {
    dashboard: ['read'],
    products: ['read'],
    categories: ['read'],
    customers: ['read', 'create'],
    sales: ['read', 'create'],
    payments: ['read', 'create'],
    reports: [],
    shops: ['read'],
    users: [],
    permissions: [],
  },
};

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected. Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
  ]);

  // Create shops
  const electricShop = await Shop.create({ name: 'Electric Store', type: 'Electronics', description: 'Electrical appliances and accessories', isActive: true });
  const solarShop = await Shop.create({ name: 'Solar System Shop', type: 'Solar Energy', description: 'Solar panels, batteries, and inverters', isActive: true });
  console.log(`Created shops: ${electricShop.name}, ${solarShop.name}`);

  // Create users
  const users = await User.create([
    {
      name: 'Super Admin',
      email: 'superadmin@biz.com',
      password: 'password123',
      role: 'super-admin',
      shopIds: [electricShop._id, solarShop._id],
      permissions: DEFAULT_PERMISSIONS['super-admin'],
      isActive: true,
    },
    {
      name: 'Admin User',
      email: 'admin@biz.com',
      password: 'password123',
      role: 'admin',
      shopIds: [electricShop._id, solarShop._id],
      permissions: DEFAULT_PERMISSIONS['admin'],
      isActive: true,
    },
    {
      name: 'Ali Salesman',
      email: 'ali@biz.com',
      password: 'password123',
      role: 'sales-man',
      shopIds: [electricShop._id],
      permissions: DEFAULT_PERMISSIONS['sales-man'],
      isActive: true,
    },
    {
      name: 'Usman Salesman',
      email: 'usman@biz.com',
      password: 'password123',
      role: 'sales-man',
      shopIds: [solarShop._id],
      permissions: DEFAULT_PERMISSIONS['sales-man'],
      isActive: true,
    },
  ]);
  console.log(`Created ${users.length} users`);

  // Create categories
  const categories = await Category.create([
    { shopId: electricShop._id, name: 'Wiring & Cables', image: '', isActive: true },
    { shopId: electricShop._id, name: 'Switches & Sockets', image: '', isActive: true },
    { shopId: electricShop._id, name: 'Circuit Breakers', image: '', isActive: true },
    { shopId: electricShop._id, name: 'Lighting', image: '', isActive: true },
    { shopId: solarShop._id, name: 'Solar Panels', image: '', isActive: true },
    { shopId: solarShop._id, name: 'Batteries', image: '', isActive: true },
    { shopId: solarShop._id, name: 'Inverters', image: '', isActive: true },
    { shopId: solarShop._id, name: 'Mounting & Accessories', image: '', isActive: true },
  ]);
  console.log(`Created ${categories.length} categories`);

  const electricCats = categories.filter(c => c.shopId.equals(electricShop._id));
  const solarCats = categories.filter(c => c.shopId.equals(solarShop._id));

  // Create products
  const products = await Product.create([
    // Electric Store products
    { shopId: electricShop._id, categoryId: electricCats[0]._id, name: '2.5mm Wire (90m)', unit: 'roll', costPrice: 4500, salePrice: 5200, stock: 50, lowStockThreshold: 10, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[0]._id, name: '4mm Wire (90m)', unit: 'roll', costPrice: 7200, salePrice: 8100, stock: 30, lowStockThreshold: 5, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[1]._id, name: 'Switch 1-Gang', unit: 'pcs', costPrice: 120, salePrice: 180, stock: 200, lowStockThreshold: 20, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[1]._id, name: 'Socket 13A', unit: 'pcs', costPrice: 150, salePrice: 220, stock: 150, lowStockThreshold: 15, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[2]._id, name: 'MCB 32A', unit: 'pcs', costPrice: 350, salePrice: 500, stock: 80, lowStockThreshold: 10, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[2]._id, name: 'MCB 63A', unit: 'pcs', costPrice: 600, salePrice: 850, stock: 40, lowStockThreshold: 5, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[3]._id, name: 'LED Bulb 12W', unit: 'pcs', costPrice: 80, salePrice: 130, stock: 300, lowStockThreshold: 30, images: [], isActive: true },
    { shopId: electricShop._id, categoryId: electricCats[3]._id, name: 'Tube Light 4ft', unit: 'pcs', costPrice: 250, salePrice: 380, stock: 100, lowStockThreshold: 10, images: [], isActive: true },
    // Solar Shop products
    { shopId: solarShop._id, categoryId: solarCats[0]._id, name: 'Solar Panel 550W', unit: 'pcs', costPrice: 22000, salePrice: 26000, stock: 25, lowStockThreshold: 5, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[0]._id, name: 'Solar Panel 400W', unit: 'pcs', costPrice: 16000, salePrice: 19500, stock: 30, lowStockThreshold: 5, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[1]._id, name: 'Tubular Battery 200Ah', unit: 'pcs', costPrice: 28000, salePrice: 34000, stock: 15, lowStockThreshold: 3, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[1]._id, name: 'Dry Battery 150Ah', unit: 'pcs', costPrice: 18000, salePrice: 22000, stock: 20, lowStockThreshold: 3, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[2]._id, name: 'Inverter 3.2kW', unit: 'pcs', costPrice: 45000, salePrice: 55000, stock: 10, lowStockThreshold: 2, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[2]._id, name: 'Inverter 5kW', unit: 'pcs', costPrice: 65000, salePrice: 78000, stock: 8, lowStockThreshold: 2, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[3]._id, name: 'Mounting Structure', unit: 'set', costPrice: 5000, salePrice: 7500, stock: 20, lowStockThreshold: 5, images: [], isActive: true },
    { shopId: solarShop._id, categoryId: solarCats[3]._id, name: 'DC Wire 6mm (100m)', unit: 'roll', costPrice: 3500, salePrice: 4500, stock: 15, lowStockThreshold: 3, images: [], isActive: true },
  ]);
  console.log(`Created ${products.length} products`);

  // Create customers
  const customers = await Customer.create([
    { shopId: electricShop._id, name: 'Ahmed Khan', phone: '0300-1234567', address: 'Main Market, Lahore', totalDue: 5000 },
    { shopId: electricShop._id, name: 'Bilal Construction', phone: '0321-9876543', address: 'DHA Phase 5, Lahore', totalDue: 12000 },
    { shopId: electricShop._id, name: 'Rashid Electric', phone: '0333-5551234', address: 'Gulberg, Lahore', totalDue: 0 },
    { shopId: solarShop._id, name: 'Farm House Ali', phone: '0345-1112233', address: 'Bedian Road, Lahore', totalDue: 25000 },
    { shopId: solarShop._id, name: 'Green Energy Co', phone: '0300-4445566', address: 'Faisal Town, Lahore', totalDue: 8000 },
    { shopId: solarShop._id, name: 'Walk-in Customer', phone: '', address: '', totalDue: 0 },
  ]);
  console.log(`Created ${customers.length} customers`);

  console.log('\n=== Seed Complete ===');
  console.log('\nLogin Credentials:');
  console.log('  Super Admin:  superadmin@biz.com / password123');
  console.log('  Admin:        admin@biz.com / password123');
  console.log('  Sales Man 1:  ali@biz.com / password123');
  console.log('  Sales Man 2:  usman@biz.com / password123');

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
