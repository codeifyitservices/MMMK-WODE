import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllAbandonedCarts, getAbandonedCartStats } from '../../../apis/admin/abandonedCart';
import { Table, Tag, Card, Row, Col, Select, Input, Button, Statistic } from 'antd';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton, ViewButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import AbandonedCartDetailDrawer from './AbandonedCartDetailDrawer';
import { tablePageSizes } from '../../../utils/staticData';
import { ShoppingBag, TrendingUp, DollarSign, Gift, Clock, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function AbandonedCartPage() {
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const [search, setSearch] = useState({ searchKey: null, searchValue: null });
  const [filters, setFilters] = useState({ status: 'ALL', stage: 'ALL' });
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });

  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  // Query for abandoned carts list
  const cartsQuery = useQuery({
    queryKey: ['abandoned-carts', search, filters, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllAbandonedCarts({
        ...search,
        ...filters,
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize,
      });
      updatePagination({ total: res?.total || 0 });
      return res;
    },
  });

  // Query for KPI statistics
  const statsQuery = useQuery({
    queryKey: ['abandoned-cart-stats'],
    queryFn: () => getAbandonedCartStats(),
  });

  const stats = statsQuery.data?.data || {};

  const handleViewDetail = (record) => {
    setSelectedRecordId(record._id);
    setIsDrawerVisible(true);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'RECOVERED':
        return <Tag color="green">Recovered</Tag>;
      case 'ACTIVE':
        return <Tag color="blue">Active Cart</Tag>;
      case 'IDLE':
        return <Tag color="gold">Idle (2h+)</Tag>;
      case 'ABANDONED':
        return <Tag color="orange">Abandoned</Tag>;
      case 'CANCELLED':
        return <Tag color="default">Emptied</Tag>;
      case 'EXPIRED':
        return <Tag color="red">Expired</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getStageTag = (stage, record) => {
    if (record?.status === 'RECOVERED') {
      return <Tag color="green">Recovered Order</Tag>;
    }
    switch (stage) {
      case '6H':
        return <Tag color="cyan">Stage 1 (6h Sent)</Tag>;
      case '12H':
        return <Tag color="blue">Stage 2 (12h Sent)</Tag>;
      case '24H':
        return <Tag color="purple">Stage 3 (Coupon Sent)</Tag>;
      case '48H':
        return <Tag color="magenta">Stage 4 (Final Sent)</Tag>;
      case 'IDLE':
        return <Tag color="gold">Idle (Waiting 6h)</Tag>;
      case 'ACTIVE':
        return <Tag color="processing">Active (&lt;2h)</Tag>;
      default:
        return <Tag>{stage || '—'}</Tag>;
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'S/N',
        dataIndex: 'index',
        key: 'index',
        render: (_, __, index) =>
          (pagination.currentPage - 1) * pagination.pageSize + index + 1,
        width: 60,
        align: 'center',
      },
      {
        title: 'Customer',
        key: 'customer',
        render: (_, record) => (
          <div>
            <div className="font-semibold text-[#28120b]">
              {record.user?.firstName
                ? `${record.user.firstName} ${record.user.lastName || ''}`
                : 'Customer'}
            </div>
            <div className="text-xs text-[#8b5e4b]">{record.email}</div>
          </div>
        ),
      },
      {
        title: 'Cart Items',
        key: 'items',
        render: (_, record) => {
          const items = record.cartSnapshot || [];
          const count = record.totalQuantity || items.length;
          return (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 overflow-hidden">
                {items.slice(0, 3).map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image || '/Wode%20Logo.png'}
                    alt={item.name}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-gray-100"
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-[#635d4a]">
                {count} item{count !== 1 ? 's' : ''}
              </span>
            </div>
          );
        },
      },
      {
        title: 'Cart Value',
        dataIndex: 'cartValue',
        key: 'cartValue',
        align: 'right',
        render: (value, record) => (
          <span className="font-bold text-[#28120b]">
            {record.currency || 'AED'} {(value || 0).toFixed(2)}
          </span>
        ),
      },
      {
        title: 'Last Activity',
        dataIndex: 'lastActivityAt',
        key: 'lastActivityAt',
        render: (date) => (
          <span className="text-xs text-[#635d4a]">
            {date ? dayjs(date).format('DD MMM YYYY, hh:mm A') : '—'}
          </span>
        ),
      },
      {
        title: 'Recovery Stage',
        key: 'stage',
        align: 'center',
        render: (_, record) => getStageTag(record.currentStage, record),
      },
      {
        title: 'Coupon & Claim',
        key: 'coupon',
        align: 'center',
        render: (_, record) => {
          if (!record.couponCode) return <span className="text-gray-300">—</span>;
          return (
            <div>
              <Tag color="purple" className="font-mono text-xs mb-1">
                {record.couponCode}
              </Tag>
              <div>
                {record.isClaimed ? (
                  <Tag color="green" className="text-[10px]">Claimed</Tag>
                ) : (
                  <Tag color="orange" className="text-[10px]">Unclaimed</Tag>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status) => getStatusTag(status),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        width: 80,
        render: (_, record) => (
          <ViewButton onClick={() => handleViewDetail(record)} tooltip="View Details" />
        ),
      },
    ],
    [pagination.currentPage, pagination.pageSize]
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title="Abandoned Cart Recovery"
        subTitle="Track, analyze and recover abandoned customer carts via 6h / 12h / 24h coupon / 48h sequences."
      >
        <RefreshButton
          onClick={() => {
            cartsQuery.refetch();
            statsQuery.refetch();
          }}
          loading={cartsQuery.isFetching}
        />
      </PageTitle>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-[#ded7d1]">
            <Statistic
              title={<span className="text-xs uppercase tracking-wider text-[#8b5e4b] font-semibold">Total Carts Tracked</span>}
              value={stats.totalCarts || 0}
              prefix={<ShoppingBag size={18} className="text-[#28120b] mr-2 inline" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-[#ded7d1]">
            <Statistic
              title={<span className="text-xs uppercase tracking-wider text-[#8b5e4b] font-semibold">Recovery Rate</span>}
              value={stats.recoveryRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#3f8600' }}
              prefix={<TrendingUp size={18} className="text-green-600 mr-2 inline" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-[#ded7d1]">
            <Statistic
              title={<span className="text-xs uppercase tracking-wider text-[#8b5e4b] font-semibold">Recovered Revenue</span>}
              value={stats.recoveredRevenue || 0}
              prefix="AED "
              precision={2}
              valueStyle={{ color: '#28120b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-[#ded7d1]">
            <Statistic
              title={<span className="text-xs uppercase tracking-wider text-[#8b5e4b] font-semibold">Coupons Claimed</span>}
              value={stats.couponsClaimed || 0}
              prefix={<Gift size={18} className="text-purple-600 mr-2 inline" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter and Table Toolbar */}
      <Card className="shadow-sm border-[#ded7d1]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInTable
              placeholder="Search by customer, email or coupon code..."
              onSearch={(value) => setSearch({ searchValue: value })}
              className="w-72"
            />
            <Select
              defaultValue="ALL"
              value={filters.status}
              onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
              style={{ width: 150 }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Cart' },
                { value: 'IDLE', label: 'Idle / Abandoned' },
                { value: 'RECOVERED', label: 'Recovered' },
                { value: 'CANCELLED', label: 'Cancelled / Emptied' },
              ]}
            />
            <Select
              defaultValue="ALL"
              value={filters.stage}
              onChange={(stage) => setFilters((prev) => ({ ...prev, stage }))}
              style={{ width: 170 }}
              options={[
                { value: 'ALL', label: 'All Stages' },
                { value: '6H', label: 'Stage 1 (6h Sent)' },
                { value: '12H', label: 'Stage 2 (12h Sent)' },
                { value: '24H', label: 'Stage 3 (Coupon Sent)' },
                { value: '48H', label: 'Stage 4 (Final Sent)' },
              ]}
            />
          </div>
        </div>

        {/* Abandoned Carts Table */}
        <Table
          columns={columns}
          dataSource={cartsQuery.data?.data || []}
          rowKey="_id"
          loading={cartsQuery.isLoading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.total,
            pageSizeOptions: tablePageSizes,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              updatePagination({ currentPage: page, pageSize });
            },
          }}
          className="overflow-x-auto"
        />
      </Card>

      {/* Abandoned Cart Detail Drawer */}
      <AbandonedCartDetailDrawer
        visible={isDrawerVisible}
        recordId={selectedRecordId}
        onClose={() => {
          setIsDrawerVisible(false);
          setSelectedRecordId(null);
        }}
      />
    </div>
  );
}
