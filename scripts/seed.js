require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User      = require('../src/models/User');
const Category  = require('../src/models/Category');
const Product   = require('../src/models/Product');
const Inventory = require('../src/models/Inventory');
const Order     = require('../src/models/Order');
const Review    = require('../src/models/Review');

// ─── helpers ────────────────────────────────────────────────────────────────

const rand     = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick     = (arr)      => arr[Math.floor(Math.random() * arr.length)];
const pickMany = (arr, n)   => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);

// ─── seed data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets and electronic devices' },
  { name: 'Clothing',    slug: 'clothing',    description: 'Apparel and fashion items' },
  { name: 'Food',        slug: 'food',        description: 'Groceries and gourmet food items' },
];

const RAW_USERS = [
  { name: 'Alice Sharma',   email: 'alice@zimart.com',   role: 'seller'   },
  { name: 'Bob Tenzin',     email: 'bob@zimart.com',     role: 'seller'   },
  { name: 'Carol Dema',     email: 'carol@zimart.com',   role: 'customer' },
  { name: 'David Norbu',    email: 'david@zimart.com',   role: 'customer' },
  { name: 'Eva Wangchuk',   email: 'eva@zimart.com',     role: 'customer' },
  { name: 'Frank Dorji',    email: 'frank@zimart.com',   role: 'seller'   },
  { name: 'Grace Lhamo',    email: 'grace@zimart.com',   role: 'customer' },
  { name: 'Henry Phuntsho', email: 'henry@zimart.com',   role: 'customer' },
  { name: 'Iris Choden',    email: 'iris@zimart.com',    role: 'customer' },
  { name: 'Jay Pelden',     email: 'jay@zimart.com',     role: 'customer' },
];

const PRODUCTS_BY_CATEGORY = {
  Electronics: [
    {
      name: 'ProBook Laptop 15',
      description: 'High-performance laptop with 15.6" FHD display, ideal for work and gaming.',
      price: 849.99,
      subcategory: 'Laptops',
      attributes: { ram: '16GB', storage: '512GB SSD', processor: 'Intel i7' },
      tags: ['laptop', 'computer', 'intel'],
      variants: [
        { color: 'Silver', stock: rand(10, 60) },
        { color: 'Space Grey', stock: rand(10, 60) },
      ],
    },
    {
      name: 'UltraBook Air 13',
      description: 'Ultra-thin 13" laptop weighing just 1.1 kg, built for portability.',
      price: 1099.99,
      subcategory: 'Laptops',
      attributes: { ram: '8GB', storage: '256GB SSD', processor: 'Apple M2' },
      tags: ['laptop', 'ultrabook', 'thin'],
      variants: [
        { color: 'Gold', stock: rand(10, 60) },
        { color: 'Silver', stock: rand(10, 60) },
      ],
    },
    {
      name: 'Galaxy Smartphone X12',
      description: '6.7" AMOLED display smartphone with 108MP camera and 5G connectivity.',
      price: 699.99,
      subcategory: 'Smartphones',
      attributes: { ram: '12GB', storage: '256GB', battery: '5000mAh' },
      tags: ['smartphone', 'android', '5g'],
      variants: [
        { color: 'Phantom Black', stock: rand(10, 80) },
        { color: 'Cream White',   stock: rand(10, 80) },
        { color: 'Green',         stock: rand(5,  40) },
      ],
    },
    {
      name: 'iPhone Lite 15',
      description: 'Compact 6.1" iPhone with A16 chip and all-day battery life.',
      price: 799.00,
      subcategory: 'Smartphones',
      attributes: { ram: '6GB', storage: '128GB', chip: 'A16 Bionic' },
      tags: ['iphone', 'apple', 'smartphone'],
      variants: [
        { color: 'Blue',      stock: rand(10, 60) },
        { color: 'Midnight',  stock: rand(10, 60) },
        { color: 'Starlight', stock: rand(10, 60) },
      ],
    },
    {
      name: 'SoundMax Pro Headphones',
      description: 'Wireless noise-cancelling over-ear headphones with 30-hour battery.',
      price: 249.99,
      subcategory: 'Audio',
      attributes: { type: 'Over-ear', connectivity: 'Bluetooth 5.3', noiseCancelling: true },
      tags: ['headphones', 'audio', 'wireless'],
      variants: [
        { color: 'Black', stock: rand(15, 80) },
        { color: 'White', stock: rand(15, 80) },
      ],
    },
    {
      name: 'BassBoost Earbuds TWS',
      description: 'True wireless earbuds with deep bass and 8-hour playtime.',
      price: 79.99,
      subcategory: 'Audio',
      attributes: { type: 'In-ear', connectivity: 'Bluetooth 5.2', waterproof: 'IPX5' },
      tags: ['earbuds', 'tws', 'bluetooth'],
      variants: [
        { color: 'Black', stock: rand(20, 100) },
        { color: 'Navy',  stock: rand(20, 100) },
      ],
    },
    {
      name: '4K Smart TV 55"',
      description: '55-inch 4K QLED smart TV with Dolby Vision and built-in streaming apps.',
      price: 599.99,
      subcategory: 'Televisions',
      attributes: { resolution: '4K UHD', panel: 'QLED', smartOS: 'Tizen' },
      tags: ['tv', '4k', 'smart', 'qled'],
      variants: [{ color: 'Black', stock: rand(5, 30) }],
    },
    {
      name: 'MechKey Pro Keyboard',
      description: 'Full-size mechanical keyboard with Cherry MX Red switches and RGB backlight.',
      price: 119.99,
      subcategory: 'Peripherals',
      attributes: { switches: 'Cherry MX Red', layout: 'Full-size', backlight: 'RGB' },
      tags: ['keyboard', 'mechanical', 'gaming'],
      variants: [
        { color: 'Black', stock: rand(15, 70) },
        { color: 'White', stock: rand(15, 70) },
      ],
    },
    {
      name: 'GamingMouse X500',
      description: 'Ergonomic gaming mouse with 25K DPI sensor and 11 programmable buttons.',
      price: 59.99,
      subcategory: 'Peripherals',
      attributes: { dpi: '25600', buttons: 11, connectivity: 'Wired USB-C' },
      tags: ['mouse', 'gaming', 'rgb'],
      variants: [
        { color: 'Black', stock: rand(20, 90) },
        { color: 'Red',   stock: rand(10, 50) },
      ],
    },
    {
      name: 'SmartWatch Series 8',
      description: 'Health-focused smartwatch with ECG, blood oxygen, and GPS tracking.',
      price: 329.99,
      subcategory: 'Wearables',
      attributes: { display: '1.9" AMOLED', sensors: 'ECG, SpO2, GPS', waterproof: '5ATM' },
      tags: ['smartwatch', 'fitness', 'wearable'],
      variants: [
        { color: 'Black',  stock: rand(10, 50) },
        { color: 'Silver', stock: rand(10, 50) },
        { color: 'Gold',   stock: rand(5,  30) },
      ],
    },
    {
      name: 'Portable SSD 1TB',
      description: 'USB-C portable SSD with 1050 MB/s read speed in a pocket-sized form.',
      price: 89.99,
      subcategory: 'Storage',
      attributes: { capacity: '1TB', readSpeed: '1050 MB/s', interface: 'USB-C 3.2' },
      tags: ['ssd', 'storage', 'portable'],
      variants: [
        { color: 'Blue',  stock: rand(15, 80) },
        { color: 'Black', stock: rand(15, 80) },
      ],
    },
    {
      name: 'Webcam HD Pro 4K',
      description: '4K 60fps webcam with auto-focus, built-in stereo mic, and low-light correction.',
      price: 149.99,
      subcategory: 'Peripherals',
      attributes: { resolution: '4K 60fps', mic: 'Stereo built-in', autofocus: true },
      tags: ['webcam', 'streaming', '4k'],
      variants: [{ color: 'Black', stock: rand(10, 60) }],
    },
    {
      name: 'Drone FPV Mini 4',
      description: 'Sub-250g FPV drone with 4K stabilised camera and 34-min flight time.',
      price: 399.99,
      subcategory: 'Drones',
      attributes: { weight: '249g', camera: '4K/60fps', flightTime: '34 min' },
      tags: ['drone', 'fpv', '4k'],
      variants: [{ color: 'Grey', stock: rand(5, 25) }],
    },
    {
      name: 'Power Bank 20000mAh',
      description: '20000mAh slim power bank with 65W PD fast charging and dual USB-C ports.',
      price: 44.99,
      subcategory: 'Accessories',
      attributes: { capacity: '20000mAh', output: '65W PD', ports: 'USB-C x2, USB-A x1' },
      tags: ['powerbank', 'charging', 'travel'],
      variants: [
        { color: 'Black',  stock: rand(20, 100) },
        { color: 'White',  stock: rand(20, 100) },
      ],
    },
    {
      name: 'WiFi Router AX6000',
      description: 'Tri-band WiFi 6 router with 6000 Mbps total throughput and 8 antennas.',
      price: 219.99,
      subcategory: 'Networking',
      attributes: { standard: 'WiFi 6 (802.11ax)', speed: '6000 Mbps', bands: 'Tri-band' },
      tags: ['router', 'wifi6', 'networking'],
      variants: [{ color: 'Black', stock: rand(10, 40) }],
    },
  ],

  Clothing: [
    {
      name: 'Classic Slim Fit Jeans',
      description: 'Stretch denim slim-fit jeans with a comfortable mid-rise waist.',
      price: 49.99,
      subcategory: 'Bottoms',
      attributes: { fabric: '98% Cotton, 2% Elastane', fit: 'Slim', rise: 'Mid' },
      tags: ['jeans', 'denim', 'slim'],
      variants: [
        { size: 'S',  color: 'Dark Blue', stock: rand(10, 60) },
        { size: 'M',  color: 'Dark Blue', stock: rand(10, 60) },
        { size: 'L',  color: 'Dark Blue', stock: rand(10, 60) },
        { size: 'XL', color: 'Dark Blue', stock: rand(5,  30) },
      ],
    },
    {
      name: 'Essential Cotton T-Shirt',
      description: 'Everyday 100% organic cotton crew-neck T-shirt, pre-shrunk.',
      price: 19.99,
      subcategory: 'Tops',
      attributes: { fabric: '100% Organic Cotton', fit: 'Regular', neck: 'Crew' },
      tags: ['tshirt', 'basics', 'cotton'],
      variants: [
        { size: 'S',  color: 'White', stock: rand(20, 100) },
        { size: 'M',  color: 'White', stock: rand(20, 100) },
        { size: 'L',  color: 'White', stock: rand(20, 100) },
        { size: 'M',  color: 'Black', stock: rand(20, 100) },
        { size: 'L',  color: 'Black', stock: rand(20, 100) },
      ],
    },
    {
      name: 'Merino Wool Sweater',
      description: 'Fine-knit merino wool pullover, naturally breathable and itch-free.',
      price: 89.99,
      subcategory: 'Tops',
      attributes: { fabric: '100% Merino Wool', knit: 'Fine', care: 'Hand wash' },
      tags: ['sweater', 'wool', 'knitwear'],
      variants: [
        { size: 'S',  color: 'Navy',  stock: rand(10, 50) },
        { size: 'M',  color: 'Navy',  stock: rand(10, 50) },
        { size: 'L',  color: 'Camel', stock: rand(10, 50) },
      ],
    },
    {
      name: 'Puffer Winter Jacket',
      description: 'Lightweight 550-fill down puffer jacket with a water-repellent shell.',
      price: 139.99,
      subcategory: 'Outerwear',
      attributes: { fill: '550-fill duck down', shell: 'Recycled nylon', waterRepellent: true },
      tags: ['jacket', 'winter', 'down'],
      variants: [
        { size: 'S',  color: 'Black', stock: rand(8, 40) },
        { size: 'M',  color: 'Black', stock: rand(8, 40) },
        { size: 'L',  color: 'Olive', stock: rand(8, 40) },
        { size: 'XL', color: 'Olive', stock: rand(5, 20) },
      ],
    },
    {
      name: 'Linen Summer Shirt',
      description: 'Breathable 100% linen short-sleeve shirt perfect for hot climates.',
      price: 39.99,
      subcategory: 'Tops',
      attributes: { fabric: '100% Linen', sleeve: 'Short', collar: 'Cuban' },
      tags: ['shirt', 'linen', 'summer'],
      variants: [
        { size: 'S', color: 'White',    stock: rand(10, 60) },
        { size: 'M', color: 'White',    stock: rand(10, 60) },
        { size: 'M', color: 'Sky Blue', stock: rand(10, 60) },
        { size: 'L', color: 'Sky Blue', stock: rand(10, 60) },
      ],
    },
    {
      name: 'Yoga Leggings High-Waist',
      description: 'Four-way stretch high-waist yoga leggings with hidden waistband pocket.',
      price: 54.99,
      subcategory: 'Activewear',
      attributes: { fabric: 'Nylon/Spandex', waist: 'High-rise', pocket: 'Hidden' },
      tags: ['leggings', 'yoga', 'activewear'],
      variants: [
        { size: 'XS', color: 'Black',  stock: rand(10, 60) },
        { size: 'S',  color: 'Black',  stock: rand(10, 60) },
        { size: 'M',  color: 'Black',  stock: rand(10, 60) },
        { size: 'M',  color: 'Purple', stock: rand(10, 60) },
      ],
    },
    {
      name: 'Running Shorts 7"',
      description: 'Lightweight 7" inseam running shorts with built-in liner and zip pocket.',
      price: 34.99,
      subcategory: 'Activewear',
      attributes: { fabric: 'Recycled Polyester', inseam: '7"', liner: true },
      tags: ['shorts', 'running', 'sportswear'],
      variants: [
        { size: 'S', color: 'Navy',  stock: rand(15, 70) },
        { size: 'M', color: 'Navy',  stock: rand(15, 70) },
        { size: 'M', color: 'Black', stock: rand(15, 70) },
        { size: 'L', color: 'Black', stock: rand(10, 50) },
      ],
    },
    {
      name: 'Formal Oxford Shirt',
      description: 'Classic Oxford weave button-down shirt with a button-down collar.',
      price: 59.99,
      subcategory: 'Tops',
      attributes: { fabric: '100% Cotton Oxford', collar: 'Button-down', fit: 'Regular' },
      tags: ['shirt', 'formal', 'oxford'],
      variants: [
        { size: 'S', color: 'Light Blue', stock: rand(10, 50) },
        { size: 'M', color: 'Light Blue', stock: rand(10, 50) },
        { size: 'L', color: 'White',      stock: rand(10, 50) },
        { size: 'L', color: 'Pink',       stock: rand(8,  40) },
      ],
    },
    {
      name: 'Chino Trousers',
      description: 'Slim-fit cotton-twill chinos with a clean flat front for a smart-casual look.',
      price: 44.99,
      subcategory: 'Bottoms',
      attributes: { fabric: '98% Cotton Twill', fit: 'Slim', closure: 'Zip fly' },
      tags: ['chinos', 'trousers', 'smart-casual'],
      variants: [
        { size: 'S',  color: 'Khaki', stock: rand(10, 50) },
        { size: 'M',  color: 'Khaki', stock: rand(10, 50) },
        { size: 'L',  color: 'Navy',  stock: rand(10, 50) },
        { size: 'XL', color: 'Navy',  stock: rand(5,  25) },
      ],
    },
    {
      name: 'Fleece Zip Hoodie',
      description: 'Warm recycled-fleece full-zip hoodie with kangaroo pocket and adjustable hood.',
      price: 69.99,
      subcategory: 'Tops',
      attributes: { fabric: '100% Recycled Polyester Fleece', closure: 'Full-zip', hood: true },
      tags: ['hoodie', 'fleece', 'casual'],
      variants: [
        { size: 'S',  color: 'Grey',  stock: rand(10, 60) },
        { size: 'M',  color: 'Grey',  stock: rand(10, 60) },
        { size: 'L',  color: 'Black', stock: rand(10, 60) },
        { size: 'XL', color: 'Black', stock: rand(8,  40) },
      ],
    },
  ],

  Food: [
    {
      name: 'Organic Green Tea (100g)',
      description: 'Single-origin Darjeeling first-flush green tea with a delicate floral taste.',
      price: 12.99,
      subcategory: 'Beverages',
      attributes: { origin: 'Darjeeling, India', weight: '100g', caffeineLevel: 'Low' },
      tags: ['tea', 'organic', 'green-tea'],
      variants: [{ stock: rand(20, 100) }],
    },
    {
      name: 'Cold Brew Coffee Pack (250g)',
      description: 'Coarsely ground Arabica blend optimised for 12-hour cold brew extraction.',
      price: 15.99,
      subcategory: 'Beverages',
      attributes: { origin: 'Ethiopia/Colombia blend', grind: 'Coarse', weight: '250g' },
      tags: ['coffee', 'cold-brew', 'arabica'],
      variants: [{ stock: rand(20, 100) }],
    },
    {
      name: 'Extra Virgin Olive Oil (500ml)',
      description: 'Cold-pressed Greek EVOO with a robust peppery finish, acidity < 0.2%.',
      price: 18.99,
      subcategory: 'Oils & Condiments',
      attributes: { origin: 'Crete, Greece', volume: '500ml', acidity: '< 0.2%' },
      tags: ['olive-oil', 'greek', 'organic'],
      variants: [{ stock: rand(15, 80) }],
    },
    {
      name: 'Raw Himalayan Honey (350g)',
      description: 'Unfiltered raw honey from high-altitude Himalayan wildflowers.',
      price: 22.99,
      subcategory: 'Sweeteners',
      attributes: { origin: 'Bhutan Himalayas', weight: '350g', type: 'Raw & Unfiltered' },
      tags: ['honey', 'himalayan', 'raw'],
      variants: [{ stock: rand(15, 80) }],
    },
    {
      name: 'Dark Chocolate 85% (100g)',
      description: 'Single-origin Ecuador cacao bar with 85% cocoa content and no added soy.',
      price: 6.99,
      subcategory: 'Snacks',
      attributes: { cocoa: '85%', origin: 'Ecuador', allergens: 'Milk-free, Soy-free' },
      tags: ['chocolate', 'dark', 'vegan'],
      variants: [{ stock: rand(30, 120) }],
    },
    {
      name: 'Organic Rolled Oats (1kg)',
      description: 'Whole-grain gluten-free rolled oats, lightly steamed and stone-rolled.',
      price: 7.49,
      subcategory: 'Grains & Cereals',
      attributes: { weight: '1kg', glutenFree: true, certification: 'USDA Organic' },
      tags: ['oats', 'breakfast', 'organic'],
      variants: [{ stock: rand(30, 100) }],
    },
    {
      name: 'Mixed Nuts Roasted (500g)',
      description: 'Lightly salted dry-roasted mix of almonds, cashews, walnuts, and pistachios.',
      price: 16.99,
      subcategory: 'Snacks',
      attributes: { weight: '500g', salt: 'Lightly salted', nuts: 'Almond, Cashew, Walnut, Pistachio' },
      tags: ['nuts', 'snacks', 'protein'],
      variants: [{ stock: rand(20, 90) }],
    },
    {
      name: 'Basmati Rice Premium (2kg)',
      description: 'Aged 2-year extra-long grain basmati rice from the Himalayan foothills.',
      price: 11.99,
      subcategory: 'Grains & Cereals',
      attributes: { weight: '2kg', grain: 'Extra-long', aged: '2 years' },
      tags: ['rice', 'basmati', 'staple'],
      variants: [{ stock: rand(25, 100) }],
    },
    {
      name: 'Dried Mango Strips (200g)',
      description: 'Sun-dried unsweetened mango strips from Alphonso mangoes with no additives.',
      price: 8.49,
      subcategory: 'Snacks',
      attributes: { weight: '200g', mango: 'Alphonso', addedSugar: false },
      tags: ['dried-fruit', 'mango', 'snacks'],
      variants: [{ stock: rand(20, 100) }],
    },
    {
      name: 'Artisan Sourdough Bread',
      description: '48-hour cold-fermented sourdough loaf with a crisp crust and open crumb.',
      price: 9.99,
      subcategory: 'Bakery',
      attributes: { weight: '800g', fermentation: '48hr cold proof', flour: 'Stoneground wheat' },
      tags: ['bread', 'sourdough', 'artisan'],
      variants: [{ stock: rand(10, 40) }],
    },
    {
      name: 'Matcha Powder Ceremonial (50g)',
      description: 'First-harvest ceremonial grade matcha from Uji, Kyoto, with a vibrant green hue.',
      price: 29.99,
      subcategory: 'Beverages',
      attributes: { origin: 'Uji, Kyoto', grade: 'Ceremonial', weight: '50g' },
      tags: ['matcha', 'japanese', 'ceremonial'],
      variants: [{ stock: rand(15, 70) }],
    },
    {
      name: 'Greek Yogurt Starter Culture',
      description: 'Freeze-dried live cultures (L. bulgaricus + S. thermophilus) for homemade yogurt.',
      price: 5.99,
      subcategory: 'Dairy & Alternatives',
      attributes: { cultures: 'L. bulgaricus, S. thermophilus', servings: '10L', storage: 'Freeze-dried' },
      tags: ['yogurt', 'probiotics', 'cultures'],
      variants: [{ stock: rand(20, 80) }],
    },
    {
      name: 'Spice Blends Gift Set',
      description: 'Curated set of 6 hand-blended spice mixes: Tikka Masala, Za\'atar, Ras el Hanout, Dukkah, Chimichurri, Harissa.',
      price: 34.99,
      subcategory: 'Spices & Seasonings',
      attributes: { count: 6, weight: '30g each', origin: 'Various' },
      tags: ['spices', 'gift', 'cooking'],
      variants: [{ stock: rand(15, 60) }],
    },
    {
      name: 'Coconut Aminos (250ml)',
      description: 'Soy-sauce alternative made from fermented coconut sap — gluten-free and paleo.',
      price: 9.49,
      subcategory: 'Oils & Condiments',
      attributes: { volume: '250ml', glutenFree: true, soySodiumReduction: '73%' },
      tags: ['coconut', 'condiment', 'paleo'],
      variants: [{ stock: rand(20, 80) }],
    },
    {
      name: 'Sprouted Chia Seeds (300g)',
      description: 'Omega-3 rich sprouted chia seeds; mild nutty flavour, ideal for smoothies.',
      price: 10.99,
      subcategory: 'Superfoods',
      attributes: { weight: '300g', omega3: '5g per 28g', sprouted: true },
      tags: ['chia', 'superfoods', 'omega3'],
      variants: [{ stock: rand(20, 90) }],
    },
  ],
};

// ─── main ────────────────────────────────────────────────────────────────────

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // ── 1. clear existing data ──────────────────────────────────────────────
  console.log('\nClearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('✓ Collections cleared');

  // ── 2. categories ───────────────────────────────────────────────────────
  console.log('\nSeeding categories…');
  const categories = await Category.insertMany(CATEGORIES);
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c._id]));
  console.log(`✓ ${categories.length} categories created`);

  // ── 3. users (passwords hashed manually — bypasses pre-save hook in bulk) ─
  console.log('\nSeeding users…');
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const userData = RAW_USERS.map((u) => ({ ...u, password: passwordHash }));
  const users = await User.insertMany(userData);

  const sellers   = users.filter((u) => u.role === 'seller');
  const customers = users.filter((u) => u.role === 'customer');
  console.log(`✓ ${users.length} users created (${sellers.length} sellers, ${customers.length} customers)`);

  // ── 4. products + inventory ─────────────────────────────────────────────
  console.log('\nSeeding products and inventory…');
  const allProducts = [];

  for (const [catName, productDefs] of Object.entries(PRODUCTS_BY_CATEGORY)) {
    const categoryId = catMap[catName];

    for (const def of productDefs) {
      const { variants, ...rest } = def;

      const product = await Product.create({
        ...rest,
        category: categoryId,
        sellerId: pick(sellers)._id,
        variants,
        ratings: { average: parseFloat((Math.random() * 2 + 3).toFixed(1)), count: rand(5, 200) },
        isActive: true,
      });

      // Aggregate stock across variants; Food products have no variants so use a direct value
      const totalStock = variants.length > 0
        ? variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
        : rand(10, 100);

      await Inventory.create({
        productId: product._id,
        stock: totalStock,
        lowStockThreshold: 10,
        lastUpdated: new Date(),
      });

      allProducts.push(product);
    }
  }

  console.log(`✓ ${allProducts.length} products created`);
  console.log(`✓ ${allProducts.length} inventory records created`);

  // ── 5. orders ───────────────────────────────────────────────────────────
  console.log('\nSeeding orders…');
  const statuses    = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const payMethods  = ['card', 'paypal', 'cod'];
  const sampleAddr  = { street: '123 Main St', city: 'Thimphu', country: 'Bhutan' };

  const orders = [];

  for (let i = 0; i < 20; i++) {
    const user          = pick(customers);
    const itemCount     = rand(1, 4);
    const chosenProducts = pickMany(allProducts, itemCount);

    const items = chosenProducts.map((p) => ({
      productId: p._id,
      name:      p.name,
      quantity:  rand(1, 3),
      price:     p.price,
    }));

    const totalAmount = parseFloat(
      items.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)
    );

    const status     = pick(statuses);
    const paidAt     = ['Delivered', 'Shipped', 'Confirmed'].includes(status) ? new Date() : undefined;

    const order = await Order.create({
      userId:          user._id,
      items,
      totalAmount,
      status,
      shippingAddress: sampleAddr,
      paymentMethod:   pick(payMethods),
      isPaid:          !!paidAt,
      paidAt,
    });

    orders.push(order);
  }

  console.log(`✓ ${orders.length} orders created`);

  // ── 6. reviews (only for Delivered orders) ─────────────────────────────
  console.log('\nSeeding reviews…');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
  const reviews = [];
  const reviewedPairs = new Set();       // prevent duplicate userId+productId

  for (const order of deliveredOrders) {
    for (const item of order.items) {
      const pairKey = `${order.userId}:${item.productId}`;
      if (reviewedPairs.has(pairKey)) continue;
      reviewedPairs.add(pairKey);

      const comments = [
        'Great product, exactly as described!',
        'Very happy with this purchase.',
        'Good value for money.',
        'Fast delivery, product is solid.',
        'Exceeded my expectations.',
        'Decent quality, would buy again.',
        'Packaging was excellent, product arrived in perfect condition.',
      ];

      reviews.push({
        userId:    order.userId,
        productId: item.productId,
        rating:    rand(3, 5),
        comment:   pick(comments),
      });
    }
  }

  if (reviews.length) {
    await Review.insertMany(reviews);
  }

  console.log(`✓ ${reviews.length} reviews created`);

  // ── done ────────────────────────────────────────────────────────────────
  console.log('\n✓ Seeding complete!\n');
  console.log('  Test credentials (all passwords: Password123!)');
  users.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}`));

  await mongoose.disconnect();
  console.log('\n✓ Disconnected from MongoDB');
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
