import { generateUniqueOrderId } from "../utils/globalMethods";

export const formatCheckoutData = async (data, userId) => {
  const orderId = generateUniqueOrderId();


  const billingAddress = user.addresses.find((address) => address.default);


  const {
    products,
    quantity,
    total,
    deliveryCharge,
    discount,
    totalWeight,
    grandTotal,
    shippingAddress,
  } = data;

  const line_items = products.map((prod) => ({
    sku_id: prod.sku_id,
    quantity: prod.quantity,
    price: prod.price.en,
  }));

  const price = {
    payment_mode: "online", //"COD", "online"
    currency_code: "AED", //"AED", "USD", "INR"
    delivery_type: "International", //"International"/ "next day delivery"
    shipping_charges: deliveryCharge,
    // COD: Number,
    // tax: Number,
    // extra_charges: Number,
    // discount: Number,
  };

  const shipping = {
    first_name: shippingAddress.first_name,
    last_name: shippingAddress.last_name,
    address: `${shippingAddress.addressLine1}, ${
      shippingAddress?.addressLine2 ? shippingAddress.addressLine2 : ""
    }`,
    country: shippingAddress.country,
    postcode: shippingAddress.postcode,
    state: shippingAddress.state,
    city: shippingAddress.city,
    landmark: shippingAddress?.addressLine2 || "",
    email: shippingAddress.email,
    phone: shippingAddress.phone,
  };

  const billing = {
    first_name: billingAddress.first_name,
    last_name: billingAddress.last_name,
    address: `${billingAddress.addressLine1}, ${
      billingAddress?.addressLine2 ? billingAddress.addressLine2 : ""
    }`,
    country: billingAddress.country,
    postcode: billingAddress.postcode,
    state: billingAddress.state,
    city: billingAddress.city,
    landmark: billingAddress?.addressLine2 || "",
    email: billingAddress.email,
    phone: billingAddress.phone,
  };


  const formattedOrder = {
    user: userId,
    order_id: orderId,
    billing: billing,
    shipping: shipping,
    price: price,
    line_items: line_items,
    total,
    discount,
    grandTotal,
  };

  return formattedOrder;
};
