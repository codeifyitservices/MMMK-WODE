import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef, useMemo } from 'react';
import {
  getAddressBook,
  getMyAccount,
  getUserCredits,
} from '../../apis/user/profile';
import { Country, State } from 'country-state-city';
import { createPaymentIntent, createTabbySession, getDeliveryFee, confirmApplePayPayment } from '../../apis/user/payment';
import { message } from 'antd';
import { useCart } from '../../context/CartProvider';
import PaymentModal from './PaymentModal';
import { createManualOrder } from '../../apis/user/order';
import {
  clearCheckoutVerificationToken,
  createVerifiedGuestOrder,
  createVerifiedGuestPaymentIntent,
  sendCheckoutOtp,
  setCheckoutVerificationToken,
  verifyCheckoutOtp,
  getVerifiedCheckoutAddresses,
} from '../../apis/user/checkoutVerification';
import { applyCoupon, getValidTokens } from '../../apis/user/coupon';
import { Modal } from 'antd';
import { LuX } from 'react-icons/lu';
import { useNavigate, Link } from 'react-router-dom';
import countriesList from '../../countries.json';
import rateByWeight from '../../rateByWeight.json';
import { useTranslationContext } from '../../context/TranslationContext';
import { CommonButton } from '../global/UIButtons';
import { loadStripe } from '@stripe/stripe-js';
import { getPercentageOf, isUserSignedIn } from '../../utils/globalMethods';
import {
  BASE_CURRENCY,
  convertPrice,
  convertStoredPrice,
  formatPrice,
} from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { Tag } from 'lucide-react';

// ─── Unchanged business logic ─────────────────────────────────────────────────

const calculateShippingCharges = (countryCode, weight) => {
  if (!countryCode) return 0;
  const countryData = Country.getCountryByCode(countryCode);
  if (!countryData?.name) return 0;
  const roundedWeight = Math.max(0.5, Math.ceil(Number(weight || 0) * 2) / 2);
  let zone = countriesList?.countries[countryData.name];
  if (!zone) {
    const entry = Object.entries(countriesList?.countries || {}).find(
      ([name]) =>
        countryData.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(countryData.name.toLowerCase())
    );
    if (entry) zone = entry[1];
  }
  const rate = zone ? rateByWeight[String(roundedWeight)]?.[zone] : 0;
  return parseFloat(rate) || 0;
};

const EMPTY_FORM = {
  contactEmail: '',
  contactPhone: '',
  shipping_firstName: '',
  shipping_lastName: '',
  shipping_streetAddress: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postalCode: '',
  shipping_country: '',
  shipping_company: '',
  shipping_phoneNumber: '',
  shipping_landmark: '',
  billing_firstName: '',
  billing_lastName: '',
  billing_streetAddress: '',
  billing_city: '',
  billing_state: '',
  billing_postalCode: '',
  billing_country: '',
  billing_company: '',
  billing_phoneNumber: '',
  billing_landmark: '',
};

const OTP_RESEND_SECONDS = 60;

const addressToShippingFields = (addr, prefix) => ({
  [`${prefix}_firstName`]: addr?.firstName || '',
  [`${prefix}_lastName`]: addr?.lastName || '',
  [`${prefix}_streetAddress`]:
    addr?.street_address || addr?.streetAddress || '',
  [`${prefix}_city`]: addr?.city || '',
  [`${prefix}_state`]: addr?.state || '',
  [`${prefix}_postalCode`]: addr?.postalCode || '',
  [`${prefix}_country`]: addr?.country || '',
  [`${prefix}_company`]: addr?.company || '',
  [`${prefix}_phoneNumber`]: addr?.phone_number || addr?.phoneNumber || '',
  [`${prefix}_landmark`]: addr?.landmark || '',
});

const formatShippingBillingAddress = (data) => ({
  shippingAddress: {
    firstName: data.shipping_firstName,
    lastName: data.shipping_lastName,
    streetAddress: data.shipping_streetAddress,
    country: data.shipping_country,
    state: data.shipping_state,
    postalCode: data.shipping_postalCode,
    city: data.shipping_city,
    company: data.shipping_company,
    phoneNumber: data.contactPhone,
    landmark: data.shipping_landmark,
  },
  billingAddress: {
    firstName: data.billing_firstName,
    lastName: data.billing_lastName,
    streetAddress: data.billing_streetAddress,
    country: data.billing_country,
    state: data.billing_state,
    postalCode: data.billing_postalCode,
    city: data.billing_city,
    company: data.billing_company,
    phoneNumber: data.billing_phoneNumber,
    landmark: data.billing_landmark,
  },
});

const getStripePublishableKey = () => {
  const mode = (import.meta.env.VITE_STRIPE_MODE || 'live').toLowerCase();
  if (mode === 'test')
    return (
      import.meta.env.VITE_STRIPE_TEST_API_KEY ||
      import.meta.env.VITE_STRIPE_API_KEY ||
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );
  return (
    import.meta.env.VITE_STRIPE_LIVE_API_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_STRIPE_API_KEY
  );
};

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(window.navigator.platform) ||
    (window.navigator.userAgent.includes("Mac") && "ontouchend" in window.document)
  );
};

// ─── UI Sub-components ────────────────────────────────────────────────────────

/** Floating-label text input */
const Field = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  disabled,
  className = '',
  autoComplete,
}) => (
  <div className={`relative ${className}`}>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder=" "
      autoComplete={autoComplete}
      className={`
        peer w-full rounded-xl border border-gray-200 bg-white px-4 pt-6 pb-2
        text-sm text-gray-900 outline-none transition-all
        focus:border-gray-800 focus:ring-2 focus:ring-gray-800/10
        disabled:bg-gray-50 disabled:text-gray-400
        placeholder-shown:pt-4
      `}
    />
    <label
      htmlFor={name}
      className="
        pointer-events-none absolute left-4 top-2 text-[10px] font-semibold
        uppercase tracking-widest text-gray-400 transition-all
        peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
        peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal
        peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-gray-400
        peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[10px]
        peer-focus:font-semibold peer-focus:tracking-widest peer-focus:text-gray-500
      "
    >
      {label}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  </div>
);

/** Floating-label select */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  required,
  disabled,
  children,
  className = '',
  autoComplete,
}) => (
  <div className={`relative ${className}`}>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`
        peer w-full appearance-none rounded-xl border border-gray-200 bg-white
        px-4 pt-6 pb-2 text-sm text-gray-900 outline-none transition-all
        focus:border-gray-800 focus:ring-2 focus:ring-gray-800/10
        disabled:bg-gray-50 disabled:text-gray-400
      `}
    >
      {children}
    </select>
    <label
      htmlFor={name}
      className="pointer-events-none absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400"
    >
      {label}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {/* Chevron icon */}
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

/** Section card wrapper */
const SectionCard = ({ step, title, children }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
      {step && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
          {step}
        </span>
      )}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-700">
        {title}
      </h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/** Saved address pill selector */
const AddressSelector = ({
  addresses = [],
  selectedId,
  onSelect,
  onNewAddress,
  label,
}) => {
  if (addresses.length === 0) return null;
  return (
    <div className="mb-5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Saved {label} addresses
      </p>
      <div className="flex flex-wrap gap-2">
        {addresses.map((addr) => {
          const isSelected = selectedId === addr._id;
          return (
            <button
              key={addr._id}
              type="button"
              onClick={() => onSelect(addr)}
              className={`rounded-xl border px-4 py-2.5 text-left text-xs transition-all ${
                isSelected
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <span className="font-semibold">{addr.label || 'Home'}</span>
              {addr.isDefault && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  Default
                </span>
              )}
              <span
                className={`ml-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}
              >
                · {addr.city}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onNewAddress}
          className={`rounded-xl border px-4 py-2.5 text-xs transition-all ${
            selectedId === 'new'
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-dashed border-gray-300 bg-white text-gray-500 hover:border-gray-500'
          }`}
        >
          + New address
        </button>
      </div>
    </div>
  );
};

/** Address form grid */
const AddressForm = ({
  prefix,
  formData,
  onChange,
  stateList,
  checkout,
  disabled = false,
}) => (
  <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-3">
      <Field
        label={checkout.firstName || 'First Name'}
        name={`${prefix}_firstName`}
        value={formData[`${prefix}_firstName`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping given-name' : 'billing given-name'}
      />
      <Field
        label={checkout.lastName || 'Last Name'}
        name={`${prefix}_lastName`}
        value={formData[`${prefix}_lastName`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping family-name' : 'billing family-name'}
      />
    </div>
    <Field
      label={checkout.streetAddress || 'Street Address'}
      name={`${prefix}_streetAddress`}
      value={formData[`${prefix}_streetAddress`]}
      onChange={onChange}
      required
      disabled={disabled}
      autoComplete={prefix === 'shipping' ? 'shipping street-address' : 'billing street-address'}
    />
    <div className="grid grid-cols-2 gap-3">
      <SelectField
        label={checkout.country || 'Country'}
        name={`${prefix}_country`}
        value={formData[`${prefix}_country`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping country' : 'billing country'}
      >
        <option value="" disabled />
        {Country.getAllCountries().map((c) => (
          <option key={c.isoCode} value={c.isoCode}>
            {c.name} {c.flag}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={checkout.state || 'State'}
        name={`${prefix}_state`}
        value={formData[`${prefix}_state`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping address-level1' : 'billing address-level1'}
      >
        <option value="" disabled />
        {stateList.map((s) => (
          <option key={s.isoCode} value={s.isoCode}>
            {s.name}
          </option>
        ))}
      </SelectField>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field
        label={checkout.city || 'City'}
        name={`${prefix}_city`}
        value={formData[`${prefix}_city`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping address-level2' : 'billing address-level2'}
      />
      <Field
        label={checkout.postalCode || 'Postal Code'}
        name={`${prefix}_postalCode`}
        value={formData[`${prefix}_postalCode`]}
        onChange={onChange}
        required
        disabled={disabled}
        autoComplete={prefix === 'shipping' ? 'shipping postal-code' : 'billing postal-code'}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field
        label={checkout.phoneNumber || 'Phone Number'}
        name={`${prefix}_phoneNumber`}
        value={formData[`${prefix}_phoneNumber`]}
        onChange={onChange}
        required
        disabled={disabled}
        type="tel"
        autoComplete={prefix === 'shipping' ? 'shipping tel' : 'billing tel'}
      />
      <Field
        label={checkout.landmark || 'Landmark (optional)'}
        name={`${prefix}_landmark`}
        value={formData[`${prefix}_landmark`]}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
    <Field
      label={checkout.company || 'Company (optional)'}
      name={`${prefix}_company`}
      value={formData[`${prefix}_company`]}
      onChange={onChange}
      disabled={disabled}
      autoComplete={prefix === 'shipping' ? 'shipping organization' : 'billing organization'}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutForm({
  onShippingChange,
  liveSummary,
  shippingCharges: shippingChargesProp,
  appliedCreditAmount: appliedCreditAmountProp,
  cartItems,
  translateLanguage,
  common: commonProp,
  cart,
}) {
  const {
    content: { common: commonCtx, checkout },
  } = useTranslationContext();
  const common = commonProp || commonCtx;
  const contactRef = useRef(null);

  const navigate = useNavigate();
  const {
    data: cartData,
    couponCode,
    setCouponCode,
    isCouponApply,
    setIsCouponApply,
    couponData,
    setCouponData,
    calculateCartSummary,
    setCheckoutSummary,
    appliedCreditAmount,
    setAppliedCreditAmount,
    isBagAdded,
    clearCart,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const couponsQuery = useQuery({
    queryKey: ['valid-coupons'],
    queryFn: getValidTokens,
    enabled: isUserSignedIn(),
    retry: false,
  });

  const availableCoupons = (couponsQuery.data?.data || []).filter(
    (coupon) => coupon?.showToUsers !== false
  );

  const handleApplyCoupon = async (coupon) => {
    if (!coupon) return;

    if (!isUserSignedIn() && !guestEmailVerified) {
      message.warning("Please verify your email address to apply coupons.");
      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setIsApplyingCoupon(true);

    try {
      const res = await applyCoupon({
        couponCode: coupon,
        guestEmail: formData.contactEmail,
        guestPhone: formData.contactPhone
      });
      const validCoupon = res?.data;

      const tempSummary = calculateCartSummary({
        items: cartData,
        couponData: validCoupon,
        isCouponApply: true,
        currency,
        rates,
      });

      if (
        validCoupon.scope &&
        validCoupon.scope !== 'All' &&
        tempSummary.couponDiscount <= 0
      ) {
        message.error('This coupon is not eligible for your cart');
        setIsApplyingCoupon(false);
        return;
      }

      setCouponData(validCoupon);
      setCouponInput('');
      setCouponCode(validCoupon?.couponCode);
      setIsCouponApply(true);
      setIsCouponModalOpen(false);
      message.success('Coupon applied successfully');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const { currency, rates } = useCurrency();
  const currencyRate = Number(rates?.[currency] || 1);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingStateList, setShippingStateList] = useState([]);
  const [billingStateList, setBillingStateList] = useState([]);

  // ── FIX: restore email from sessionStorage on mount ──────────────────────────
  const [formData, setFormData] = useState(() => {
    const savedEmail = sessionStorage.getItem('checkoutGuestEmail') || '';
    return { ...EMPTY_FORM, contactEmail: savedEmail };
  });

  const [totalProductWeight, setTotalProductWeight] = useState(0);
  const [isSameAsShipping, setIsSameAsShipping] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState(null);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [contactError, setContactError] = useState('');
  const [guestEmailVerified, setGuestEmailVerified] = useState(
    isUserSignedIn() || Boolean(sessionStorage.getItem('checkoutVerificationToken'))
  );
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const [stripe, setStripe] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [fastCheckoutBrand, setFastCheckoutBrand] = useState(() => {
    return isIOSDevice() ? 'applePay' : 'generic';
  });
  const [isApplePayWarningOpen, setIsApplePayWarningOpen] = useState(false);



  const formatConvertedPrice = (amount) =>
    formatPrice(convertPrice(amount, currency, rates), currency);

  const calculatedShippingCharges = totalProductWeight
    ? calculateShippingCharges(formData.shipping_country, totalProductWeight)
    : 0;
  const effectiveShippingCharges =
    Number(shippingChargesProp || 0) > 0
      ? Number(shippingChargesProp)
      : calculatedShippingCharges;

  // useMemo so derivedSummary only gets a new object reference when its inputs
  // actually change. Without this it's a new object every render, causing the
  // useEffect below to call setCheckoutSummary on every render → infinite loop.
  const derivedSummary = useMemo(
    () =>
      liveSummary ||
      calculateCartSummary({
        items: cartData,
        couponData,
        isCouponApply,
        isBagAdded,
        shippingCharges: effectiveShippingCharges,
        appliedCreditAmount,
        currency,
        rates,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveSummary, cartData, couponData, isCouponApply, isBagAdded, effectiveShippingCharges, appliedCreditAmount, currency, rates]
  );

  const effectiveAppliedCredit = appliedCreditAmountProp ?? appliedCreditAmount;
  const items = cartItems || cartData;

  const totalProductWeightRef = useRef(totalProductWeight);
  const cartItemsRef = useRef(cartItems);
  const currencyRef = useRef(currency);
  const shippingChargesRef = useRef(shippingChargesProp || 0);
  const isCouponApplyRef = useRef(isCouponApply);
  const couponCodeRef = useRef(couponCode);
  const contactEmailRef = useRef(formData.contactEmail);
  const derivedSummaryRef = useRef(null);

  useEffect(() => {
    totalProductWeightRef.current = totalProductWeight;
  }, [totalProductWeight]);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    currencyRef.current = currency;
  }, [currency]);

  useEffect(() => {
    shippingChargesRef.current = shippingChargesProp || 0;
  }, [shippingChargesProp]);

  useEffect(() => {
    isCouponApplyRef.current = isCouponApply;
  }, [isCouponApply]);

  useEffect(() => {
    couponCodeRef.current = couponCode;
  }, [couponCode]);

  useEffect(() => {
    contactEmailRef.current = formData.contactEmail;
  }, [formData.contactEmail]);

  useEffect(() => {
    derivedSummaryRef.current = derivedSummary;
  }, [derivedSummary]);

  useEffect(() => {
    const initStripe = async () => {
      const pubKey = getStripePublishableKey();
      if (!pubKey) return;
      const stripeInstance = await loadStripe(pubKey);
      setStripe(stripeInstance);
    };
    initStripe();
  }, []);

  useEffect(() => {
    if (!stripe || !derivedSummary?.subtotal) return;

    const subtotalInMinor = Math.round(derivedSummary.subtotal * 100);
    const curr = currency.toLowerCase();

    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: 'Cart Subtotal',
          amount: subtotalInMinor,
        },
        currency: curr,
      });
    } else {
      const pr = stripe.paymentRequest({
        country: 'AE',
        currency: curr,
        total: {
          label: 'Cart Subtotal',
          amount: subtotalInMinor,
        },
        requestShipping: true,
        requestPayerName: true,
        requestPayerEmail: true,
        requestPayerPhone: true,
        shippingOptions: [
          {
            id: 'delivery',
            label: 'Delivery',
            detail: 'Standard delivery fee calculated based on your address',
            amount: 0,
          },
        ],
      });

      pr.canMakePayment().then((result) => {
        const isIOS = isIOSDevice();
        if (result) {
          if (isIOS && result.applePay) {
            setFastCheckoutBrand('applePay');
          } else {
            setFastCheckoutBrand('generic');
          }
        } else {
          setFastCheckoutBrand(isIOS ? 'applePay' : 'generic');
        }
      });

      pr.on('shippingaddresschange', async (ev) => {
        try {
          const country = ev.shippingAddress.country;
          const weight = totalProductWeightRef.current;
          const targetCurr = currencyRef.current;

          const res = await getDeliveryFee({
            country,
            weight,
            currency: targetCurr,
          });

          if (!res.success) {
            ev.updateWith({ status: 'fail' });
            return;
          }

          const deliveryFee = res.deliveryFee;
          onShippingChange?.(res.feeInUsd || deliveryFee);

          const subtotal = derivedSummaryRef.current?.subtotal || 0;
          const updatedTotal = subtotal + deliveryFee;

          ev.updateWith({
            status: 'success',
            displayItems: [
              {
                label: 'Subtotal',
                amount: Math.round(subtotal * 100),
              },
              {
                label: 'Delivery Fee',
                amount: Math.round(deliveryFee * 100),
              },
            ],
            shippingOptions: [
              {
                id: 'delivery',
                label: 'Delivery',
                detail: 'Standard delivery fee calculated based on your address',
                amount: Math.round(deliveryFee * 100),
              },
            ],
            total: {
              label: 'Total',
              amount: Math.round(updatedTotal * 100),
            },
          });
        } catch (err) {
          console.error('Error in shippingaddresschange', err);
          ev.updateWith({ status: 'fail' });
        }
      });

      pr.on('shippingoptionchange', (ev) => {
        ev.updateWith({ status: 'success' });
      });

      pr.on('paymentmethod', async (ev) => {
        try {
          const { paymentMethod, shippingAddress, payerEmail, payerName, payerPhone } = ev;

          const recipientName = shippingAddress.recipient || payerName || '';
          const nameParts = recipientName.trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const addressLines = shippingAddress.addressLine || [];
          const streetAddress = addressLines.join(', ');

          const formattedShipping = {
            firstName,
            lastName,
            streetAddress,
            city: shippingAddress.city || '',
            state: shippingAddress.region || '',
            postalCode: shippingAddress.postalCode || '',
            country: shippingAddress.country || '',
            phoneNumber: shippingAddress.phone || payerPhone || '',
          };

          const items = cartItemsRef.current || [];
          const productsPayload = items.map((item) => ({
            product: item.product?._id || item.product?.id || item.product || item._id,
            quantity: item.quantity,
            sku: item.sku,
            filters: item.filters,
            bags: item.bags || 0,
          }));

          const res = await confirmApplePayPayment({
            paymentMethodId: paymentMethod.id,
            email: payerEmail || contactEmailRef.current || '',
            shippingAddress: formattedShipping,
            billingAddress: formattedShipping,
            deliveryFee: convertPrice(shippingChargesRef.current, currencyRef.current, rates),
            products: productsPayload,
            currency: currencyRef.current,
            couponCode: isCouponApplyRef.current ? couponCodeRef.current : null,
          });

          if (res.success) {
            ev.complete('success');
            clearCart({ updateOnBackend: isUserSignedIn() });
            navigate(`/order-success/${res.orderId}`);
          } else {
            ev.complete('fail');
            message.error(res.error || 'Payment confirmation failed');
          }
        } catch (err) {
          console.error('Error confirming Apple Pay payment', err);
          ev.complete('fail');
          message.error(err.response?.data?.error || err.message || 'Payment confirmation failed');
        }
      });

      setPaymentRequest(pr);
    }
  }, [stripe, derivedSummary?.subtotal, currency]);

  const handleApplePayClick = () => {
    setIsApplePayWarningOpen(true);
  };

  const handleApplePayContinue = async () => {
    setIsApplePayWarningOpen(false);
    if (!paymentRequest) return;
    try {
      await paymentRequest.show();
    } catch (err) {
      console.warn("Payment Request failed to launch:", err);
      message.warning(
        "Payment Request sheet is not supported in this browser (or requires HTTPS / active saved cards). " +
        "Please test in Safari on Apple devices or configure Chrome with a saved card."
      );
    }
  };

  const query = useQuery({
    queryKey: ['address-book'],
    queryFn: getAddressBook,
    enabled: isUserSignedIn(),
  });
  const profileQuery = useQuery({
    queryKey: ['my-account'],
    queryFn: getMyAccount,
    enabled: isUserSignedIn(),
  });
  const creditsQuery = useQuery({
    queryKey: ['credit'],
    queryFn: getUserCredits,
    enabled: isUserSignedIn(),
    retry: false,
  });

  const availableCredits = Number(creditsQuery.data?.credits || 0);
  const availableCreditsInCurrency = convertPrice(
    availableCredits,
    currency,
    rates
  );

  const handleApplyCredits = () => {
    const baseSummary = calculateCartSummary({
      items: cartData,
      couponData,
      isCouponApply,
      isBagAdded,
      shippingCharges: effectiveShippingCharges,
      appliedCreditAmount: 0,
      currency,
      rates,
    });
    const neededAmountInCurrency =
      baseSummary.total + (baseSummary.creditApplied || 0);
    const neededAmountBase = convertStoredPrice(
      neededAmountInCurrency,
      currency,
      BASE_CURRENCY,
      rates
    );
    const eligibleAmountBase = Math.min(availableCredits, neededAmountBase);
    if (eligibleAmountBase <= 0) {
      message.warning('No wallet credit available to apply');
      return;
    }
    const finalAmountBaseToSet =
      Math.abs(eligibleAmountBase - neededAmountBase) < 0.01
        ? neededAmountBase
        : eligibleAmountBase;
    setAppliedCreditAmount(Number(finalAmountBaseToSet.toFixed(2)));
    message.success(
      `Applied ${formatConvertedPrice(finalAmountBaseToSet)} from My Credit`
    );
  };

  const applyVerifiedAddressData = (data = {}) => {
    const savedShippingAddresses = data?.shippingAddresses || [];
    const savedBillingAddresses = data?.billingAddresses || [];
    const defaultShipping =
      savedShippingAddresses.find((a) => a.isDefault) ||
      savedShippingAddresses[0];
    const defaultBilling =
      savedBillingAddresses.find((a) => a.isDefault) ||
      savedBillingAddresses[0];

    if (defaultShipping) {
      applyShippingAddress(defaultShipping);
    } else {
      clearShippingAddress();
    }

    if (defaultBilling) {
      applyBillingAddress(defaultBilling);
    } else {
      clearBillingAddress();
    }
  };

  useEffect(() => {
    const fetchGuestAddresses = async () => {
      if (!isUserSignedIn() && guestEmailVerified) {
        try {
          const res = await getVerifiedCheckoutAddresses();
          if (res?.data) {
            applyVerifiedAddressData(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch guest addresses", err);
        }
      }
    };
    fetchGuestAddresses();
  }, [guestEmailVerified]);

  const handleSendOtp = async () => {
    const email = formData.contactEmail.trim().toLowerCase();
    setContactError('');
    setOtpError('');

    if (!email) {
      setContactError('Please enter your email address.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await sendCheckoutOtp(email);
      setOtpSent(true);
      setResendCountdown(res?.resendAfter || OTP_RESEND_SECONDS);
      message.success(res?.message || 'OTP sent successfully');
    } catch (err) {
      const retryAfter = Number(err?.response?.data?.retryAfter || 0);
      if (retryAfter > 0) setResendCountdown(retryAfter);
      setContactError(
        err?.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const email = formData.contactEmail.trim().toLowerCase();
    setOtpError('');

    if (!otpValue.trim()) {
      setOtpError('Please enter the OTP sent to your email.');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await verifyCheckoutOtp({ email, otp: otpValue.trim() });
      if (res?.token) setCheckoutVerificationToken(res.token);
      setGuestEmailVerified(true);
      setOtpSent(false);
      setOtpValue('');
      applyVerifiedAddressData(res?.data || {});
      message.success(res?.message || 'Email verified successfully');
    } catch (err) {
      setOtpError(
        err?.response?.data?.message || 'Invalid OTP. Please try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRemoveCredits = () => {
    setAppliedCreditAmount(0);
    message.success('Removed applied wallet credit');
  };

  const shippingAddresses = query.data?.data?.shippingAddresses || [];
  const billingAddresses = query.data?.data?.billingAddresses || [];

  const applyShippingAddress = (addr) => {
    setSelectedShippingId(addr._id);
    const fields = addressToShippingFields(addr, 'shipping');
    setFormData((prev) => {
      const next = { ...prev, ...fields };
      const newRate = calculateShippingCharges(
        next.shipping_country,
        totalProductWeight
      );
      onShippingChange?.(newRate);
      return next;
    });
    setShippingStateList(State.getStatesOfCountry(addr.country));
  };

  const applyBillingAddress = (addr) => {
    setSelectedBillingId(addr._id);
    const fields = addressToShippingFields(addr, 'billing');
    setFormData((prev) => ({ ...prev, ...fields }));
    setBillingStateList(State.getStatesOfCountry(addr.country));
  };

  const clearShippingAddress = () => {
    setSelectedShippingId('new');
    setFormData((prev) => {
      const next = {
        ...prev,
        shipping_firstName: '',
        shipping_lastName: '',
        shipping_streetAddress: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postalCode: '',
        shipping_country: '',
        shipping_company: '',
        shipping_phoneNumber: '',
        shipping_landmark: '',
      };
      onShippingChange?.(0);
      return next;
    });
    setShippingStateList([]);
  };

  const clearBillingAddress = () => {
    setSelectedBillingId('new');
    setIsSameAsShipping(false);
    setFormData((prev) => ({
      ...prev,
      billing_firstName: '',
      billing_lastName: '',
      billing_streetAddress: '',
      billing_city: '',
      billing_state: '',
      billing_postalCode: '',
      billing_country: '',
      billing_company: '',
      billing_phoneNumber: '',
      billing_landmark: '',
    }));
    setBillingStateList([]);
  };

  // ── FIX: persist email to sessionStorage on every change ─────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactEmail') {
      sessionStorage.setItem('checkoutGuestEmail', value);
    }
    if (name === 'shipping_country') {
      setShippingStateList(State.getStatesOfCountry(value));
      const newRate = calculateShippingCharges(value, totalProductWeight);
      onShippingChange?.(newRate);
    }
    if (name === 'billing_country')
      setBillingStateList(State.getStatesOfCountry(value));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSameAsShippingChange = (e) => {
    const isChecked = e.target.checked;
    setIsSameAsShipping(isChecked);
    if (isChecked) {
      setFormData((prev) => {
        const next = {
          ...prev,
          billing_firstName: prev.shipping_firstName,
          billing_lastName: prev.shipping_lastName,
          billing_streetAddress: prev.shipping_streetAddress,
          billing_city: prev.shipping_city,
          billing_state: prev.shipping_state,
          billing_postalCode: prev.shipping_postalCode,
          billing_country: prev.shipping_country,
          billing_company: prev.shipping_company,
          billing_phoneNumber: prev.shipping_phoneNumber,
          billing_landmark: prev.shipping_landmark,
        };
        setBillingStateList(State.getStatesOfCountry(next.shipping_country));
        return next;
      });
      setSelectedBillingId(selectedShippingId);
    } else {
      clearBillingAddress();
    }
  };

  const handlePaymentChoice = async (mode) => {
    setIsModalVisible(false);
    const { shippingAddress, billingAddress } =
      formatShippingBillingAddress(formData);

    if (mode === 'tabby') {
      if (!isUserSignedIn()) {
        message.warning('Please sign in to pay with Tabby.');
        return;
      }

      try {
        setLoading(true);
        const payload = {
          products: cartData,
          shippingAddress,
          billingAddress,
          shippingCharges: effectiveShippingCharges,
          couponCode: isCouponApply ? couponCode : null,
          creditsUsed: derivedSummary.creditApplied,
          creditsUsedBase: appliedCreditAmount,
          totalAmount: derivedSummary.total,
          isBagAdded,
          currency,
          currencyRate,
        };
        const data = await createTabbySession(payload);
        if (!data?.url) {
          throw new Error('Tabby checkout URL was not returned');
        }
        message.success(
          checkout.redirectingToPaymentGateway || 'Redirecting to payment gateway...'
        );
        window.location.href = data.url;
      } catch (err) {
        setLoading(false);
        message.error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            checkout.checkoutFailed
        );
      }
      return;
    }

    if (mode === 'card') {
      try {
        setLoading(true);
        const payload = {
          products: cartData,
          shippingAddress,
          billingAddress,
          shippingCharges: convertPrice(effectiveShippingCharges, currency, rates),
          couponCode: isCouponApply ? couponCode : null,
          creditsUsed: derivedSummary.creditApplied,
          creditsUsedBase: appliedCreditAmount,
          totalAmount: derivedSummary.total,
          isBagAdded,
          currency,
          currencyRate,
        };
        if (!isUserSignedIn()) {
          payload.guestEmail = formData.contactEmail;
          payload.guestPhone = formData.contactPhone;
        }
        const data = isUserSignedIn()
          ? await createPaymentIntent(payload)
          : await createVerifiedGuestPaymentIntent(payload);
        if (data?.paidWithCredits && data?.orderId) {
          clearCart({ updateOnBackend: true });
          navigate(`/order-success/${data.orderId}`);
          setAppliedCreditAmount(0);
          return;
        }
        const publishableKey = getStripePublishableKey();
        if (!publishableKey)
          throw new Error('Stripe publishable key is not configured');
        const stripePromise = await loadStripe(publishableKey);
        const result = await stripePromise.redirectToCheckout({
          sessionId: data.id,
        });
        if (result.error) {
          message.error(result.error.message);
          setLoading(false);
          return;
        }
        message.success(checkout.redirectingToPaymentGateway);
        setAppliedCreditAmount(0);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        message.error(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            checkout.checkoutFailed
        );
      }
    } else {
      try {
        const payload = {
          products: cartData,
          shippingAddress,
          billingAddress,
          shippingCharges: effectiveShippingCharges,
          couponCode: isCouponApply ? couponCode : null,
          creditsUsed: derivedSummary.creditApplied,
          creditsUsedBase: appliedCreditAmount,
          totalAmount: derivedSummary.total,
          isBagAdded,
          currency,
          currencyRate,
        };
        let res;
        if (isUserSignedIn()) {
          res = await createManualOrder(payload);
        } else {
          payload.guestEmail = formData.contactEmail;
          payload.guestPhone = formData.contactPhone;
          res = await createVerifiedGuestOrder(payload);
        }
        message.success(res?.message || checkout.orderPlacedSuccessfully);
        clearCart({ updateOnBackend: isUserSignedIn() });
        navigate(`/order-success/${res?.data}`);
      } catch (err) {
        message.error(err?.response?.data?.message);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isUserSignedIn() && !guestEmailVerified) {
      message.warning('Please verify your email before checkout.');
      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setContactError('');
    if (derivedSummary.total === 0) {
      handlePaymentChoice('card');
    } else {
      setIsModalVisible(true);
    }
  };

  useEffect(() => {
    if (!query.data) return;
    const defaultShipping =
      shippingAddresses.find((a) => a.isDefault) || shippingAddresses[0];
    const defaultBilling =
      billingAddresses.find((a) => a.isDefault) || billingAddresses[0];
    if (defaultShipping) {
      applyShippingAddress(defaultShipping);
    } else {
      const addr = query.data?.data?.shippingAddress || {};
      if (addr.street_address || addr.streetAddress) {
        setFormData((prev) => ({
          ...prev,
          ...addressToShippingFields(addr, 'shipping'),
        }));
        setShippingStateList(State.getStatesOfCountry(addr.country));
        setSelectedShippingId('new');
      }
    }
    if (defaultBilling) {
      applyBillingAddress(defaultBilling);
    } else {
      const addr = query.data?.data?.billingAddress || {};
      if (addr.street_address || addr.streetAddress) {
        setFormData((prev) => ({
          ...prev,
          ...addressToShippingFields(addr, 'billing'),
        }));
        setBillingStateList(State.getStatesOfCountry(addr.country));
        setSelectedBillingId('new');
      }
    }
  }, [query.data]);

  useEffect(() => {
    if (!profileQuery.data?.data) return;
    const p = profileQuery.data.data;
    setFormData((prev) => ({
      ...prev,
      contactEmail: prev.contactEmail || p.email || '',
      shipping_firstName: prev.shipping_firstName || p.firstName || '',
      shipping_lastName: prev.shipping_lastName || p.lastName || '',
      shipping_phoneNumber: prev.shipping_phoneNumber || p.contactNumber || '',
      billing_firstName: prev.billing_firstName || p.firstName || '',
      billing_lastName: prev.billing_lastName || p.lastName || '',
      billing_phoneNumber: prev.billing_phoneNumber || p.contactNumber || '',
    }));
  }, [profileQuery.data]);

  useEffect(() => {
    setTotalProductWeight(
      cartData?.reduce(
        (acc, item) =>
          acc +
          (parseFloat(item?.product?.weight) || 0) *
            (parseFloat(item?.quantity) || 0),
        0
      ) || 0
    );
  }, [cartData]);

  useEffect(() => {
    onShippingChange?.(calculatedShippingCharges);
  }, [calculatedShippingCharges, onShippingChange]);

  useEffect(() => {
    setCheckoutSummary(derivedSummary);
    // setCheckoutSummary is a stable React state setter — safe to omit from deps.
    // Including it previously caused the infinite re-render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedSummary]);

  useEffect(() => {
    if (resendCountdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  const showShippingForm =
    selectedShippingId === 'new' || shippingAddresses.length === 0;
  const showBillingForm =
    !isSameAsShipping &&
    (selectedBillingId === 'new' || billingAddresses.length === 0);
  const canShowCheckoutForms = isUserSignedIn() || guestEmailVerified;

  // ── Reusable Order Summary block ──────────────────────────────────────────────
  const OrderSummaryContent = (
    <>
      <p className="mb-4 text-xs text-gray-400">
        {items?.length || 0} item{items?.length === 1 ? '' : 's'} in your bag
      </p>

      {items?.length > 0 && (
        <div className="mb-5 divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
          {items.map((item) => {
            const unitPrice = Number(
              getPercentageOf(
                item?.product?.price || 0,
                item?.product?.discount || 0
              )
            );
            const lineTotal = unitPrice * Number(item?.quantity || 0);
            const productImage =
              item?.product?.thumbnail ||
              item?.product?.image ||
              item?.product?.images?.[0];
            const productName =
              item?.product?.translated?.productName ||
              item?.product?.productName?.[translateLanguage] ||
              item?.product?.productName?.en;
            return (
              <div
                key={`${item?.product?._id}-${item?.sku}`}
                className="flex items-center gap-3 bg-white px-4 py-3"
              >
                <Link
                  to={`/product-details/${item?.product?._id}`}
                  className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                >
                  <img
                    src={productImage ? resolveAssetUrl(productImage) : ''}
                    alt={productName || common.productImageAlt}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/product-details/${item?.product?._id}`}
                    className="block text-sm font-semibold text-gray-900 hover:opacity-70 truncate"
                  >
                    {productName}
                  </Link>
                  {item?.filters && Object.keys(item.filters).length > 0 && (
                    <p className="mt-0.5 text-xs text-gray-400 truncate">
                      {Object.entries(item.filters)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Qty {item?.quantity} × {formatConvertedPrice(unitPrice)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {item?.product?.discount > 0 && (
                    <p className="text-xs text-gray-300 line-through">
                      {formatConvertedPrice(
                        Number(item?.product?.price || 0) *
                          Number(item?.quantity || 0)
                      )}
                    </p>
                  )}
                  <p className="text-sm font-bold text-gray-900">
                    {formatConvertedPrice(lineTotal)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wallet credit */}
      {isUserSignedIn() && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">My Credit</p>
            <p className="text-xs text-gray-400">
              Available: {formatPrice(availableCreditsInCurrency, currency)}
            </p>
          </div>
          {appliedCreditAmount > 0 ? (
            <button
              type="button"
              onClick={handleRemoveCredits}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition"
            >
              Remove
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyCredits}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Apply
            </button>
          )}
        </div>
      )}

      {/* Coupon Section */}
      <div className="mb-4">
        {!isCouponApply ? (
          <>
            <p className="mb-2 text-sm font-medium text-gray-700">
              {cart.enterPromoCode}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-800"
                placeholder={cart.enterPromoCode}
              />
              <button
                onClick={() => handleApplyCoupon(couponInput)}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                disabled={!couponInput || isApplyingCoupon}
              >
                {isApplyingCoupon ? 'Applying...' : common.apply}
              </button>
            </div>
            {isUserSignedIn() && (
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(true)}
                className="mt-2 w-full text-sm font-medium text-gray-600 hover:text-gray-900 underline"
              >
                View Available Coupons
              </button>
            )}
          </>
        ) : (
          <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-gray-200">
            <div className="flex items-center gap-1.5 px-3 py-1.5">
              <Tag className="h-3 w-3 text-emerald-800" />
              <span className="text-[14px] font-semibold tracking-widest text-emerald-800">
                {couponCode}
              </span>
            </div>
            <div className="flex items-center gap-2 border-l border-dashed border-gray-300 bg-gray-50 px-2.5 py-1.5">
              <span className="text-[14px] font-medium text-emerald-600">
                applied
              </span>
              <button
                type="button"
                aria-label="Remove coupon"
                onClick={() => {
                  setCouponCode(null);
                  setIsCouponApply(false);
                  setCouponData({});
                }}
                className="flex h-4 w-4 mb-1.5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-400 hover:border-gray-500 hover:text-gray-600 transition-colors"
              >
                <LuX size={8} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div>
        <div className="flex justify-between text-gray-500">
          <span>{common.subTotal}</span>
          <span>{formatPrice(derivedSummary.subtotal, currency)}</span>
        </div>
        {derivedSummary.couponDiscount > 0 && (
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-emerald-600">
              <span>{common.coupon}</span>
              <span>
                −{formatPrice(derivedSummary.couponDiscount, currency)}
              </span>
            </div>
            {couponData?.scope && couponData.scope !== 'All' && (
              <p className="text-right text-[10px] text-gray-400 italic">
                Applied to:{' '}
                {couponData.scope === 'Category'
                  ? couponData.scopeCategory?.name?.[translateLanguage] ||
                    couponData.scopeCategory?.name?.en
                  : couponData.scopeProduct?.productName?.[translateLanguage] ||
                    couponData.scopeProduct?.productName?.en}
              </p>
            )}
          </div>
        )}
        {(effectiveShippingCharges > 0 || formData.shipping_country) && (
          <>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span
                className={
                  derivedSummary.shipping <= 0
                    ? 'text-emerald-600 font-medium'
                    : ''
                }
              >
                {derivedSummary.shipping > 0
                  ? formatPrice(derivedSummary.shipping, currency)
                  : 'Free'}
              </span>
            </div>
            {derivedSummary.deliveryCouponDiscount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span className="pl-3 text-xs italic">Delivery Discount</span>
                <span>
                  −
                  {formatPrice(derivedSummary.deliveryCouponDiscount, currency)}
                </span>
              </div>
            )}
          </>
        )}
        {derivedSummary.bagFee > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Bag Fee</span>
            <span>+{formatPrice(derivedSummary.bagFee, currency)}</span>
          </div>
        )}
        {Number(derivedSummary.creditApplied || 0) > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>My Credit</span>
            <span>
              −{formatPrice(Number(derivedSummary.creditApplied), currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-bold text-gray-900">
          <span>{common.total}</span>
          <span>{formatPrice(derivedSummary.total, currency)}</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Modal
        title="Available Coupons"
        open={isCouponModalOpen}
        onCancel={() => setIsCouponModalOpen(false)}
        footer={null}
        centered
      >
        {couponsQuery.isLoading ? (
          <p className="text-sm text-gray-600">{common.loading}</p>
        ) : availableCoupons.length ? (
          <div className="space-y-3">
            {availableCoupons.map((coupon) => {
              const isActiveCoupon = couponCode === coupon.couponCode;
              return (
                <button
                  key={coupon._id}
                  type="button"
                  onClick={() => handleApplyCoupon(coupon.couponCode)}
                  className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isActiveCoupon || isApplyingCoupon}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{coupon.couponCode}</p>
                        {isActiveCoupon && (
                          <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                            Applied
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {coupon.couponName}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      {coupon.discount}% OFF
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No active coupons found.</p>
        )}
      </Modal>

      <PaymentModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSelectPayment={handlePaymentChoice}
        checkout={checkout}
        canUseTabby={isUserSignedIn()}
      />

      <Modal
        title="Estimate Delivery Fee"
        open={isApplePayWarningOpen}
        onCancel={() => setIsApplePayWarningOpen(false)}
        footer={[
          <button
            key="cancel"
            onClick={() => setIsApplePayWarningOpen(false)}
            className="mr-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>,
          <button
            key="continue"
            onClick={handleApplePayContinue}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/90 transition"
          >
            Continue
          </button>
        ]}
        centered
      >
        <p className="py-4 text-sm text-gray-600 leading-relaxed">
          Please note: the amount shown is not final. The final total will be calculated after you select your delivery address, based on your country and cart weight.
        </p>
      </Modal>

      <form onSubmit={handleSubmit} className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start lg:gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Step 1 – Contact */}
            {isUserSignedIn() ? (
              <SectionCard step="1" title="Contact Information">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-semibold text-gray-800">{formData.contactEmail || profileQuery.data?.data?.email}</p>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard step="1" title="Contact Information" >
                <div ref={contactRef}>
                  <p className="mb-4 text-xs text-gray-400">
                    We'll send your order confirmation here.
                  </p>

                  {/* Email row */}
                  <div className="flex items-end gap-2">
                    <Field
                      label={checkout.email || 'Email Address'}
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      disabled={guestEmailVerified || otpLoading}
                      onChange={(e) => {
                        handleChange(e);
                        setContactError('');
                        setOtpError('');
                        // Reset verification if email changes
                        if (guestEmailVerified) {
                          setGuestEmailVerified(false);
                          setOtpSent(false);
                          sessionStorage.removeItem('checkoutVerificationToken');
                          clearCheckoutVerificationToken?.();
                        }
                      }}
                      required
                      className="flex-1"
                      autoComplete="email"
                    />
                    {/* Send / Resend / Verified button — inline with email */}
                    {!guestEmailVerified && (
                      <button
                        type="button"
                        disabled={otpLoading}
                        onClick={handleSendOtp}
                        className="h-[52px] flex-shrink-0 rounded-xl border border-gray-900 bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
                      >
                        {otpLoading
                          ? '…'
                          : otpSent
                            ? 'Resend'
                            : 'Send OTP'}
                      </button>
                    )}
                  </div>

                  {/* Verified state */}
                  {guestEmailVerified && (
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* checkmark */}
                        <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-emerald-700">
                          {formData.contactEmail} verified
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setGuestEmailVerified(false);
                          setOtpSent(false);
                          setOtpValue('');
                          sessionStorage.removeItem('checkoutVerificationToken');
                          clearCheckoutVerificationToken?.();
                        }}
                        className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {/* OTP entry — only shown after send, before verified */}
                  {otpSent && !guestEmailVerified && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code sent to{' '}
                        <span className="font-semibold text-gray-700">
                          {formData.contactEmail}
                        </span>
                      </p>

                      {/* OTP input + Verify in one row */}
                      <div className="flex items-center gap-2">
                        <input
                          value={otpValue}
                          onChange={(event) => {
                            setOtpValue(event.target.value.replace(/\D/g, '').slice(0, 6));
                            setOtpError('');
                          }}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="• • • • • •"
                          className="
                            w-full rounded-xl border border-gray-200 px-4 py-3
                            text-center text-lg font-semibold tracking-[0.4em]
                            outline-none transition focus:border-gray-800
                            focus:ring-2 focus:ring-gray-800/10
                          "
                        />
                        <CommonButton
                          variant={6}
                          type="button"
                          disabled={otpLoading || otpValue.length < 6}
                          className="h-[50px] flex-shrink-0 px-5"
                          onClick={handleVerifyOtp}
                        >
                          {otpLoading ? '…' : 'Verify'}
                        </CommonButton>
                      </div>

                      {/* Resend countdown */}
                      <p className="text-xs text-gray-400">
                        {resendCountdown > 0 ? (
                          <>Resend available in <span className="font-semibold text-gray-600">{resendCountdown}s</span></>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading}
                            className="font-semibold text-gray-700 underline hover:text-gray-900 disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Errors */}
                  {(contactError || otpError) && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                      <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      </svg>
                      {contactError || otpError}
                    </p>
                  )}
                </div>
              </SectionCard>
            )}


            {/* Steps 2 & 3 – Shipping + Billing (hidden until contact verified) */}
            <div className={canShowCheckoutForms ? '' : 'hidden'}>
              {/* Shipping */}
              <SectionCard
                step="2"
                title={checkout.shippingAddress || 'Shipping Address'}
              >
                <AddressSelector
                  addresses={shippingAddresses}
                  selectedId={selectedShippingId}
                  onSelect={applyShippingAddress}
                  onNewAddress={clearShippingAddress}
                  label="shipping"
                />
                {showShippingForm && (
                  <AddressForm
                    prefix="shipping"
                    formData={formData}
                    onChange={handleChange}
                    stateList={shippingStateList}
                    checkout={checkout}
                  />
                )}
                {!showShippingForm &&
                  selectedShippingId &&
                  selectedShippingId !== 'new' && (
                    <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                      <p className="font-semibold text-gray-800">
                        {formData.shipping_firstName} {formData.shipping_lastName}
                      </p>
                      <p>{formData.shipping_streetAddress}</p>
                      <p>
                        {formData.shipping_city}, {formData.shipping_state}{' '}
                        {formData.shipping_postalCode}
                      </p>
                      <p>
                        {Country.getCountryByCode(formData.shipping_country)?.name}
                      </p>
                    </div>
                  )}
              </SectionCard>

              {/* Billing */}
              <SectionCard
                step="3"
                title={checkout.billingAddress || 'Billing Address'}
              >
                <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 transition hover:border-gray-400 has-[:checked]:border-gray-800 has-[:checked]:bg-gray-50">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="sameAsShipping"
                      checked={isSameAsShipping}
                      onChange={handleSameAsShippingChange}
                      className="sr-only peer"
                    />
                    <div className="h-5 w-9 rounded-full bg-gray-200 peer-checked:bg-gray-900 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {checkout.sameAsShippingAddress || 'Same as shipping address'}
                  </span>
                </label>

                {isSameAsShipping ? (
                  <p className="text-sm text-gray-400 px-1">
                    Your billing address matches your shipping address.
                  </p>
                ) : (
                  <>
                    <AddressSelector
                      addresses={billingAddresses}
                      selectedId={selectedBillingId}
                      onSelect={applyBillingAddress}
                      onNewAddress={clearBillingAddress}
                      label="billing"
                    />
                    {showBillingForm && (
                      <AddressForm
                        prefix="billing"
                        formData={formData}
                        onChange={handleChange}
                        stateList={billingStateList}
                        checkout={checkout}
                      />
                    )}
                    {!showBillingForm &&
                      selectedBillingId &&
                      selectedBillingId !== 'new' && (
                        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">
                            {formData.billing_firstName}{' '}
                            {formData.billing_lastName}
                          </p>
                          <p>{formData.billing_streetAddress}</p>
                          <p>
                            {formData.billing_city}, {formData.billing_state}{' '}
                            {formData.billing_postalCode}
                          </p>
                          <p>
                            {Country.getCountryByCode(formData.billing_country)?.name}
                          </p>
                        </div>
                      )}
                  </>
                )}
              </SectionCard>
            </div>

            {/* Apple Pay/Google Pay Fast Checkout Button (positioned under address fields) */}
            {fastCheckoutBrand && !isUserSignedIn() && (
              <div className="mt-4">
                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="mx-4 text-sm text-gray-500 font-semibold tracking-wider">OR</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                <CommonButton
                  variant={6}
                  type="button"
                  onClick={handleApplePayClick}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {fastCheckoutBrand === 'applePay' ? (
                    <>
                      <svg fill="currentColor" className="h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                      </svg>
                      <span>Fast Checkout with Apple Pay</span>
                    </>
                  ) : fastCheckoutBrand === 'googlePay' ? (
                    <>
                      <svg fill="currentColor" className="h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.09-5.142 4.09-3.3 0-5.98-2.68-5.98-5.98s2.68-5.98 5.98-5.98c1.5 0 2.87.55 3.94 1.45l3.07-3.07C19.14 3.2 15.96 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.79 0 10.24-4.11 10.24-10.24 0-.69-.06-1.35-.18-1.955H12.24z" />
                      </svg>
                      <span>Fast Checkout with Google Pay</span>
                    </>
                  ) : (
                    <>
                      <svg fill="currentColor" className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 10V3L4 14H11V21L20 10H13Z" />
                      </svg>
                      <span>Fast Checkout</span>
                    </>
                  )}
                </CommonButton>
              </div>
            )}

            {/* Submit block */}
            <div className={canShowCheckoutForms ? '' : 'hidden'}>
              <div className="pb-8">
                <CommonButton
                  variant={6}
                  disabled={loading}
                  type="submit"
                  className="w-full"
                >
                  {loading ? `${common.pleaseWait}…` : common.checkout}
                </CommonButton>
                <p className="mt-3 text-center text-xs text-gray-400">
                  Your payment is secured and encrypted
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: order summary ── */}
          <div className="w-full lg:w-[400px] lg:flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <SectionCard title="Order Summary">
                {OrderSummaryContent}
              </SectionCard>
            </div>
          </div>

        </div>
      </form>
    </>
  );
}
