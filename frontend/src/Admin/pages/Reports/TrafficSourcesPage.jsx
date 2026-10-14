import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Progress,
  Empty,
  Alert,
} from 'antd';
import {
  LuCompass,
  LuSearch,
  LuShare2,
  LuLink,
  LuPieChart,
  LuTrendingUp,
  LuTrendingDown,
  LuMinus,
  LuGlobe,
  LuInfo,
  LuEye,
  LuAward,
  LuLayers,
} from 'react-icons/lu';
import dayjs from 'dayjs';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton, ExportButton } from '../../UI/Buttons';
import Loading from '../../UI/Loading';
import DonutChart from '../../UI/charts/DonutChart';
import { getTrafficSources } from '../../../apis/admin/analytics';
import { exportToCsv } from '../../../utils/exportCsv';
import { cn } from '../../../utils/cn';

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

const CHANNEL_CONFIG = {
  Direct: {
    color: '#3B82F6',
    icon: <LuCompass size={16} className="text-blue-500" />,
    badgeBg: 'bg-blue-50 text-blue-600 border-blue-100',
    description: 'Direct visits, bookmarks & typed URLs',
  },
  Search: {
    color: '#10B981',
    icon: <LuSearch size={16} className="text-emerald-500" />,
    badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    description: 'Organic & paid search engines (Google, Bing, etc.)',
  },
  Social: {
    color: '#EC4899',
    icon: <LuShare2 size={16} className="text-pink-500" />,
    badgeBg: 'bg-pink-50 text-pink-600 border-pink-100',
    description: 'Social networks (Instagram, Facebook, TikTok, etc.)',
  },
  Referral: {
    color: '#F59E0B',
    icon: <LuLink size={16} className="text-amber-500" />,
    badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
    description: 'External websites and incoming backlinks',
  },
};

export default function TrafficSourcesPage() {
  const [rangeType, setRangeType] = useState('last30days');
  const [customDates, setCustomDates] = useState([
    dayjs().subtract(29, 'days').startOf('day'),
    dayjs().endOf('day'),
  ]);

  const queryParams = {
    rangeType,
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
    queryKey: ['traffic-sources', queryParams],
    queryFn: () => getTrafficSources(queryParams),
    refetchOnWindowFocus: false,
  });

  const totalVisits = Number(
    data?.totalVisits ??
    data?.summary?.totalVisits ??
    0
  );
  const distribution =
    data?.distribution ||
    data?.channels ||
    [];

  // Real database calculation of the 4 KPI card metrics
  const sortedChannels = [...distribution].sort(
    (a, b) => Number(b.visits || 0) - Number(a.visits || 0)
  );
  const topChannel = totalVisits > 0 ? sortedChannels.find((c) => Number(c.visits || 0) > 0) : null;
  const topSource = topChannel ? topChannel.channel : '—';
  const topSourceShare = topChannel && totalVisits > 0
    ? `${Number(topChannel.share || 0).toFixed(1)}%`
    : '0%';
  const trackedChannelsCount = distribution.filter(
    (c) => Number(c.visits || 0) > 0
  ).length;

  const handleRangeChange = (val) => {
    setRangeType(val);
  };

  const handleCustomDatesChange = (dates) => {
    setCustomDates(dates);
  };

  const handleExportCsv = () => {
    const exportHeaders = [
      { key: 'channel', label: 'Channel' },
      { key: 'visits', label: 'Visits' },
      { key: 'share', label: 'Share (%)' },
      { key: 'change', label: 'Period Change (%)' },
    ];

    exportToCsv(
      `traffic-sources-${rangeType}-${dayjs().format('YYYY-MM-DD')}`,
      distribution,
      exportHeaders
    );
  };

  const chartLabels = distribution.map((item) => item.channel);
  const chartValues = distribution.map((item) => Number(item.visits || 0));
  const chartColors = distribution.map(
    (item) => CHANNEL_CONFIG[item.channel]?.color || '#6B7280'
  );

  const customizeChartConfig = (options) => ({
    ...options,
    chart: {
      ...options.chart,
      fontFamily: 'inherit',
    },
    legend: {
      show: false, // We render a refined custom channel breakdown grid below the donut
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['#ffffff'],
    },
    plotOptions: {
      ...options.plotOptions,
      pie: {
        ...options.plotOptions?.pie,
        donut: {
          ...options.plotOptions?.pie?.donut,
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: '#6B7280',
              offsetY: -4,
            },
            value: {
              show: true,
              fontSize: '22px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: '#111827',
              offsetY: 6,
              formatter: (val) => Number(val || 0).toLocaleString(),
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 500,
              color: '#6B7280',
              formatter: function () {
                return Number(totalVisits || 0).toLocaleString();
              },
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${Number(val || 0).toLocaleString()} visits`,
      },
    },
  });

  const columns = [
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel) => {
        const config = CHANNEL_CONFIG[channel] || {
          color: '#6B7280',
          icon: <LuGlobe size={16} />,
          badgeBg: 'bg-gray-50 text-gray-600 border-gray-100',
          description: '',
        };
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
                config.badgeBg
              )}
            >
              {config.icon}
            </div>
            <div>
              <Text strong className="text-gray-900 text-sm block">
                {channel}
              </Text>
              {config.description && (
                <p className="text-xs text-gray-400 m-0 leading-tight">
                  {config.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Visits',
      dataIndex: 'visits',
      key: 'visits',
      width: 120,
      align: 'right',
      sorter: (a, b) => Number(a.visits || 0) - Number(b.visits || 0),
      render: (visits) => (
        <span className="font-bold text-gray-900 text-sm">
          {Number(visits || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Share',
      dataIndex: 'share',
      key: 'share',
      width: 110,
      align: 'right',
      sorter: (a, b) => Number(a.share || 0) - Number(b.share || 0),
      render: (share) => (
        <Tag color="blue" className="font-semibold text-xs px-2 py-0.5 rounded">
          {Number(share || 0).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: 'Change',
      dataIndex: 'change',
      key: 'change',
      width: 120,
      align: 'center',
      render: (change) => {
        const val = Number(change || 0);
        if (val > 0) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full">
              <LuTrendingUp size={12} />
              +{val.toFixed(1)}%
            </span>
          );
        }
        if (val < 0) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full">
              <LuTrendingDown size={12} />
              {val.toFixed(1)}%
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200/50 px-2 py-0.5 rounded-full">
            <LuMinus size={12} />
            0.0%
          </span>
        );
      },
    },
    {
      title: 'Distribution',
      key: 'distribution',
      width: 170,
      render: (_, record) => {
        const config = CHANNEL_CONFIG[record.channel] || { color: '#3B82F6' };
        return (
          <div className="w-full">
            <Progress
              percent={Number(record.share || 0)}
              strokeColor={config.color}
              trailColor="#f3f4f6"
              size="small"
              format={(percent) => (
                <span className="text-xs font-medium text-gray-600">{percent}%</span>
              )}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto min-h-screen pb-10">
      <PageTitle
        title="Traffic Sources"
        subtitle="Analyze storefront visitor acquisition channels and traffic distribution."
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
              disabled={!distribution.length}
            />
          </div>
        }
      />

      {isLoading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Total Visits */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Total Visits
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <LuEye size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl xl:text-3xl font-bold text-gray-900 tracking-tight">
                  {totalVisits.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-0">
                  Storefront visitor sessions
                </p>
              </div>
            </div>

            {/* KPI 2: Top Source */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Top Source
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <LuAward size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl xl:text-3xl font-bold text-gray-900 tracking-tight">
                  {topSource}
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-0">
                  {topChannel ? 'Leading acquisition channel' : 'No traffic recorded'}
                </p>
              </div>
            </div>

            {/* KPI 3: Top Source Share */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Top Source Share
                </span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <LuPieChart size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl xl:text-3xl font-bold text-gray-900 tracking-tight">
                  {topSourceShare}
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-0">
                  Share of all visitor traffic
                </p>
              </div>
            </div>

            {/* KPI 4: Tracked Channels */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Tracked Channels
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <LuLayers size={20} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl xl:text-3xl font-bold text-gray-900 tracking-tight">
                    {trackedChannelsCount}
                  </span>
                  <span className="text-xs font-medium text-gray-400">/ 4 total</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 mb-0">
                  Active channels with traffic
                </p>
              </div>
            </div>
          </div>

          {totalVisits === 0 && (
            <Alert
              message="No traffic data recorded for the selected date range"
              description="Storefront visitor traffic is captured in real-time as visitors arrive from Search, Social, Referral, and Direct channels. As real visitors browse the site, traffic distribution will appear here."
              type="info"
              showIcon
              icon={<LuInfo size={18} />}
              className="border-blue-100 bg-blue-50/60 rounded-xl"
            />
          )}

          {/* Main Analytics Layout: Side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left: Traffic Sources Analytics (Donut Chart) */}
            <div className="xl:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <LuPieChart size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 m-0">
                      Traffic Sources Analytics
                    </h3>
                    <p className="text-xs text-gray-400 m-0 mt-0.5">
                      Channel share of incoming visitor traffic
                    </p>
                  </div>
                </div>
                <Tag color="blue" className="font-semibold text-xs px-2.5 py-0.5 rounded-full border-0 bg-blue-50 text-blue-700">
                  {totalVisits.toLocaleString()} Total Visits
                </Tag>
              </div>

              {totalVisits > 0 ? (
                <div>
                  <div className="py-2">
                    <DonutChart
                      labels={chartLabels}
                      values={chartValues}
                      chartColors={chartColors}
                      className="h-[280px]"
                      setConfig={customizeChartConfig}
                    />
                  </div>

                  {/* Channel Breakdown Cards */}
                  <div className="grid grid-cols-2 gap-2.5 pt-4 mt-2 border-t border-gray-100">
                    {distribution.map((item) => {
                      const config = CHANNEL_CONFIG[item.channel] || {
                        color: '#6B7280',
                        icon: <LuGlobe size={14} />,
                      };
                      return (
                        <div
                          key={item.channel}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: config.color }}
                            />
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {item.channel}
                            </span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-gray-900 block">
                              {Number(item.visits || 0).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium">
                              {Number(item.share || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 m-0">
                          No traffic recorded for this period
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                          Storefront visitor sessions will automatically populate this chart as visitors arrive.
                        </p>
                      </div>
                    }
                  />
                </div>
              )}
            </div>

            {/* Right: Channel Performance Table */}
            <div className="xl:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <LuGlobe size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 m-0">
                      Channel Performance
                    </h3>
                    <p className="text-xs text-gray-400 m-0 mt-0.5">
                      Acquisition volume, market share, and distribution
                    </p>
                  </div>
                </div>
                <Tag color="green" className="font-semibold text-xs px-2.5 py-0.5 rounded-full border-0 bg-emerald-50 text-emerald-700">
                  Real Tracking Data
                </Tag>
              </div>

              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={distribution}
                  rowKey="channel"
                  bordered={false}
                  size="middle"
                  loading={isFetching}
                  pagination={false}
                  scroll={{ x: 540 }}
                  className="traffic-sources-table"
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="No channel performance data for this period"
                      />
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
