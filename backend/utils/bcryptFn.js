const bcrypt = require("bcryptjs");

module.exports.hashPass = (str) => {
  return bcrypt.hash(str, 5);
};

module.exports.compareHash = (str, hash) => {
  return bcrypt.compare(str, hash);
};
