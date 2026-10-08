import { Modal } from 'antd';
import { BsCreditCard2Front, BsCashCoin } from 'react-icons/bs';
import { LuArrowRight, LuLock } from 'react-icons/lu';
import { useGlobalContext } from '../../context/GlobalProvider';

const PaymentModal = ({
  visible,
  onClose,
  onSelectPayment,
  checkout,
  canUseTabby = true,
}) => {
  const { detectedCountry } = useGlobalContext();
  const tabbyCountries = ['AE', 'SA', 'KW', 'BH', 'EG', 'IN'];
  const isTabbyCountry =
    !detectedCountry || tabbyCountries.includes(detectedCountry);

  const allOptions = [
    {
      id: 'card',
      label: checkout?.payWithCard || 'Pay Online',
      description:
        checkout?.cardPaymentDescription ||
        'Visa, Mastercard, Amex, Apple Pay etc.',
      icon: <BsCreditCard2Front size={20} />,
      iconBg: 'bg-gray-900',
      iconColor: 'text-white',
    },
    // {
    //   id: 'tabby',
    //   label:
    //     checkout?.payLaterWithTabby ||
    //     checkout?.payWithTabby ||
    //     'Pay later with Tabby',
    //   description: canUseTabby
    //     ? checkout?.tabbyDescription ||
    //       checkout?.tabbyPaymentDescription ||
    //       '4 interest-free payments'
    //     : checkout?.tabbySignInDescription || 'Sign in to use Tabby',
    //   icon: <span className="text-[11px] font-black tracking-tight">tabby</span>,
    //   iconBg: 'bg-[#3efad9]',
    //   iconColor: 'text-black',
    //   allowed: isTabbyCountry,
    //   disabled: !canUseTabby,
    // },
    {
      id: 'cod',
      label: checkout?.cashOnDelivery || 'Cash on delivery',
      description: checkout?.codPaymentDescription || 'Pay when your order arrives',
      icon: <BsCashCoin size={20} />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-700',
    },
  ];

  const options = allOptions.filter((option) => option.allowed !== false);

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      className="checkout-payment-modal"
      styles={{ content: { padding: 0, borderRadius: 20, overflow: 'hidden' } }}
    >
      <div className="px-7 pb-5 pt-7">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
          {checkout?.secureCheckout || 'Secure checkout'}
        </p>
        <h3 className="text-[22px] font-semibold text-gray-900">
          {checkout?.chooseHowToPay || 'How would you like to pay?'}
        </h3>
      </div>

      <div className="flex flex-col gap-2.5 px-7 pb-7">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => !option.disabled && onSelectPayment(option.id)}
            disabled={option.disabled}
            className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-left transition-all duration-150 hover:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70"
          >
            <span
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${option.iconBg} ${option.iconColor}`}
            >
              {option.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-gray-900">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-400">
                {option.description}
              </span>
            </span>
            <LuArrowRight
              size={16}
              className="flex-shrink-0 text-gray-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-600"
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-gray-100 px-7 py-3.5">
        <LuLock size={11} className="text-gray-300" />
        <span className="text-[11px] text-gray-400">
          {checkout?.sslEncrypted || '256-bit SSL encrypted - your data is safe'}
        </span>
      </div>
    </Modal>
  );
};

export default PaymentModal;
