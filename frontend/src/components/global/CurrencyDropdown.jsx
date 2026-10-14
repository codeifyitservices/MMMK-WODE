import { useCurrency } from '../../context/CurrencyContext';
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from '../../utils/currency';
import HeaderDropdown from './HeaderDropdown';

const CurrencyDropdown = ({ theme = 'dark', className = '' }) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <HeaderDropdown
      label="Currency"
      value={currency}
      onChange={setCurrency}
      theme={theme}
      className={className}
      options={SUPPORTED_CURRENCIES.map((code) => ({
        value: code,
        label: CURRENCY_LABELS[code] || code,
      }))}
    />
  );
};

export default CurrencyDropdown;
