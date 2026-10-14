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
} from 'react-icons/lu';
import dayjs from 'dayjs';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton, ExportButton } from '../../UI/Buttons';
import Loading from '../../UI/Loading';
import { getViewPerformance } from '../../../apis/admin/analytics';
import { formatPrice } from '../../../utils/currency';
import { resolveAssetUrl } from '../../../utils/assetUrl';
import { exportToCsv } from '../../../utils/exportCsv';

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

export default function MostViewedProductsPage() {
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

  const handleExportCsv = () => {
    const exportHeaders = [
      { key: 'rank', label: 'Rank' },
      { key: 'productNameFormatted', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'categoryFormatted', label: 'Category' },
      { key: 'views', label: 'Detail Views' },
      { key: 'price', label: 'Catalog Price (AED)' },
      { key: 'status', label: 'Status' },
    ];

    const exportRows = mostViewedData.map((item) => ({
      ...item,
      productNameFormatted:
        typeof item.productName === 'object'
          ? item.productName?.en || Object.values(item.productName || {})[0] || 'Unknown'
          : item.productName || 'Unknown',
      categoryFormatted:
        typeof item.category === 'object'
          ? item.category?.en || Object.values(item.category || {})[0] || ''
          : item.category || '',
    }));

    exportToCsv(
      `most-viewed-products-${rangeType}-${dayjs().format('YYYY-MM-DD')}`,
      exportRows,
      exportHeaders
    );
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
          <Text strong className="truncate max-w-[280px]" title={productName}>
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
      width: 180,
      align: 'right',
      sorter: (a, b) => a.views - b.views,
      render: (views) => (
        <span className="font-semibold text-purple-700 flex items-center justify-end gap-1.5">
          <LuEye size={15} />
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

  return (
    <div className="container mx-auto min-h-screen pb-8">
      <PageTitle
        title="Most Viewed Products"
        subTitle="Product detail page view metrics from real customer activity."
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
            <ExportButton
              onClick={handleExportCsv}
              disabled={!mostViewedData.length}
            />
          </div>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
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
                  Ranked by total real product detail page visits (DESC)
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
                  description="No product views recorded for the selected date range"
                />
              ),
            }}
          />
        </div>
      )}
    </div>
  );
}
