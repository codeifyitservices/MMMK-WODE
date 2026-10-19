const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/newsletter/subscribe', {
      email: 'jatin@test.com',
      source: 'popup'
    });
    console.log('SUCCESS Response:', res.status, res.data);
  } catch (error) {
    if (error.response) {
      console.log('RESPONSE ERROR:', error.response.status, error.response.data);
    } else {
      console.log('NETWORK/OTHER ERROR:', error.code, error.message);
    }
  }
}

test();
