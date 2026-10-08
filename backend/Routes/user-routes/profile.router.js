const router = require("express").Router();
const {
  updateMyAccount,
  getMyAccount,
  getAddressBook,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getUserCredits,
  getCreditTransactions,
  addPaymentCard,
  getPaymentCard,
  deletePaymentCard,
} = require("../../Controller/user-controllers/profile.controller");

// My accounts
router.post("/my-accounts/update", updateMyAccount);
router.get("/my-accounts/get", getMyAccount);

// Credits
router.get("/my-credits/get", getUserCredits);
router.get("/my-credits/transactions", getCreditTransactions);

// Address book
router.get("/address-book/get", getAddressBook);
router.post("/address-book/:type/add", addAddress);
router.put("/address-book/:type/update/:id", updateAddress);
router.delete("/address-book/:type/delete/:id", deleteAddress);
router.put("/address-book/:type/default/:id", setDefaultAddress);

// Payment methods
router.post("/payment-methods/update", addPaymentCard);
router.get("/payment-methods/get", getPaymentCard);
router.get("/payment-methods/delete/:id", deletePaymentCard);

module.exports = router;