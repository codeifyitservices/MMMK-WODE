const {
  buildJuraPayload,
  extractJuraOrderId,
  getJuraCreateUrl,
  sendOrderToJura,
} = require("./juraDelivery");

const buildDepoterPayload = (order) => buildJuraPayload(order);
const extractDepoterOrderId = (payload) => extractJuraOrderId(payload);
const getDepoterCreateUrl = () => getJuraCreateUrl();
const sendOrderToDepoter = (order) => sendOrderToJura(order);

module.exports = {
  buildDepoterPayload,
  extractDepoterOrderId,
  getDepoterCreateUrl,
  sendOrderToDepoter,
};
