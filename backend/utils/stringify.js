module.exports.destringify = (value, defaultValue = {}) => {
  if (!value || value === 'undefined' || value === 'null') return defaultValue;
  return typeof value === "string" ? JSON.parse(value) : value;
};
