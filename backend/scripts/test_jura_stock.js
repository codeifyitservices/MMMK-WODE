/**
 * Test script: Check if Jura can return stock/quantity for a given SKU
 * Run: node scripts/test_jura_stock.js
 */

const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SKU = require('../Models/sku');

const JURA_BASE = (process.env.JURA_URL || 'https://juraa.co/api/rest/v1').replace(/\/$/, '');
const API_KEY  = process.env.JURA_API_KEY;

const HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

// Endpoints Jura might expose for fetching stock by SKU
const CANDIDATE_ENDPOINTS = (sku) => [
  { method: 'GET',  url: `${JURA_BASE}/product/stock?sku=${sku}` },
  { method: 'GET',  url: `${JURA_BASE}/product/${sku}/stock` },
  { method: 'GET',  url: `${JURA_BASE}/product/sku/${sku}` },
  { method: 'GET',  url: `${JURA_BASE}/inventory?sku=${sku}` },
  { method: 'GET',  url: `${JURA_BASE}/inventory/${sku}` },
  { method: 'POST', url: `${JURA_BASE}/product/stock`, body: { sku } },
  { method: 'POST', url: `${JURA_BASE}/inventory/query`, body: { sku } },
];

async function callJura({ method, url, body }) {
  try {
    const config = { headers: HEADERS, timeout: 8000 };
    const res = method === 'POST'
      ? await axios.post(url, body, config)
      : await axios.get(url, config);
    return { status: res.status, data: res.data };
  } catch (err) {
    return {
      status: err.response?.status || 'ERR',
      data:   err.response?.data  || err.message,
    };
  }
}

async function main() {
  console.log('\n==============================');
  console.log('  Jura SKU Stock Fetch Test');
  console.log('==============================\n');

  // --- Step 1: Pull a real SKU from your DB ---
  let testSku = 'PRODUCTSKU123'; // fallback
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const first = await SKU.findOne({}).lean();
    if (first?.sku) {
      testSku = first.sku;
      console.log(`✅ Using real SKU from DB : ${testSku}`);
      console.log(`   DB quantity for this SKU: ${first.quantity}`);
    } else {
      console.log(`⚠️  No SKUs in DB — using dummy SKU: ${testSku}`);
    }
    await mongoose.disconnect();
  } catch (e) {
    console.log(`⚠️  DB connection failed (${e.message}) — using dummy SKU: ${testSku}`);
  }

  console.log(`\n🔑 Jura base URL : ${JURA_BASE}`);
  console.log(`🔑 API key (first 12): ${API_KEY?.substring(0, 12)}...`);
  console.log('\n--- Probing Jura endpoints ---\n');

  // --- Step 2: Hit each candidate endpoint ---
  let found = false;
  for (const ep of CANDIDATE_ENDPOINTS(testSku)) {
    const result = await callJura(ep);
    const icon = result.status === 200 ? '✅' : result.status === 404 ? '❌' : '⚠️ ';
    console.log(`${icon} [${ep.method}] ${ep.url}`);
    console.log(`   Status : ${result.status}`);
    console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`);

    if (result.status === 200) {
      found = true;
      console.log('\n🎉 SUCCESS — Jura returned data for this endpoint!');
      console.log('Full response:', JSON.stringify(result.data, null, 2));
    }
    console.log('');
  }

  if (!found) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ RESULT: No endpoint returned a 200 for SKU stock.');
    console.log('   → Jura likely does NOT expose a stock-fetch API.');
    console.log('   → Your system must rely solely on Jura webhooks.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

main().catch(console.error);
