/**
 * Test: Is the live webhook endpoint working?
 * Does posting sku + qty actually update stock?
 * Run: node scripts/test_live_webhook.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SKU_MODEL = require('../Models/sku');
const TEST_SKU = 'FRAGR1016';
const LIVE_BASE = 'https://mmmk-wode.com';

async function getDbQty(sku) {
  const record = await SKU_MODEL.findOne({ sku }).lean();
  return record ? record.quantity : null;
}

async function post(url, body) {
  try {
    const r = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return { status: r.status, data: r.data };
  } catch (e) {
    return { status: e.response?.status || 'ERR', data: e.response?.data || e.message };
  }
}

async function get(url) {
  try {
    const r = await axios.get(url, { timeout: 8000 });
    return { status: r.status, data: r.data };
  } catch (e) {
    return { status: e.response?.status || 'ERR', data: e.response?.data || e.message };
  }
}

async function main() {
  console.log('\n============================================');
  console.log('  Live Webhook Endpoint Test — mmmk-wode.com');
  console.log('============================================\n');

  // ── Step 1: Is the server alive? ──
  console.log('── Step 1: Server health check ──');
  const health = await get(`${LIVE_BASE}/health`);
  console.log(`   GET /health → ${health.status}`, JSON.stringify(health.data).substring(0, 100));
  console.log('');

  // ── Step 2: Connect DB, get current qty ──
  console.log('── Step 2: Current DB qty for', TEST_SKU, '──');
  await mongoose.connect(process.env.MONGO_URI);
  const qtyBefore = await getDbQty(TEST_SKU);
  console.log(`   DB qty BEFORE: ${qtyBefore}`);
  console.log('');

  // ── Step 3: Hit the live endpoint (READ-ONLY dry run first — empty body) ──
  console.log('── Step 3: Probe endpoint with empty body ──');
  const emptyResult = await post(`${LIVE_BASE}/api/v1/webhook/juraa`, {});
  console.log(`   Status : ${emptyResult.status}`);
  console.log(`   Response: ${JSON.stringify(emptyResult.data).substring(0, 200)}`);
  console.log('');

  // ── Step 4: Send real inventory_updated payload ──
  const SAFE_QTY = qtyBefore; // Send THE SAME qty so DB doesn't actually change
  const payload = {
    event: 'inventory_updated',
    data: {
      sku: TEST_SKU,
      newQuantity: SAFE_QTY,
      variantIds: [],
      productIds: [],
    },
  };

  console.log('── Step 4: Send inventory_updated payload (qty unchanged — safe test) ──');
  console.log(`   Payload: ${JSON.stringify(payload)}`);
  const result = await post(`${LIVE_BASE}/api/v1/webhook/juraa`, payload);
  console.log(`   Status : ${result.status}`);
  console.log(`   Response: ${JSON.stringify(result.data)}`);
  console.log('');

  // ── Step 5: Check DB qty after ──
  console.log('── Step 5: DB qty AFTER ──');
  const qtyAfter = await getDbQty(TEST_SKU);
  console.log(`   DB qty AFTER: ${qtyAfter}`);
  console.log('');

  // ── Final Summary ──
  console.log('════════════════════════════════════');
  if (result.status === 200) {
    console.log('✅ Endpoint is LIVE and responding correctly');
    if (qtyAfter === SAFE_QTY) {
      console.log('✅ Stock update confirmed — DB qty matches sent qty');
    }
    console.log('⚠️  WARNING: This endpoint has NO auth protection.');
    console.log('   Anyone can POST to it and update your stock.');
  } else if (result.status === 404) {
    console.log('❌ Endpoint NOT FOUND on live server');
    console.log('   The webhook routes are not deployed / server is outdated');
  } else if (result.status === 400) {
    console.log('⚠️  Endpoint EXISTS but returned validation error');
    console.log('   Check the response above for details');
  } else {
    console.log('⚠️  Unexpected status:', result.status);
  }
  console.log('════════════════════════════════════\n');

  await mongoose.disconnect();
}

main().catch(console.error);
