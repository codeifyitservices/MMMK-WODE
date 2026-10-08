const mongoose = require("mongoose");
// mongodb+srv://saprakaran001:<password>@cluster0.rnw4v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const connectDb = () => {
  try {
    mongoose
      .connect(process.env.MONGODB_URL)
      .then(() => {
        console.log("Mongodb Connected");
      })
      .catch((err) => {
      });
  } catch (err) {
  }
};

module.exports = connectDb;
