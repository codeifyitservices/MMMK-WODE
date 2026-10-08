const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'jura.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Appends a log message to the jura.log file with a timestamp.
 * @param {string} level - 'INFO' or 'ERROR'
 * @param {string} message - The message to log
 * @param {any} data - Optional additional data to log
 */
const logToJuraFile = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logMessage += ` | Data: ${JSON.stringify(data)}`;
    } else {
      logMessage += ` | Data: ${data}`;
    }
  }
  
  logMessage += '\n';

  // Console output for real-time visibility
  if (level === 'ERROR') {
    console.error(logMessage.trim());
  } else {
    console.log(logMessage.trim());
  }

  // File output for persistence
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

module.exports = {
  info: (message, data) => logToJuraFile('INFO', message, data),
  error: (message, data) => logToJuraFile('ERROR', message, data),
};
