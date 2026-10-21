import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
} from 'lucide-react';
import { Table, Tag, Select, Button, Space, message } from 'antd';
import { RefreshButton } from '../../Admin/UI/Buttons';
import { getInfluencerOrdersApi } from '../../apis/influencer/client';

const InfluencerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await getInfluencerOrdersApi({
          page,
          limit: pagination.limit || 10,
          status: statusFilter || undefined,
        });

        if (res.success && res.data) {
          setOrders(res.data.orders || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        console.error('Failed to load attributed orders:', err);
        message.error('Failed to load attributed orders.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, pagination.limit]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const columns = useMemo(
    () => [
      {
        title: 'Order ID',
        dataIndex: 'orderId',
        key: 'orderId',
        render: (orderId, record) => (
          <div>
            <span className="font-mono font-bold text-gray-900">
              #{orderId || String(record._id).slice(-8)}
            </span>
            <div className="text-[11px] text-gray-400">
              {record.products?.length || 1} product(s)
            </div>
          </div>
        ),
      },
      {
        title: 'Order Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-xs text-gray-600 font-medium">
            {date ? new Date(date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }) : '-'}
          </span>
        ),
      },
      {
        title: 'Order Amount',
        key: 'orderAmount',
        render: (_, record) => {
          const val = record.price?.total || record.amount || record.totalAmount || 0;
          return (
            <div>
              <span className="font-bold text-gray-900 text-sm">
                AED {Number(val).toFixed(2)}
              </span>
              <div className="text-[11px] text-gray-400">Net Checkout Total</div>
            </div>
          );
        },
      },
      {
        title: 'Shopper Discount (20%)',
        key: 'discount',
        render: (_, record) => {
          const disc = record.influencerDiscountAmount || 0;
          return (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              -AED {Number(disc).toFixed(2)}
            </span>
          );
        },
      },
      {
        title: 'Your Commission (10%)',
        key: 'commission',
        render: (_, record) => {
          const comm =
            record.influencerCommissionAmount ||
            Number(((record.price?.total || record.amount || 0) * 0.1).toFixed(2));
          return (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              +AED {Number(comm).toFixed(2)}
            </span>
          );
        },
      },
      {
        title: 'Order Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colorMap = {
            Complete: 'green',
            Processing: 'blue',
            Pending: 'gold',
            Cancelled: 'red',
          };
          return (
            <Tag color={colorMap[status] || 'default'} className="font-medium text-xs">
              {status || 'Pending'}
            </Tag>
          );
        },
      },
      {
        title: 'Commission Status',
        dataIndex: 'influencerCommissionStatus',
        key: 'influencerCommissionStatus',
        render: (commStatus, record) => {
          const isComplete = record.status === 'Complete' || record.status === 'Processing';
          const displayStatus = commStatus || (isComplete ? 'Earned' : 'Pending');
          const colorMap = {
            Earned: 'green',
            Pending: 'gold',
            Cancelled: 'red',
          };
          return (
            <Tag color={colorMap[displayStatus] || 'gold'} className="font-semibold text-xs">
              {displayStatus}
            </Tag>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Attributed Customer Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#8d6f30] text-xs font-semibold">
              {pagination.total} Orders
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time feed of purchases referred through your links or discount code.
          </p>
        </div>

        {/* Filter and Refresh */}
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-44"
            placeholder="All Order Statuses"
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Completed Orders', value: 'Complete' },
              { label: 'Processing Orders', value: 'Processing' },
              { label: 'Pending Orders', value: 'Pending' },
              { label: 'Cancelled Orders', value: 'Cancelled' },
            ]}
          />
          <RefreshButton onClick={() => fetchOrders(pagination.page)} isLoading={loading} />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-4 overflow-hidden">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey={(r) => r._id || r.orderId}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit || 10,
            total: pagination.total,
            onChange: (p) => fetchOrders(p),
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
          }}
          className="admin-clean-table"
        />
      </div>
    </div>
  );
};

export default InfluencerOrdersPage;
