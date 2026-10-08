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
} from 'antd';
import {
  LuBox,
  LuEye,
  LuTrendingUp,
  LuLayers,
} from 'react-icons/lu';
import dayjs from 'dayjs';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton } from '../../UI/Buttons';
import Loading from '../../UI/Loading';
import { getViewPerformance } from '../../../apis/admin/analytics';
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

export default function ProductViewsPage() {
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
    queryKey: ['view-performance', queryParams],
    queryFn: () => getViewPerformance(queryParams),
    refetchOnWindowFocus: false,
  });

  const summary = data?.summary || {
    totalViews: 0,
    uniqueProductsCount: 0,
  };

  const mostViewedData = data?.mostViewed || [];
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
        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-purple-900 bg-purple-300 rounded-full shadow-sm">
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
            width={44}
            height={44}
            className="rounded border object-cover flex-shrink-0"
            preview={false}
          />
        ) : (
          <div className="w-11 h-11 bg-gray-100 border rounded flex items-center justify-center text-gray-400 flex-shrink-0">
            <LuBox size={20} />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <Text strong className="truncate max-w-[260px]" title={productName}>
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

  const columns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 65,
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
      title: 'Product Detail Views',
      dataIndex: 'views',
      key: 'views',
      width: 170,
      align: 'right',
      sorter: (a, b) => a.views - b.views,
      render: (views) => (
        <span className="font-semibold text-purple-700">
          {Number(views || 0).toLocaleString()} views
        </span>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (price) => (
        <span className="font-medium text-gray-800">
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
        <Tag color={status === 'Active' ? 'success' : status === 'Out of stock' ? 'warning' : 'default'}>
          {status || 'Active'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="container mx-auto min-h-screen pb-8">
      <PageTitle
        title="Most Viewed Products"
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
          <div className="grid lg:grid-cols-2 sm:grid-cols-2 grid-cols-1 gap-3 mb-6">
            <SummaryCard
              title="Total Product Detail Page Views"
              icon={<LuEye size={22} color="rgb(137, 54, 99)" />}
              value={Number(summary.totalViews || 0).toLocaleString()}
              suffix="Views"
              bgColor="rgba(188, 141, 167, 0.5)"
            />
            <SummaryCard
              title="Unique Products Viewed"
              icon={<LuLayers size={22} color="rgb(1, 151, 246)" />}
              value={Number(summary.uniqueProductsCount || 0).toLocaleString()}
              suffix="Products"
              bgColor="rgba(186, 237, 248, 0.5)"
            />
          </div>

          {/* Ranking Table */}
          <div className="p-4 bg-white shadow-md rounded-lg border border-gray-100 overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded">
                  <LuTrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 m-0">
                    Most Viewed Products
                  </h3>
                  <p className="text-xs text-gray-400 m-0">
                    Ranked by Total Product Detail Page Visits (DESC)
                  </p>
                </div>
              </div>
              <Tag color="purple">Ranked by Views</Tag>
            </div>

            <Table
              columns={columns}
              dataSource={mostViewedData}
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
                    description="No product views recorded for this period"
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
