import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Image,
  Empty,
  Segmented,
} from 'antd';
import {
  LuBox,
  LuCreditCard,
  LuShoppingCart,
  LuTrendingUp,
  LuDollarSign,
  LuLayers,
} from 'react-icons/lu';
import dayjs from 'dayjs';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton } from '../../UI/Buttons';
import Loading from '../../UI/Loading';
import { getSalesPerformance } from '../../../apis/admin/analytics';
import { formatPrice } from '../../../utils/currency';
import { resolveAssetUrl } from '../../../utils/assetUrl';

const { Text } = Typography;

const RANGE_TYPE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Range', value: 'custom' },
];

export default function ProductPerformance() {
  const [metricView, setMetricView] = useState('sold'); // 'sold' or 'revenue'
  const [rangeType, setRangeType] = useState('last30days');
  const [customDates, setCustomDates] = useState([
    dayjs().subtract(29, 'days').startOf('day'),
    dayjs().endOf('day'),
  ]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
  });

  const queryParams = {
    rangeType,
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    startDate:
      rangeType === 'custom' && customDates?.[0]
        ? customDates[0].toISOString()
        : undefined,
    endDate:
      rangeType === 'custom' && customDates?.[1]
        ? customDates[1].toISOString()
        : undefined,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['sales-performance', queryParams],
    queryFn: () => getSalesPerformance(queryParams),
    refetchOnWindowFocus: false,
  });

  const summary = data?.summary || {
    totalUnitsSold: 0,
    totalRevenue: 0,
    validOrdersCount: 0,
  };

  const mostSoldData = data?.mostSold || [];
  const highestRevenueData = data?.highestRevenue || [];
  const totalItems = data?.pagination?.total || 0;

  const handleRangeChange = (val) => {
    setRangeType(val);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleCustomDatesChange = (dates) => {
    setCustomDates(dates);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-yellow-900 bg-yellow-400 rounded-full shadow-sm">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-800 bg-gray-300 rounded-full shadow-sm">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-amber-900 bg-amber-400 rounded-full shadow-sm">
          3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
        {rank}
      </span>
    );
  };

  const renderProductCell = (text, record) => {
    const productName =
      typeof record?.productName === 'object'
        ? record?.productName?.en || Object.values(record?.productName || {})[0] || 'Unknown Product'
        : record?.productName || 'Unknown Product';

    const categoryName =
      typeof record?.category === 'object'
        ? record?.category?.en || Object.values(record?.category || {})[0] || ''
        : record?.category || '';

    const imageUrl = record?.thumbnail || record?.image;

    return (
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <Image
            src={resolveAssetUrl(imageUrl)}
            alt={productName}
            width={46}
            height={46}
            className="rounded border object-cover flex-shrink-0"
            preview={false}
          />
        ) : (
          <div className="w-11 h-11 bg-gray-100 border rounded flex items-center justify-center text-gray-400 flex-shrink-0">
            <LuBox size={20} />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <Text strong className="truncate max-w-[320px]" title={productName}>
            {productName}
          </Text>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            {record?.sku && record.sku !== 'N/A' && (
              <span className="font-mono bg-gray-100 border px-1 py-0.2 rounded text-gray-600">
                {record.sku}
              </span>
            )}
            {categoryName && <span>{categoryName}</span>}
          </div>
        </div>
      </div>
    );
  };

  const isSoldView = metricView === 'sold';

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 70,
      align: 'center',
      render: (rank) => getRankBadge(rank),
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: renderProductCell,
    },
    {
      title: 'Units Sold',
      dataIndex: 'unitsSold',
      key: 'unitsSold',
      width: 150,
      align: 'right',
      sorter: (a, b) => a.unitsSold - b.unitsSold,
      render: (units) => (
        <span
          className={
            isSoldView
              ? 'font-bold text-emerald-700 text-sm'
              : 'font-medium text-gray-700'
          }
        >
          {Number(units || 0).toLocaleString()} pcs
        </span>
      ),
    },
    {
      title: 'Revenue Generated',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 180,
      align: 'right',
      sorter: (a, b) => a.revenue - b.revenue,
      render: (val) => (
        <span
          className={
            !isSoldView
              ? 'font-bold text-blue-700 text-sm'
              : 'font-medium text-gray-700'
          }
        >
          {formatPrice(val, 'AED')}
        </span>
      ),
    },
    {
      title: 'Catalog Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (price) => (
        <span className="text-gray-600">
          {formatPrice(price || 0, 'AED')}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status) => (
        <Tag
          color={
            status === 'Active'
              ? 'success'
              : status === 'Out of stock'
                ? 'warning'
                : 'default'
          }
        >
          {status || 'Active'}
        </Tag>
      ),
    },
  ];

  const currentTableData = isSoldView ? mostSoldData : highestRevenueData;

  return (
    <div className="container mx-auto min-h-screen pb-8">
      <PageTitle
        title="Product Performance"
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <Space.Compact size="small">
              <Select
                value={rangeType}
                options={RANGE_TYPE_OPTIONS}
                onChange={handleRangeChange}
                style={{ width: 140 }}
                disabled={isFetching}
              />
              {rangeType === 'custom' && (
                <DatePicker.RangePicker
                  size="small"
                  value={customDates}
                  onChange={handleCustomDatesChange}
                  disabled={isFetching}
                  format="DD MMM YYYY"
                />
              )}
            </Space.Compact>
            <RefreshButton onClick={() => refetch()} isLoading={isFetching} />
          </div>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3 mb-6">
            <SummaryCard
              title="Total Units Sold"
              icon={<LuShoppingCart size={22} color="rgb(137, 54, 99)" />}
              value={Number(summary.totalUnitsSold || 0).toLocaleString()}
              suffix="Units"
              bgColor="rgba(213, 240, 175, 0.5)"
            />
            <SummaryCard
              title="Total Product Revenue"
              icon={<LuCreditCard size={22} color="rgb(143, 221, 33)" />}
              value={formatPrice(summary.totalRevenue || 0, 'AED')}
              suffix=""
              bgColor="rgba(186, 237, 248, 0.5)"
            />
            <SummaryCard
              title="Valid Orders Contributing"
              icon={<LuLayers size={22} color="rgb(246, 170, 28)" />}
              value={Number(summary.validOrdersCount || 0).toLocaleString()}
              suffix="Orders"
              bgColor="rgba(250, 230, 117, 0.5)"
            />
          </div>

          {/* Table Container with Metric Toggle and Pagination */}
          <div className="p-4 bg-white shadow-md rounded-lg border border-gray-100 overflow-x-auto">
            {/* Header with Segmented Toggle */}
            <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded ${
                    isSoldView
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {isSoldView ? (
                    <LuTrendingUp size={18} />
                  ) : (
                    <LuDollarSign size={18} />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 m-0">
                    {isSoldView
                      ? 'Most Sold Products'
                      : 'Highest Revenue Products'}
                  </h3>
                  <p className="text-xs text-gray-400 m-0">
                    {isSoldView
                      ? 'Ranked by Total Units Sold (DESC)'
                      : 'Ranked by Total Revenue Generated (DESC)'}
                  </p>
                </div>
              </div>

              {/* Segmented Toggle Control */}
              <div className="flex items-center gap-2">
                <Segmented
                  size="middle"
                  value={metricView}
                  onChange={(val) => setMetricView(val)}
                  options={[
                    {
                      label: (
                        <div className="flex items-center gap-1.5 px-2 py-0.5">
                          <LuShoppingCart size={15} />
                          <span className="font-medium">Units Sold</span>
                        </div>
                      ),
                      value: 'sold',
                    },
                    {
                      label: (
                        <div className="flex items-center gap-1.5 px-2 py-0.5">
                          <LuCreditCard size={15} />
                          <span className="font-medium">Revenue</span>
                        </div>
                      ),
                      value: 'revenue',
                    },
                  ]}
                />
                <Tag color={isSoldView ? 'green' : 'blue'} className="ms-1">
                  {isSoldView ? 'Units View' : 'Revenue View'}
                </Tag>
              </div>
            </div>

            {/* Single Full-Width Table with Full Pagination */}
            <Table
              columns={columns}
              dataSource={currentTableData}
              rowKey="productId"
              bordered
              size="middle"
              loading={isFetching}
              pagination={{
                current: pagination.currentPage,
                pageSize: pagination.pageSize,
                total: totalItems,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} products`,
                onChange: (page, pageSize) => {
                  const actualPageSize = Number(pageSize);
                  const isPageSizeChanged =
                    actualPageSize !== pagination.pageSize;
                  setPagination({
                    currentPage: isPageSizeChanged ? 1 : page,
                    pageSize: !isNaN(actualPageSize)
                      ? actualPageSize
                      : pagination.pageSize,
                  });
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      isSoldView
                        ? 'No sales data recorded for this period'
                        : 'No revenue data recorded for this period'
                    }
                  />
                ),
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

const SummaryCard = ({ title, icon, value, suffix, bgColor = '#aaa' }) => {
  return (
    <div className="p-4 border rounded-lg shadow-md card relative overflow-hidden bg-white">
      <div
        className="rotate-45 h-full w-[200%] z-0 absolute top-0 left-0"
        style={{ background: bgColor }}
      />
      <div className="flex items-center gap-4 justify-between relative z-10">
        <h3 className="font-medium text-gray-700 m-0 text-sm">{title}</h3>
        {icon}
      </div>
      <p className="flex items-end gap-2 relative z-10 mt-2 mb-0">
        <strong className="text-2xl font-bold text-gray-900">{value}</strong>
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </p>
    </div>
  );
};
