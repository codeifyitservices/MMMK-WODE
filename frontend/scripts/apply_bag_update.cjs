const fs = require('fs');

// --- Update CartProvider.jsx ---
const providerPath = "c:\\Users\\umang\\Desktop\\Codenap-Docs\\MMMK\\MMK_frontend(13-03)\\src\\context\\CartProvider.jsx";
let providerContent = fs.readFileSync(providerPath, 'utf8');

// 1. Add isBagAdded to calculateCartSummary params
providerContent = providerContent.replace(
  "  appliedCreditAmount = 0,\n  currency = BASE_CURRENCY,\n  rates = {},\n}) => {",
  "  appliedCreditAmount = 0,\n  isBagAdded = false,\n  currency = BASE_CURRENCY,\n  rates = {},\n}) => {"
);

// 2. Add bagFee calculation
providerContent = providerContent.replace(
  "  const shipping = convertPrice(shippingCharges || 0, currency, rates);\n  const convertedCredit = convertPrice(appliedCreditAmount || 0, currency, rates);\n  const totalBeforeCredits = subtotal - couponDiscount + shipping;\n",
  "  const shipping = convertPrice(shippingCharges || 0, currency, rates);\n  const bagFee = convertPrice(isBagAdded ? 1.79 : 0, currency, rates);\n  const convertedCredit = convertPrice(appliedCreditAmount || 0, currency, rates);\n  const totalBeforeCredits = subtotal - couponDiscount + shipping + bagFee;\n"
);

// 3. Add bagFee to returned object
providerContent = providerContent.replace(
  "    shipping: Number(shipping.toFixed(2)),\n    creditApplied: Number(creditApplied.toFixed(2)),",
  "    shipping: Number(shipping.toFixed(2)),\n    bagFee: Number(bagFee.toFixed(2)),\n    creditApplied: Number(creditApplied.toFixed(2)),"
);

// 4. Add isBagAdded state and include in checkoutSummary
providerContent = providerContent.replace(
  "    shipping: 0,\n    creditApplied: 0,\n    total: 0,\n  });\n  const [appliedCreditAmount, setAppliedCreditAmount] = useState(() =>\n    Number(localStorage.getItem(APPLIED_CREDIT_KEY) || 0)\n  );",
  "    shipping: 0,\n    bagFee: 0,\n    creditApplied: 0,\n    total: 0,\n  });\n  const [appliedCreditAmount, setAppliedCreditAmount] = useState(() =>\n    Number(localStorage.getItem(APPLIED_CREDIT_KEY) || 0)\n  );\n  const [isBagAdded, setIsBagAdded] = useState(localStorage.getItem('isBagAdded') === 'true');"
);

// 5. Sync isBagAdded to localStorage
providerContent = providerContent.replace(
  "  useEffect(() => {\n    localStorage.setItem(APPLIED_COUPON_FLAG_KEY, String(Boolean(isCouponApply)));\n  }, [isCouponApply]);",
  "  useEffect(() => {\n    localStorage.setItem(APPLIED_COUPON_FLAG_KEY, String(Boolean(isCouponApply)));\n  }, [isCouponApply]);\n\n  useEffect(() => {\n    localStorage.setItem('isBagAdded', String(Boolean(isBagAdded)));\n  }, [isBagAdded]);"
);

// 6. Include isBagAdded in summaryWithoutShipping calculation
providerContent = providerContent.replace(
  "      couponData,\n      isCouponApply,\n      appliedCreditAmount,\n    });",
  "      couponData,\n      isCouponApply,\n      isBagAdded,\n      appliedCreditAmount,\n    });"
);

providerContent = providerContent.replace(
  "  }, [cart, couponData, isCouponApply, appliedCreditAmount]);",
  "  }, [cart, couponData, isCouponApply, isBagAdded, appliedCreditAmount]);"
);

// 7. Reset isBagAdded in clearCart
providerContent = providerContent.replace(
  "    setAppliedCreditAmount(0);\n    localStorage.removeItem(APPLIED_CREDIT_KEY);",
  "    setAppliedCreditAmount(0);\n    localStorage.removeItem(APPLIED_CREDIT_KEY);\n    setIsBagAdded(false);\n    setCheckoutSummary(prev => ({...prev, bagFee: 0}));"
);

// 8. Add isBagAdded, setIsBagAdded to provider value
providerContent = providerContent.replace(
  "        checkoutSummary,\n        setCheckoutSummary,\n        appliedCreditAmount,\n        setAppliedCreditAmount,\n      }}",
  "        checkoutSummary,\n        setCheckoutSummary,\n        appliedCreditAmount,\n        setAppliedCreditAmount,\n        isBagAdded,\n        setIsBagAdded,\n      }}"
);

fs.writeFileSync(providerPath, providerContent);
console.log('CartProvider.jsx updated');


// --- Update ShoppingCart.jsx ---
const cartPath = "c:\\Users\\umang\\Desktop\\Codenap-Docs\\MMMK\\MMK_frontend(13-03)\\src\\pages\\ShoppingCart.jsx";
let cartContent = fs.readFileSync(cartPath, 'utf8');

cartContent = cartContent.replace(
  "    setAppliedCreditAmount,\n  } = useCart();",
  "    setAppliedCreditAmount,\n    isBagAdded,\n    setIsBagAdded,\n  } = useCart();"
);

cartContent = cartContent.replace(
  "    isCouponApply,\n    appliedCreditAmount,\n    currency,\n    rates,\n  });",
  "    isCouponApply,\n    appliedCreditAmount,\n    isBagAdded,\n    currency,\n    rates,\n  });"
);

cartContent = cartContent.replace(
  "      isCouponApply,\n      appliedCreditAmount,\n      currency,\n      rates,\n    });",
  "      isCouponApply,\n      appliedCreditAmount,\n      isBagAdded,\n      currency,\n      rates,\n    });"
);

cartContent = cartContent.replace(
  "      isCouponApply,\n      appliedCreditAmount: 0,\n    });",
  "      isCouponApply,\n      isBagAdded,\n      appliedCreditAmount: 0,\n    });"
);

const bagUI = `                  );
                })}

                {/* Add Bag Option */}
                <div className="w-full py-6 px-6 md:px-10 mb-10 bg-white shadow-lg rounded-lg flex items-center justify-between border border-gray-200 mt-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/mmmk-bag.jpg" 
                      alt="MMMK Bag" 
                      className="w-16 h-16 object-cover rounded shadow border"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">Add a Bag</h3>
                      <p className="text-sm text-gray-500">Includes an exclusive MMMK bag with your order.</p>
                      <p className="font-semibold">{formatConvertedPrice(1.79)}</p>
                    </div>
                  </div>
                  <div>
                    <CommonButton 
                      variant={isBagAdded ? 'danger1' : 'primary1'} 
                      onClick={() => setIsBagAdded(!isBagAdded)}
                      size="sm"
                    >
                      {isBagAdded ? 'Remove Bag' : 'Add Bag'}
                    </CommonButton>
                  </div>
                </div>

              </div>`;

cartContent = cartContent.replace(
  "                  );\n                })}\n              </div>",
  bagUI
);

const bagFeeUI = `                  <div className="flex items-center justify-between my-5 ">
                    <p>{common.subTotal}</p>
                    <p>{formatPrice(cartSummary.subtotal, currency)}</p>
                  </div>

                  {cartSummary.bagFee > 0 && (
                    <div className="flex items-center justify-between my-5 text-gray-600">
                      <p>Bag Fee</p>
                      <p>+ {formatPrice(cartSummary.bagFee, currency)}</p>
                    </div>
                  )}`;

cartContent = cartContent.replace(
  "                  <div className=\"flex items-center justify-between my-5 \">\n                    <p>{common.subTotal}</p>\n                    <p>{formatPrice(cartSummary.subtotal, currency)}</p>\n                  </div>",
  bagFeeUI
);

fs.writeFileSync(cartPath, cartContent);
console.log('ShoppingCart.jsx updated');
