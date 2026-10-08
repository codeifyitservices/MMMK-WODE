const fs = require('fs');

const cartPath = "c:\\Users\\umang\\Desktop\\Codenap-Docs\\MMMK\\MMK_frontend(13-03)\\src\\pages\\ShoppingCart.jsx";
let cartContent = fs.readFileSync(cartPath, 'utf8');

// 1. Add isBagAdded to useCart destructing
cartContent = cartContent.replace(
  "setAppliedCreditAmount,\n  } = useCart();",
  "setAppliedCreditAmount,\n    isBagAdded,\n    setIsBagAdded,\n  } = useCart();"
);

// 2. Add isBagAdded to calculateCartSummary
cartContent = cartContent.replace(
  "isCouponApply,\n    appliedCreditAmount,\n    currency,\n    rates,\n  });",
  "isCouponApply,\n    appliedCreditAmount,\n    isBagAdded,\n    currency,\n    rates,\n  });"
);

cartContent = cartContent.replace(
  "isCouponApply,\n      appliedCreditAmount,\n      currency,\n      rates,\n    });",
  "isCouponApply,\n      appliedCreditAmount,\n      isBagAdded,\n      currency,\n      rates,\n    });"
);

cartContent = cartContent.replace(
  "isCouponApply,\n      appliedCreditAmount: 0,\n    });",
  "isCouponApply,\n      isBagAdded,\n      appliedCreditAmount: 0,\n    });"
);

// 3. Add the UI for bag
const bagUI = `                  );
                })}

                {/* Add Bag Option */}
                <div className="w-full py-6 px-6 md:px-10 mb-10 bg-white shadow-lg rounded-lg flex items-center justify-between border-t mt-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src="/mmmk-bag.jpg" 
                      alt="MMMK Bag" 
                      className="w-16 h-16 object-cover rounded shadow border"
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

// 4. Add the Bag Fee to the right-side payment breakdown
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
console.log('ShoppingCart.jsx updated correctly');
