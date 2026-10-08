const jwt = require("jsonwebtoken");

module.exports.generateToken = (id) => {
  const token = jwt.sign({ data: id }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  return token;
};

module.exports.authToken = (id) => {
  return new Promise((res, rej) => {
    jwt.verify(id, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        rej(err);
      } else {
        res(decoded);
      }
    });
  });
};
