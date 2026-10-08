/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { Table, Button, Empty } from 'antd';
import { FaEye, FaExchangeAlt } from 'react-icons/fa';
import { TbGiftCard } from 'react-icons/tb';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../apis/user/order';
import { useState } from 'react';
import ParticularOrder from './ParticularOrder';
import { LuSearch } from 'react-icons/lu';
import Loading from '../../Admin/UI/Loading';
import { useTranslationContext } from '../../context/TranslationContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';

const RETURNABLE_STATUSES = ['delivered', 'completed'];

const MyOrders = () => {
  const {
    content: { profile, common },
  } = useTranslationContext();
  const { currency } = useCurrency();
  const [activeOrder, setActiveOrder] = useState(null);
  const [searchOrder, setSearchOrder] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const Orders = useQuery({
    queryKey: ['orders', pagination.current, pagination.pageSize, searchOrder],
    queryFn: () => getOrders({ 
      orderId: searchOrder, 
      page: pagination.current, 
      limit: pagination.pageSize 
    }),
    retry: false,
  });

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const columns = [
    {
      title: profile.orderId,
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId, record) => {
        const isGiftCard = record?.temp?.purchaseType === 'gift-card';
        return isGiftCard ? (
          <span className="font-bold text-orange-600 flex items-center gap-1">
            <TbGiftCard className="inline" /> GIFT CARD
          </span>
        ) : (
          orderId
        );
      },
    },
    {
      title: profile.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      width: 100,
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: profile.status,
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status, record) => {
        const isGiftCard = record?.temp?.purchaseType === 'gift-card';
        return isGiftCard ? '-' : status;
      },
    },
    {
      title: profile.paymentMethod,
      dataIndex: 'mode',
      key: 'mode',
      align: 'center',
      render: (mode, record) => {
        const creditApplied = record?.price?.creditApplied || 0;
        const amount = record?.amount || 0;
        const modeLabel = mode === 'cod' ? 'COD' : mode === 'card' ? 'Card' : mode;
        if (creditApplied > 0) {
          if (amount > 0) {
            return `Credits ${modeLabel === "credits"? "" : `+ ${modeLabel}`}`;
          }
          return 'Credits';
        }
        return modeLabel;
      },
    },
    {
      title: common.price,
      dataIndex: 'amount',
      key: 'amount',
      align: 'center',
      width: 150,
      render: (amount, record) => {
        const total = Number(record?.price?.total || record?.totalAmount || amount || 0);
        const payable = Number(record?.price?.payableTotal || record?.amountDueCOD || record?.amountPaidOnline || 0);
        const isCOD = record?.paymentMethod?.includes('cod') || record?.mode === 'cod';
        
        if (isCOD && payable > 0 && total !== payable) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-gray-400 line-through text-xs">
                {formatPrice(total, record?.currency || currency)}
              </span>
              <span className="text-red-600 font-bold text-sm whitespace-nowrap">
                Pay {formatPrice(payable, record?.currency || currency)} on delivery
              </span>
            </div>
          );
        } else if (isCOD && payable > 0 && total === payable) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-red-600 font-bold text-sm whitespace-nowrap">
                Pay {formatPrice(payable, record?.currency || currency)} on delivery
              </span>
            </div>
          );
        }

        const isPaid = record?.paymentStatus === 'Paid';

        return (
          <div className="flex flex-col items-center">
             <span className="font-semibold">
                {formatPrice(total, record?.currency || currency)}
              </span>
              <span className={`${isPaid ? 'text-green-600' : 'text-amber-500'} font-bold text-xs uppercase`}>
                {isPaid ? 'Paid' : 'Payment Pending'}
              </span>
          </div>
        );
      },
    },
    {
      title: profile.quantity,
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'center',
      width: 100,
    },
    {
      title: profile.action,
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => setActiveOrder(record)}
          icon={<FaEye />}
          title="View Order"
        />
      ),
    },
  ];

  return activeOrder ? (
    <ParticularOrder
      activeOrder={activeOrder}
      setActiveOrder={setActiveOrder}
    />
  ) : (
    <div className="container p-4 mx-auto">
      <div className="flex sm:items-center sm:flex-row flex-col gap-2 justify-between">
        <div>
          <h2 className="text-3xl font-semibold mb-4">{profile.myOrders}</h2>
          <hr className="w-32 h-[2px] mb-6 bg-black" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            Orders.refetch();
          }}
          className="flex items-center"
        >
          <input
            type="text"
            className="border p-2 border-black mb-0 flex-1"
            value={searchOrder || ''}
            onChange={(e) => setSearchOrder(e.target.value)}
          />
          <button
            type="submit"
            className="h-[41px] w-10 mb-[9px] border-l-0 border border-black flex items-center justify-center"
          >
            <LuSearch />
          </button>
        </form>
      </div>

      {Orders.isLoading ? (
        <Loading />
      ) : Orders.data?.data?.length === 0 ? (
        <Empty />
      ) : (
        <Table
          dataSource={Orders.data?.data}
          columns={columns}
          rowKey="_id"
          bordered
          onChange={handleTableChange}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: Orders.data?.pagination?.total || 0,
            showSizeChanger: true,
          }}
          scroll={{ x: 900 }}
          loading={Orders.isFetching}
        />
      )}
    </div>
  );
};

export default MyOrders;
