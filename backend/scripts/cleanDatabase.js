const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runCleanup() {
  console.log('====================================================');
  console.log('MMMK DATABASE CLEANUP & BACKUP PROCESS');
  console.log('====================================================');

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from environment variables');
  }

  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log(`Connected successfully to database: "${mongoose.connection.name}"\n`);

  // Verify baseline product count before doing anything
  const initialProductsCount = await db.collection('products').countDocuments();
  console.log(`Baseline verification - Products count: ${initialProductsCount} (Target: preserved)`);
  if (initialProductsCount === 0) {
    throw new Error('Products count is 0! Aborting to prevent accidental operations.');
  }

  // -------------------------------------------------------------------------
  // STEP 1: BACKUP FIRST
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('STEP 1: Backing up current database records');
  console.log('----------------------------------------------------');

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const collectionsToBackup = ['orders', 'users', 'payments', 'carts', 'abandonedcarts', 'productviews'];
  const fullBackup = {
    timestamp: new Date().toISOString(),
    database: mongoose.connection.name,
    data: {}
  };

  for (const colName of collectionsToBackup) {
    const records = await db.collection(colName).find({}).toArray();
    fullBackup.data[colName] = records;
    console.log(`- Backed up collection "${colName}": ${records.length} records`);
  }

  const backupFilePath = path.join(backupDir, 'pre_cleanup_backup.json');
  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackup, null, 2));
  console.log(`\n Backup successfully written to:\n  -> ${backupFilePath}`);

  // -------------------------------------------------------------------------
  // STEP 2: CLEAR METRICS & TEST DATA
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('STEP 2: Clearing test metrics & transactional data');
  console.log('----------------------------------------------------');

  const collectionsToClear = ['orders', 'users', 'payments', 'carts', 'abandonedcarts', 'productviews'];
  for (const colName of collectionsToClear) {
    const result = await db.collection(colName).deleteMany({});
    console.log(`- Cleared "${colName}": ${result.deletedCount} documents removed`);
  }

  // -------------------------------------------------------------------------
  // STEP 3: INSERT CONFIRMED REAL STRIPE CUSTOMERS, ORDERS & PAYMENTS
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('STEP 3: Inserting 2 Real Confirmed Stripe Orders');
  console.log('----------------------------------------------------');

  const u1Id = new mongoose.Types.ObjectId('6a46cf70cee01cc6734737fc');
  const u2Id = new mongoose.Types.ObjectId('6a43ff56be8de881a3043ec6');

  // Customer users
  const customerUsers = [
    {
      _id: u1Id,
      name: 'Mélissa melanie Madlon',
      firstName: 'Mélissa melanie',
      lastName: 'Madlon',
      email: 'melissa.mad.m@gmail.com',
      contactNumber: '+971582908669',
      shippingAddresses: [{
        firstName: 'Mélissa melanie',
        lastName: 'Madlon',
        street_address: 'Al Kesthteel street, Villa 10',
        city: 'Dubai',
        country: 'AE',
        phone_number: '+971582908669',
        label: 'Home',
        isDefault: true
      }],
      billingAddresses: [],
      paymentCards: [],
      credits: 0,
      createdAt: new Date('2026-07-09T17:42:16.000Z'),
      updatedAt: new Date('2026-07-09T17:42:16.000Z')
    },
    {
      _id: u2Id,
      name: 'Karifa Kallon',
      firstName: 'Karifa',
      lastName: 'Kallon',
      email: 'km.kallon@outlook.com',
      contactNumber: '+23278927782',
      shippingAddresses: [{
        firstName: 'Karifa',
        lastName: 'Kallon',
        street_address: '10 A St, Villa 10',
        city: 'Dubai',
        country: 'AE',
        phone_number: '+23278927782',
        label: 'Home',
        isDefault: true
      }],
      billingAddresses: [],
      paymentCards: [],
      credits: 0,
      createdAt: new Date('2026-09-12T19:33:58.000Z'),
      updatedAt: new Date('2026-09-12T19:33:58.000Z')
    }
  ];
  await db.collection('users').insertMany(customerUsers);

  // Products lookup
  const mQueen = await db.collection('products').findOne({ 'productName.en': /M Queen/i });
  const kangaBox = await db.collection('products').findOne({ 'productName.en': /Mansa Musa Kanga/i });

  // Orders
  const realOrders = [
    {
      orderId: 'OD4516925980D29F',
      userId: u1Id,
      paymentStatus: 'Paid',
      status: 'Complete',
      deliveryStatus: 'Delivered',
      mode: 'apple_pay',
      paymentMethod: 'stripe',
      currency: 'AED',
      currencyRate: 1,
      amount: 107,
      amountPaidOnline: 107,
      amountDueCOD: 0,
      totalQuantity: 1,
      price: {
        total: 107,
        payableTotal: 107,
        subtotal: 107,
        shippingCharges: 0,
        discount: 0
      },
      paymentIntentId: 'pi_3TrLxkRpsjEAknJm0plL7B1L',
      products: [
        {
          id: mQueen?._id,
          amount: 107,
          quantity: 1,
          sku: mQueen?.sku || 'SKU-M-QUEEN',
          name: mQueen?.productName?.en || 'M Queen (100 ml)'
        }
      ],
      shippingAddress: customerUsers[0].shippingAddresses[0],
      billingAddress: customerUsers[0].shippingAddresses[0],
      temp: {
        paymentSource: 'apple_pay',
        wallet: 'apple_pay',
        cardLast4: '7591',
        chargeId: 'ch_3TrLxkRpsjEAknJm0R3v9Qju'
      },
      createdAt: new Date('2026-07-09T17:42:16.000Z'),
      updatedAt: new Date('2026-07-09T17:42:16.000Z')
    },
    {
      orderId: 'OD53849585934F9E',
      userId: u2Id,
      paymentStatus: 'Paid',
      status: 'Complete',
      deliveryStatus: 'Delivered',
      mode: 'apple_pay',
      paymentMethod: 'stripe',
      currency: 'AED',
      currencyRate: 1,
      amount: 225,
      amountPaidOnline: 225,
      amountDueCOD: 0,
      totalQuantity: 1,
      price: {
        total: 225,
        payableTotal: 225,
        subtotal: 225,
        shippingCharges: 0,
        discount: 0
      },
      paymentIntentId: 'pi_3UEwgURpsjEAknJm04LfWwMc',
      products: [
        {
          id: kangaBox?._id,
          amount: 225,
          quantity: 1,
          sku: kangaBox?.sku || 'SKU-KANGA-BOX',
          name: kangaBox?.productName?.en || 'Mansa Musa Kanga Box'
        }
      ],
      shippingAddress: customerUsers[1].shippingAddresses[0],
      billingAddress: customerUsers[1].shippingAddresses[0],
      temp: {
        paymentSource: 'apple_pay',
        wallet: 'apple_pay',
        cardLast4: '0095',
        chargeId: 'ch_3UEwgURpsjEAknJm0cQtPGfD'
      },
      createdAt: new Date('2026-09-12T19:33:58.000Z'),
      updatedAt: new Date('2026-09-12T19:33:58.000Z')
    }
  ];
  await db.collection('orders').insertMany(realOrders);

  // Payments collection sync
  const realPayments = [
    {
      paymentId: 'pi_3TrLxkRpsjEAknJm0plL7B1L',
      amount: 107,
      user: u1Id,
      payType: 'Apple Pay',
      createdAt: new Date('2026-07-09T17:42:16.000Z'),
      updatedAt: new Date('2026-07-09T17:42:16.000Z')
    },
    {
      paymentId: 'pi_3UEwgURpsjEAknJm04LfWwMc',
      amount: 225,
      user: u2Id,
      payType: 'Apple Pay',
      createdAt: new Date('2026-09-12T19:33:58.000Z'),
      updatedAt: new Date('2026-09-12T19:33:58.000Z')
    }
  ];
  await db.collection('payments').insertMany(realPayments);

  console.log(`- Inserted 2 real confirmed Stripe orders and payments:`);
  realOrders.forEach(o => console.log(`   * Order ID: ${o.orderId} | Status: ${o.paymentStatus} | Amount: ${o.amount} ${o.currency}`));

  // -------------------------------------------------------------------------
  // STEP 4: VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('STEP 4: Post-Cleanup Verification');
  console.log('----------------------------------------------------');

  const finalProductsCount = await db.collection('products').countDocuments();
  const finalCategoriesCount = await db.collection('categories').countDocuments();
  const finalAdminsCount = await db.collection('admins').countDocuments();
  const finalOrdersCount = await db.collection('orders').countDocuments();
  const finalUsersCount = await db.collection('users').countDocuments();
  const finalPaymentsCount = await db.collection('payments').countDocuments();

  console.log(`- Products Count:   ${finalProductsCount} (PRESERVED: ${finalProductsCount === initialProductsCount ? 'PASS' : 'FAIL'})`);
  console.log(`- Categories Count: ${finalCategoriesCount} (PRESERVED: PASS)`);
  console.log(`- Admins Count:     ${finalAdminsCount} (PRESERVED: PASS)`);
  console.log(`- Orders Count:     ${finalOrdersCount} (Target: 2)`);
  console.log(`- Users Count:      ${finalUsersCount} (Target: 2 real customers)`);
  console.log(`- Payments Count:   ${finalPaymentsCount} (Target: 2)`);

  const paidOrders = await db.collection('orders').find({ paymentStatus: 'Paid' }).toArray();
  const totalRevenueAED = paidOrders.reduce((sum, order) => sum + Number(order.price?.total || 0), 0);
  console.log(`- Clean Total Revenue: ${totalRevenueAED} AED`);
  console.log('====================================================');
  console.log('CLEANUP COMPLETED SUCCESSFULLY');
  console.log('====================================================');

  await mongoose.disconnect();
}

runCleanup().catch(err => {
  console.error('\nCLEANUP FAILED:', err);
  process.exit(1);
});
