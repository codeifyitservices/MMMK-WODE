const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function test() {
  try {
    const orderId = 'OD1328840042113E';
    const baseUrl = process.env.JURA_URL.replace(/\/$/, '') + '/delivery/track/';
    
    await axios.get(baseUrl + orderId, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.JURA_API_KEY,
        'Key': process.env.JURA_API_KEY
      }
    });
  } catch (err) {
    // Error handled silently
  } finally {
    process.exit(0);
  }
}
test();
