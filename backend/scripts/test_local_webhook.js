/**
 * Test: Hit local webhook and verify SKU qty actually updates in DB
 * Run: node scripts/test_local_webhook.js
 *
 * Make sure your local server is running first:  npm start / node app.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SKU_MODEL = require('../Models/sku');

const LOCAL_URL = 'http://localhost:3001/api/v1/webhook/juraa';

// ── helpers ──────────────────────────────────────────────────────────────────
const getSkuRecord = async (sku) =>
  SKU_MODEL.findOne({ sku }).lean();

const line = (char = '─', len = 50) => console.log(char.repeat(len));

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  line('═');
  console.log('  Local Webhook Test — inventory_updated');
  line('═');

  // 1. Connect to DB
  console.log('\n[1] Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('    ✅ Connected');

  // 2. Pick the first real SKU from DB
  console.log('\n[2] Fetching a real SKU from DB...');
  const firstSku = await SKU_MODEL.findOne({}).lean();
  if (!firstSku) {
    console.log('    ❌ No SKUs found in DB. Seed some products first.');
    process.exit(1);
  }
  const TEST_SKU     = firstSku.sku;
  const QTY_BEFORE   = firstSku.quantity;
  const NEW_QTY      = QTY_BEFORE + 99;   // bump by 99 so the change is obvious
  const RESTORE_QTY  = QTY_BEFORE;        // we restore at the end

  console.log(`    SKU         : ${TEST_SKU}`);
  console.log(`    DB qty NOW  : ${QTY_BEFORE}`);
  console.log(`    Will set to : ${NEW_QTY}`);

  // 3. Build payload
  const payload = {
    event: 'inventory_updated',
    data: {
      sku: TEST_SKU,
      newQuantity: NEW_QTY,
      variantIds: [],
      productIds: [],        // not sending productIds — tests SKU-only update path
    },
  };

  // 4. Hit the endpoint
  console.log(`\n[3] POSTing to ${LOCAL_URL} ...`);
  console.log('    Payload:', JSON.stringify(payload));
  let webhookResponse;
  try {
    const r = await axios.post(LOCAL_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
    });
    webhookResponse = { status: r.status, data: r.data };
  } catch (e) {
    webhookResponse = {
      status: e.response?.status || 'ERR',
      data:   e.response?.data   || e.message,
    };
  }

  console.log(`    Status   : ${webhookResponse.status}`);
  console.log(`    Response : ${JSON.stringify(webhookResponse.data)}`);

  // 5. Re-query DB to check if qty actually changed
  console.log('\n[4] Verifying DB qty after webhook...');
  const afterRecord = await getSkuRecord(TEST_SKU);
  const QTY_AFTER   = afterRecord?.quantity;

  console.log(`    DB qty BEFORE : ${QTY_BEFORE}`);
  console.log(`    DB qty AFTER  : ${QTY_AFTER}`);

  line();
  if (webhookResponse.status === 200 && QTY_AFTER === NEW_QTY) {
    console.log('✅ SUCCESS — Webhook hit the endpoint AND the DB qty updated correctly!');
  } else if (webhookResponse.status !== 200) {
    console.log(`❌ FAILED — Endpoint returned ${webhookResponse.status}`);
    if (webhookResponse.status === 404) {
      console.log('   → Server is not running, or route is not registered.');
      console.log('   → Make sure "node app.js" is running on port 5000.');
    }
  } else {
    console.log(`⚠️  Endpoint returned 200 but DB qty did NOT change (still ${QTY_AFTER})`);
    console.log('   → Check if SKU.save() is working correctly.');
  }
  line();

  // 6. Restore original qty so DB is clean
  console.log('\n[5] Restoring original qty in DB...');
  await SKU_MODEL.updateOne({ sku: TEST_SKU }, { quantity: RESTORE_QTY });
  const restored = await getSkuRecord(TEST_SKU);
  console.log(`    Restored qty : ${restored?.quantity} ✅`);

  await mongoose.disconnect();
  console.log('\n[6] DB disconnected. Done.\n');
}

main().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
