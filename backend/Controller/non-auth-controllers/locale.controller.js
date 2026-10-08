const axios = require('axios');

const isPrivateIp = (ip) => {
  if (!ip) return true;
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') || // Simplification of 172.16.0.0/12
    ip.startsWith('fe80:')
  );
};

const detectLocale = async (req, res) => {
  try {
    let clientIp =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress;

    // Handle comma-separated IPs from proxy
    if (clientIp && clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }

    // Strip IPv6 prefix for IPv4-mapped addresses
    if (clientIp && clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    let country = null;
    let detectionIp = clientIp;

    // If it's a local/private IP, api.country.is will 404.
    // We try a server-side lookup as a fallback which is helpful for local dev.
    if (isPrivateIp(clientIp)) {
      console.info(`Locale detection: private IP ${clientIp}, using server-side fallback`);
      try {
        const fallbackResponse = await axios.get('https://api.country.is/');
        country = fallbackResponse.data?.country || null;
        detectionIp = fallbackResponse.data?.ip || clientIp;
      } catch (fallbackError) {
        console.warn('Server-side locale fallback failed:', fallbackError.message);
      }
    } else {
      const response = await axios.get(`https://api.country.is/${clientIp}`);
      country = response.data?.country || null;
      detectionIp = response.data?.ip || clientIp;
    }

    res.status(200).json({
      success: true,
      country: country,
      ip: detectionIp,
      note: isPrivateIp(clientIp) ? 'Local/Private IP detected (fallback used)' : undefined
    });
  } catch (error) {
    // Only log actual errors, not 404s for unmapped IPs if they slip through
    if (error.response?.status !== 404) {
      console.error('Backend locale detection failed:', error.message);
    }
    
    res.status(200).json({
      success: false,
      message: 'Failed to detect locale',
      country: null,
      ip: req.socket.remoteAddress
    });
  }
};

module.exports = { detectLocale };
