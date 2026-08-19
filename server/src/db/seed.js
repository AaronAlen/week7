import bcrypt from 'bcryptjs';
import { sequelize, User, Product, InventoryTransaction } from '../models/index.js';
import { logger } from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    logger.info('🌱 Database reset and synced for seeding.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Users
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@stockpilot.io',
      password: passwordHash,
      role: 'ADMIN'
    });

    const manager = await User.create({
      name: 'Inventory Manager',
      email: 'manager@stockpilot.io',
      password: passwordHash,
      role: 'MANAGER'
    });

    const staff = await User.create({
      name: 'Operations Staff',
      email: 'staff@stockpilot.io',
      password: passwordHash,
      role: 'STAFF'
    });

    logger.info('✅ Initial users created: Admin, Manager, Staff (Password: password123)');

    // 2. Create Sample Products
    const products = await Product.bulkCreate([
      {
        name: 'Wireless Ergonomic Mouse',
        description: 'High precision optical mouse with ergonomic wrist support and rechargeable battery.',
        sku: 'SKU-MOUSE-001',
        currentStock: 25,
        safetyThreshold: 15,
        targetStock: 50,
        unitCost: 25.00,
        supplierName: 'TechLogistics Inc',
        supplierEmail: 'supplier@techlogistics.com',
        image: null
      },
      {
        name: 'Ultra-Wide 34-inch Curved Monitor',
        description: '4K IPS 144Hz curved workstation monitor for professional productivity.',
        sku: 'SKU-MONITOR-002',
        currentStock: 4, // Below safety 10 -> Low stock! Reorder 16 * $450 = $7200 (> $1000 HITL)
        safetyThreshold: 10,
        targetStock: 20,
        unitCost: 450.00,
        supplierName: 'DisplayDirect Corp',
        supplierEmail: 'orders@displaydirect.com',
        image: null
      },
      {
        name: 'USB-C 8-in-1 Aluminum Multi-Port Hub',
        description: 'Compact USB-C hub with HDMI 4K, 100W Power Delivery, SD Card reader, and USB 3.0.',
        sku: 'SKU-HUB-003',
        currentStock: 8, // Below safety 20 -> Low stock! Reorder 52 * $18.50 = $962 (<= $1000 Auto PO)
        safetyThreshold: 20,
        targetStock: 60,
        unitCost: 18.50,
        supplierName: 'Connectivity Solutions',
        supplierEmail: 'sales@connectsol.com',
        image: null
      },
      {
        name: 'Mechanical RGB Gaming Keyboard',
        description: 'Custom hot-swappable tactile switches with per-key RGB illumination.',
        sku: 'SKU-KEYBOARD-004',
        currentStock: 45, // Normal healthy stock
        safetyThreshold: 20,
        targetStock: 80,
        unitCost: 85.00,
        supplierName: 'Peripheral Hub',
        supplierEmail: 'orders@peripheralhub.com',
        image: null
      },
      {
        name: 'Active Noise-Canceling Wireless Headset',
        description: 'Premium Bluetooth headset with dual mics, crystal clear audio, and 40h battery life.',
        sku: 'SKU-HEADSET-005',
        currentStock: 5, // Below safety 12 -> Low stock! Reorder 25 * $199 = $4975 (> $1000 HITL)
        safetyThreshold: 12,
        targetStock: 30,
        unitCost: 199.00,
        supplierName: 'AudioTech Ltd',
        supplierEmail: 'fulfillment@audiotech.com',
        image: null
      }
    ]);

    logger.info(`✅ Seeded ${products.length} initial products.`);

    // 3. Create Initial Inventory Transactions
    for (const p of products) {
      await InventoryTransaction.create({
        productId: p.id,
        type: 'ADJUSTMENT',
        quantity: p.currentStock,
        previousStock: 0,
        newStock: p.currentStock,
        referenceId: 'INITIAL_SEED'
      });
    }

    logger.info('🌱 Database seeding completed successfully.');
    return { admin, manager, staff, products };
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Execute if run directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
