import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Select,
  Input,
  message,
} from 'antd';
import {
  Coins,
  Search,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import { getAttributedOrdersAdmin } from '../../../apis/admin/influencerAdmin';

const InfluencerOrdersAdminPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getAttributedOrdersAdmin({
        page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
          });
        }
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load attributed orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.limit]);

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
        title: 'Customer',
        key: 'customer',
        render: (_, record) => (
          <div>
            <div className="font-medium text-gray-900">
              {record.userId?.fullName || record.shippingAddress?.fullName || 'Guest Customer'}
            </div>
            <div className="text-xs text-gray-500">
              {record.userId?.email || record.email || record.shippingAddress?.email || '-'}
            </div>
          </div>
        ),
      },
      {
        title: 'Attributed Influencer',
        key: 'influencer',
        render: (_, record) => (
          <div>
            <div className="font-semibold text-gray-900">
              {record.influencerId?.fullName || 'MMMK Partner'}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-mono text-[11px] font-bold text-[#b8860b] bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {record.influencerCode || record.influencerId?.referralCode || '-'}
              </span>
            </div>
          </div>
        ),
      },
      {
        title: 'Order Value',
        key: 'amount',
        render: (_, record) => {
          const val = record.price?.total || record.amount || record.totalAmount || 0;
          return <span className="font-bold text-gray-900">AED {Number(val).toFixed(2)}</span>;
        },
      },
      {
        title: 'Customer 20% Discount',
        key: 'discount',
        render: (_, record) => {
          const discount =
            record.influencerDiscountAmount ||
            record.price?.influencerDiscount ||
            0;
          return (
            <span className="text-[#b8860b] font-medium">
              -AED {Number(discount).toFixed(2)}
            </span>
          );
        },
      },
      {
        title: 'Influencer 10% Commission',
        key: 'commission',
        render: (_, record) => {
          const comm =
            record.influencerCommissionAmount ||
            ((record.price?.total || record.amount || 0) * 0.1);
          return (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Coins size={13} />
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
          const colors = {
            Complete: 'green',
            Processing: 'blue',
            Pending: 'gold',
            Cancelled: 'red',
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        },
      },
      {
        title: 'Commission Status',
        dataIndex: 'influencerCommissionStatus',
        key: 'influencerCommissionStatus',
        render: (status, record) => {
          const colors = {
            Earned: 'green',
            Pending: 'gold',
            Paid: 'purple',
            Cancelled: 'red',
          };
          const displayStatus = status || (record.status === 'Complete' ? 'Earned' : 'Pending');
          return <Tag color={colors[displayStatus] || 'default'}>{displayStatus}</Tag>;
        },
      },
      {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-xs text-gray-500">
            {date ? new Date(date).toLocaleDateString() : '-'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <PageTitle
        title="Attributed Customer Orders"
        subtitle="Global monitor of customer sales generated by influencer links with commission & discount audits."
      />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-44"
            placeholder="All Order Statuses"
            options={[
              { value: '', label: 'All Order Statuses' },
              { value: 'Complete', label: 'Complete' },
              { value: 'Processing', label: 'Processing' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="w-full sm:w-80">
          <Input
            prefix={<Search size={14} className="text-gray-400 mr-1" />}
            placeholder="Search Order ID or Referral Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => fetchOrders(page),
            showSizeChanger: false,
          }}
        />
      </div>
    </div>
  );
};

export default InfluencerOrdersAdminPage;
