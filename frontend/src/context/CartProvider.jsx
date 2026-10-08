import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { createContext, useContext } from 'react';
import {
  addCartItem,
  getCartItems,
  setCartData,
  removeCartItems,
} from '../apis/user/cart';
import { isUserSignedIn } from '../utils/globalMethods';
import { message, notification } from 'antd';
import { getProductSkus, getSingleProduct } from '../apis/nonAuth/products';
import { CommonButton } from '../components/global/UIButtons';
import { IoCartOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { getPercentageOf } from '../utils/globalMethods';
import { BASE_CURRENCY, convertPrice } from '../utils/currency';

const cartContext = createContext({});
const APPLIED_COUPON_CODE_KEY = 'appliedCouponCode';
const APPLIED_COUPON_DATA_KEY = 'appliedCouponData';
const APPLIED_COUPON_FLAG_KEY = 'isCouponApplied';
const APPLIED_CREDIT_KEY = 'appliedGiftCardCredit';

const calculateCartSummary = ({
  items = [],
  couponData = {},
  isCouponApply = false,
  shippingCharges = 0,
  appliedCreditAmount = 0,
  isBagAdded = false,
  currency = BASE_CURRENCY,
  rates = {},
}) => {
  const subtotalBase = items.reduce((acc, item) => {
    const unitPrice = Number(
      getPercentageOf(item?.product?.price || 0, item?.product?.discount || 0)
    );
    return acc + unitPrice * Number(item?.quantity || 0);
  }, 0);
  const subtotal = convertPrice(subtotalBase, currency, rates);

  let productCouponDiscount = 0;
  let deliveryCouponDiscount = 0;
  if (isCouponApply && couponData) {
    // 1. Product Discount
    if (couponData.applyToProducts !== false) {
      if (!couponData.scope || couponData.scope === 'All') {
        if (couponData.discountType === 'amount') {
          const discountAmountConverted = convertPrice(couponData.discount || 0, currency, rates);
          productCouponDiscount += Math.min(discountAmountConverted, subtotal);
        } else {
          productCouponDiscount += (subtotal * Number(couponData.discount || 0)) / 100;
        }
      } else {
        let eligibleAmountBase = 0;
        items.forEach((item) => {
          let isEligible = false;
          if (couponData.scope === 'Category') {
            const itemCatId =
              item.product?.category?._id || item.product?.category;
            const targetCatId =
              couponData.scopeCategory?._id || couponData.scopeCategory;
            if (String(itemCatId) === String(targetCatId)) {
              isEligible = true;
            }
          } else if (couponData.scope === 'Product') {
            const itemProductId = item.product?._id || item.product;
            const targetProductId =
              couponData.scopeProduct?._id || couponData.scopeProduct;
            if (String(itemProductId) === String(targetProductId)) {
              isEligible = true;
            }
          }

          if (isEligible) {
            const unitPriceBase = Number(
              getPercentageOf(
                item?.product?.price || 0,
                item?.product?.discount || 0,
              ),
            );
            eligibleAmountBase += unitPriceBase * Number(item?.quantity || 0);
          }
        });

        const eligibleAmountConverted = convertPrice(eligibleAmountBase, currency, rates);
        if (couponData.discountType === 'amount') {
          const discountAmountConverted = convertPrice(couponData.discount || 0, currency, rates);
          productCouponDiscount += Math.min(discountAmountConverted, eligibleAmountConverted);
        } else {
          productCouponDiscount += (eligibleAmountConverted * Number(couponData.discount || 0)) / 100;
        }
      }
    }

    // 2. Delivery Discount
    if (couponData.applyToDelivery) {
      const shippingConverted = convertPrice(shippingCharges || 0, currency, rates);
      if (couponData.deliveryDiscountType === 'amount') {
        const deliveryDiscountAmountConverted = convertPrice(couponData.deliveryDiscount || 0, currency, rates);
        deliveryCouponDiscount = Math.min(deliveryDiscountAmountConverted, shippingConverted);
      } else {
        deliveryCouponDiscount = (shippingConverted * Number(couponData.deliveryDiscount || 0)) / 100;
      }
    }
  }

  const shipping = convertPrice(shippingCharges || 0, currency, rates);
  const bagFee = convertPrice(isBagAdded ? 1.79 : 0, currency, rates);
  const convertedCredit = convertPrice(appliedCreditAmount || 0, currency, rates);
  const totalBeforeCredits = subtotal - productCouponDiscount - deliveryCouponDiscount + shipping + bagFee;
  const creditApplied = Math.min(
    Number(convertedCredit || 0),
    Math.max(Number(totalBeforeCredits.toFixed(2)), 0)
  );
  const total = totalBeforeCredits - creditApplied;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    couponDiscount: Number(productCouponDiscount.toFixed(2)), // Keep for backward compatibility/products
    deliveryCouponDiscount: Number(deliveryCouponDiscount.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    bagFee: Number(bagFee.toFixed(2)),
    creditApplied: Number(creditApplied.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};

const CartProvider = ({ children }) => {
  const [couponCode, setCouponCode] = useState(
    localStorage.getItem(APPLIED_COUPON_CODE_KEY) || ''
  );
  const [isCouponApply, setIsCouponApply] = useState(
    localStorage.getItem(APPLIED_COUPON_FLAG_KEY) === 'true'
  );
  const [couponData, setCouponData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(APPLIED_COUPON_DATA_KEY)) || {};
    } catch {
      return {};
    }
  });
  const [checkoutSummary, setCheckoutSummary] = useState({
    subtotal: 0,
    couponDiscount: 0,
    shipping: 0,
    bagFee: 0,
    creditApplied: 0,
    total: 0,
  });
  const [appliedCreditAmount, setAppliedCreditAmount] = useState(() =>
    Number(localStorage.getItem(APPLIED_CREDIT_KEY) || 0)
  );
  const [isBagAdded, setIsBagAdded] = useState(() => 
    localStorage.getItem('isBagAdded') === 'true'
  );
  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () => getCartItems(),
    enabled: isUserSignedIn(),
    retry: false,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    
    if (isUserSignedIn()) {
      if (query.data) {
        
        setCartItems({ items: query.data.data || [] });
      }
    } else {
      
      setCart(JSON.parse(localStorage.getItem('cartItems')) || []);
    }
  }, [query.data, query.isLoading]);

  useEffect(() => {
    if (query.error && isUserSignedIn()) {
      setCart(JSON.parse(localStorage.getItem('cartItems')) || []);
    }
  }, [query.error]);

  useEffect(() => {
    if (couponCode) localStorage.setItem(APPLIED_COUPON_CODE_KEY, couponCode);
    else localStorage.removeItem(APPLIED_COUPON_CODE_KEY);
  }, [couponCode]);

  useEffect(() => {
    localStorage.setItem(APPLIED_COUPON_FLAG_KEY, String(Boolean(isCouponApply)));
  }, [isCouponApply]);

  useEffect(() => {
    localStorage.setItem('isBagAdded', String(Boolean(isBagAdded)));
  }, [isBagAdded]);

  useEffect(() => {
    if (couponData && Object.keys(couponData).length > 0) {
      localStorage.setItem(APPLIED_COUPON_DATA_KEY, JSON.stringify(couponData));
      return;
    }
    localStorage.removeItem(APPLIED_COUPON_DATA_KEY);
  }, [couponData]);

  useEffect(() => {
    const normalizedCredit = Number(appliedCreditAmount || 0);
    if (normalizedCredit > 0) {
      localStorage.setItem(APPLIED_CREDIT_KEY, String(normalizedCredit));
      return;
    }
    localStorage.removeItem(APPLIED_CREDIT_KEY);
  }, [appliedCreditAmount]);

  const [cart, setCart] = useState([]);

  const showNotfication = ({ type, productName, quantity }) =>
    notification.open({
      message:
        type === 'add'
          ? `${productName ? `Product "${productName}"` : 'Item'}${
              quantity > 0 ? ` (${quantity})` : ''
            } Added to Cart`
          : `${productName || 'Item'} Removed from Cart`,
      btn: (
        <CommonButton
          variant="primary1"
          size="xs"
          onClick={() => {
            notification.destroy();
            navigate('/shopping-cart');
          }}
        >
          View Cart
        </CommonButton>
      ),
      icon: <IoCartOutline style={{ color: '#108ee9' }} />,
    });

  const setCartItems = ({ items, updateOnBackend = false, successMessage }) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
    setCart(items);
    queryClient.setQueryData(['cart'], { data: items });
    if (updateOnBackend && isUserSignedIn()) {
      setCartData({
        items: items.map((item) => ({
          product: item.product._id,
          sku: item.sku,
          filters: item.filters || {},
          quantity: item.quantity,
        })),
      }).catch(() => {
        // Keep the local cart usable when the backend cart API is unavailable.
      });
    }
    if (successMessage) message.success(successMessage);
  };

  const mergeCart = async () => {
    try {
      const localCart = JSON.parse(localStorage.getItem('cartItems')) || [];
      const res = await getCartItems();
      const backendCartItems = res?.data || [];
      const mergedCart = [...localCart, ...backendCartItems].reduce(
        (acc, item) => {
          const existingItemIndex = acc.findIndex(
            (i) => i.product._id === item.product._id && i.sku === item.sku
          );
          if (existingItemIndex > -1) {
            acc[existingItemIndex].quantity += item.quantity;
            acc[existingItemIndex]._id = item._id;
          } else {
            acc.push(item);
          }
          return acc;
        },
        []
      );
      setCartItems({ items: mergedCart, updateOnBackend: true });
    } catch (error) {
      setCart(JSON.parse(localStorage.getItem('cartItems')) || []);
    }
  };

  const addToCart = async ({
    product,
    sku,
    filters,
    quantity = 1,
    showMessage = true,
  }) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existingItemIndex = cartItems.findIndex(
      (item) => item.product._id === product._id && item.sku === sku
    );

    const updatedItems = [...cartItems];
    if (existingItemIndex > -1) {
      updatedItems[existingItemIndex].quantity += quantity;
    } else {
      updatedItems.push({ product, sku, filters, quantity });
    }

    // Update UI and Storage immediately (Optimistic)
    setCartItems({ items: updatedItems });

    if (isUserSignedIn()) {
      addCartItem({
        product: product._id,
        sku,
        filters,
        quantity,
      }).catch((err) => {
        console.error('Failed to sync cart to backend:', err);
        // Fallback: Re-sync from localStorage if needed or just keep local state
      });
    }

    if (showMessage)
      showNotfication({
        type: 'add',
        productName: product.productName?.en,
        sku,
        filters,
        quantity,
      });
  };

  const removeFromCart = async ({
    productId,
    sku,
    quantity = 0,
    showMessage = true,
  }) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    const foundIndex = cartItems.findIndex(
      (item) => item.product._id === productId && item.sku === sku
    );

    if (foundIndex === -1) return;
    
    const updatedItems = [...cartItems];
    if (quantity > 0) {
      updatedItems[foundIndex].quantity -= quantity;
      if (updatedItems[foundIndex].quantity <= 0) {
        updatedItems.splice(foundIndex, 1);
      }
    } else {
      updatedItems.splice(foundIndex, 1);
    }

    // Update UI and Storage immediately (Optimistic)
    setCartItems({ items: updatedItems });

    if (isUserSignedIn()) {
      removeCartItems(productId, sku, quantity).catch((err) => {
         console.error('Failed to sync cart removal to backend:', err);
      });
    }

    if (showMessage) showNotfication({ type: 'remove' });
  };

  const clearCart = ({ updateOnBackend = false } = {}) => {
    localStorage.removeItem('cartItems');
    queryClient.setQueryData(['cart'], { data: [] });
    setCart([]);
    setCouponCode('');
    setCouponData({});
    setIsCouponApply(false);
    localStorage.removeItem(APPLIED_COUPON_CODE_KEY);
    localStorage.removeItem(APPLIED_COUPON_DATA_KEY);
    localStorage.removeItem(APPLIED_COUPON_FLAG_KEY);
    setCheckoutSummary({
      subtotal: 0,
      couponDiscount: 0,
      shipping: 0,
      bagFee: 0,
      creditApplied: 0,
      total: 0,
    });
    setAppliedCreditAmount(0);
    localStorage.removeItem(APPLIED_CREDIT_KEY);
    setIsBagAdded(false);
    localStorage.removeItem('isBagAdded');
    sessionStorage.removeItem('checkoutGuestEmail');
    sessionStorage.removeItem('checkoutVerificationToken');

    if (updateOnBackend && isUserSignedIn()) {
      setCartData({ items: [] })
        .catch((err) => {
          console.error('Failed to clear backend cart:', err);
        })
        .finally(() => {
          queryClient.invalidateQueries({ queryKey: ['cart'] });
        });
    }
  };

  const addProductToCart = async ({
    productId,
    sku,
    quantity = 1,
    showMessage,
    productData = null, // Optional: pass data to avoid API call
  }) => {
    let finalProduct = productData;
    let selectedSku = null;

    if (!finalProduct) {
      const res = await getSingleProduct(productId);
      finalProduct = res?.data;
      if (!finalProduct) {
        message.error('Product not found');
        return false;
      }
    }

    // Resolve SKU details
    if (!Array.isArray(finalProduct?.filters) || finalProduct.filters.length === 0) {
      // Product has no variants — use empty string, NOT the productId, as the sku value.
      // Passing an _id as sku causes the backend to fail with "SKU not found".
      selectedSku = { sku: sku || '', quantity: finalProduct.quantity, filters: {} };
    } else {
      const skus = await getProductSkus(productId);
      selectedSku = skus.find((s) => s.sku === sku);
    }

    if (!selectedSku) {
      message.error('Selected SKU not found for this product.');
      return false;
    }

    const requestedQuantity = Number(quantity || 0);
    if (requestedQuantity <= 0) {
      message.warning('Invalid quantity requested.');
      return false;
    }

    const currentCartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const currentQuantityInCart = currentCartItems.reduce((total, item) => {
      if (item?.product?._id === productId && item?.sku === sku) {
        return total + Number(item?.quantity || 0);
      }
      return total;
    }, 0);

    const availableQuantity = Number(selectedSku?.quantity || 0);
    const remainingQuantity = availableQuantity - currentQuantityInCart;

    if (remainingQuantity <= 0) {
      message.warning('Sold out for selected option.');
      return false;
    }

    if (requestedQuantity > remainingQuantity) {
      message.warning(
        `Only ${remainingQuantity} item(s) available for selected option`
      );
      return false;
    }

    await addToCart({
      product: finalProduct,
      sku: selectedSku.sku,
      filters: selectedSku.filters,
      quantity: requestedQuantity,
      showMessage,
    });
    return true;
  };

  return (
    <cartContext.Provider
      value={{
        couponCode,
        couponData,
        setCouponData,
        setCouponCode,
        data: cart,
        refetch: query.refetch,
        isCouponApply,
        setIsCouponApply,
        addToCart,
        removeFromCart,
        clearCart,
        mergeCart,
        addProductToCart,
        calculateCartSummary,
        checkoutSummary,
        setCheckoutSummary,
        appliedCreditAmount,
        setAppliedCreditAmount,
        isBagAdded,
        setIsBagAdded,
      }}
    >
      {children}
    </cartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(cartContext);
};

export default CartProvider;
