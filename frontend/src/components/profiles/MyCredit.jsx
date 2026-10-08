import { useQuery } from '@tanstack/react-query';
import { getUserCredits, getUserCreditTransactions } from '../../apis/user/profile';
import { Input, message, Modal, Select, Table } from 'antd';
import { useState } from 'react';
import { applyGiftCard } from '../../apis/user/giftCard';
import { useTranslationContext } from '../../context/TranslationContext';
import { convertPrice, formatPrice, convertStoredPrice } from '../../utils/currency';
import { useCurrency } from '../../context/CurrencyContext';

export default function MyCredit() {
  const {
    content: { profile, common },
  } = useTranslationContext();
  const { currency, rates } = useCurrency();
  const [days, setDays] = useState('all');

  const Credit = useQuery({
    queryKey: ['credit'],
    queryFn: getUserCredits,
    retry: false,
  });

  const Transactions = useQuery({
    queryKey: ['credit-transactions', days],
    queryFn: () => getUserCreditTransactions(days),
    retry: false,
  });

  const [utils, setUtils] = useState({
    isOpen: false,
    giftCardCode: '',
    giftCardPass: '',
    isLoading: false,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const handleSubmit = async () => {
    if (!utils.giftCardCode) {
      return message.warning('Please enter gift card code');
    }
    if (!utils.giftCardPass) {
      return message.warning('Please enter gift card PIN');
    }
    updateUtils({ isLoading: true });
    try {
      const res = await applyGiftCard(
        utils.giftCardCode,
        utils.giftCardPass,
        currency,
        rates[currency]
      );
      message.success('Gift card added successfully');
      updateUtils({
        isOpen: false,
        giftCardCode: '',
        giftCardPass: '',
        isLoading: false,
      });
      updateUtils({ isLoading: false });
      Credit.refetch();
      Transactions.refetch();
    } catch (err) {
      updateUtils({ isLoading: false });
      console.error(err);
      message.error(err.response.data.message || 'Failed to add gift card');
    }
  };

  const columns = [
    {
      title: 'Serial No.',
      dataIndex: 'index',
      key: 'index',
      render: (text, record, index) => index + 1,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => {
        const isDeduction = record.type === 'Deduction';
        
        // Use convertStoredPrice for accurate conversion between stored currency and selected currency
        const displayAmount = convertStoredPrice(
          record.amountInCurrency || amount,
          record.currency || 'USD',
          currency,
          rates
        );
        
        return (
          <span className={isDeduction ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
            {isDeduction ? '-' : '+'}
            {formatPrice(displayAmount, currency)}
          </span>
        );
      },
    },
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      render: (order) => order?.orderId || 'N/A',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <>
      <Modal
        title={profile.addGiftCard}
        open={utils.isOpen}
        onCancel={() => updateUtils({ isOpen: false })}
        onOk={handleSubmit}
        okText={common.add}
        cancelText={common.cancel}
        okButtonProps={{
          loading: utils.isLoading,
          className: 'rounded-none bg-[#28120B] hover:bg-[#28120B] text-white',
          color: '#28120B',
        }}
        centered
        cancelButtonProps={{
          disabled: utils.isLoading,
          className: 'rounded-none',
        }}
        closable={!utils.isLoading}
        maskClosable={!utils.isLoading}
        width={400}
      >
        <div className="space-y-4 mt-8">
          <Input
            placeholder={profile.enterGiftCardCode}
            value={utils.giftCardCode}
            onChange={(e) => updateUtils({ giftCardCode: e.target.value })}
            className="rounded-none"
          />
          <Input
            placeholder={profile.entergiftCardPass}
            value={utils.giftCardPass}
            onChange={(e) => updateUtils({ giftCardPass: e.target.value })}
            className="rounded-none"
          />
        </div>
      </Modal>
      <div className="container p-4 mx-auto">
        <div className="flex sm:items-center sm:flex-row flex-col gap-2 justify-between">
          <div>
            <h2 className="text-3xl font-semibold mb-4">{profile.myCredit}</h2>
            <hr className="w-32 h-[2px] mb-6 bg-black" />
          </div>
          <button
            onClick={() =>
              updateUtils({
                isOpen: true,
                giftCardCode: '',
                giftCardPass: '',
                isLoading: false,
              })
            }
            className="px-6 py-1 mb-4 text-base text-black transition duration-300 border border-black hover:bg-black hover:text-white"
          >
            {profile.addGiftCard}
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">{profile.creditBalance}</h3>
            <span className="text-lg font-bold text-green-600">
              {formatPrice(convertPrice(Credit?.data?.credits || 0, currency, rates), currency)}
            </span>
          </div>
          <p className="text-gray-600">{profile.creditBalanceDescription}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Transaction History</h3>
            <Select
              defaultValue="all"
              style={{ width: 150 }}
              onChange={(value) => setDays(value)}
              options={[
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: 'all', label: 'All' },
              ]}
            />
          </div>
          <Table
            columns={columns}
            dataSource={Transactions.data || []}
            loading={Transactions.isLoading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        </div>
      </div>
    </>
  );
}
