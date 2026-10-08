import { useCurrency } from '../../context/CurrencyContext';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from '../../utils/currency';
import HeaderDropdown from './HeaderDropdown';

const CurrencyDropdown = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <HeaderDropdown
      label="Currency"
      value={currency}
      onChange={setCurrency}
      options={SUPPORTED_CURRENCIES.map((code) => ({
        value: code,
        label: CURRENCY_LABELS[code] || code,
      }))}
    />
  );
};

export default CurrencyDropdown;
