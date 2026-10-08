import {
  LuBox,
  LuCreditCard,
  LuSearch,
  LuShoppingCart,
  LuUser,
} from 'react-icons/lu';
import { Link } from 'react-router-dom';
import LineChart from '../UI/charts/LineChart';
import PageTitle from '../UI/PageTitle';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../../apis/admin/dashboard';
import { useEffect, useState } from 'react';
import { Button, DatePicker, Select, Space } from 'antd';
import { RefreshButton } from '../UI/Buttons';
import Loading from '../UI/Loading';
import dayjs from 'dayjs';
import BarChart from '../UI/charts/BarChart';
import PieChart from '../UI/charts/PieChart';

const revenueData = [
  { month: 'Jan', revenue: 1000 },
  { month: 'Feb', revenue: 1500 },
  { month: 'Mar', revenue: 1200 },
  { month: 'Apr', revenue: 1800 },
  { month: 'May', revenue: 2000 },
  { month: 'Jun', revenue: 2400 },
];

const userData = [
  { month: 'Jan', users: 100 },
  { month: 'Feb', users: 150 },
  { month: 'Mar', users: 200 },
  { month: 'Apr', users: 180 },
  { month: 'May', users: 220 },
  { month: 'Jun', users: 250 },
];

const productData = [
  { category: 'Electronics', count: 120 },
  { category: 'Clothing', count: 80 },
  { category: 'Books', count: 60 },
  { category: 'Home', count: 40 },
  { category: 'Sports', count: 30 },
];

const chartColors = [
  'rgba(213, 240, 175)',
  'rgba(188, 141, 167)',
  'rgba(186, 237, 248)',
  'rgba(250, 230, 117)',
];

const RANGE_TYPE_OPTIONS = [
  { label: 'Months', value: 'month' },
  { label: 'Weeks', value: 'week' },
  { label: 'Days', value: 'date' },
];
const MAX_RANGE_UNITS = 7;
const MAX_RANGE_OFFSET = MAX_RANGE_UNITS - 1;

const getRangeUnit = (rangeType) => (rangeType === 'date' ? 'day' : rangeType);

const getDefaultRange = (rangeType) => {
  const unit = getRangeUnit(rangeType);
  switch (rangeType) {
    case 'date':
      return [dayjs().subtract(6, 'days').startOf('day'), dayjs().endOf('day')];
    case 'week':
      return [dayjs().subtract(5, 'weeks').startOf('week'), dayjs().endOf('week')];
    case 'month':
    default:
      return [dayjs().subtract(5, 'months').startOf('month'), dayjs().endOf(unit)];
  }
};

const getPickerFormat = (rangeType) => {
  switch (rangeType) {
    case 'date':
      return 'DD MMM YYYY';
    case 'week':
      return 'DD MMM YYYY';
    case 'month':
    default:
      return 'MMM YYYY';
  }
};

const formatRangeSubtitle = (range = [], rangeType = 'month') => {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return '';
  }

  switch (rangeType) {
    case 'date':
      return range.map((item) => dayjs(item).format('DD MMM YYYY')).join(' - ');
    case 'week':
      return range
        .map((item) => dayjs(item).format('DD MMM YYYY'))
        .join(' - ');
    case 'month':
    default:
      return range.map((item) => dayjs(item).format('MMM YYYY')).join(' - ');
  }
};

const getPointDate = (item = {}) =>
  item.month || item.week || item.day || item.date || item.period || item.label;

const normalizeRange = (range = [], rangeType = 'month') => {
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return range;
  }

  const unit = getRangeUnit(rangeType);
  let [start, end] = range.map((item) => dayjs(item));

  if (end.isBefore(start)) {
    [start, end] = [end, start];
  }

  const normalizedStart = start.startOf(unit);
  let normalizedEnd = end.endOf(unit);

  if (normalizedEnd.diff(normalizedStart, unit) > MAX_RANGE_OFFSET) {
    normalizedEnd = normalizedStart.add(MAX_RANGE_OFFSET, unit).endOf(unit);
  }

  return [normalizedStart, normalizedEnd];
};

const getSequentialChartLabels = (series = [], rangeType = 'month') => {
  if (!Array.isArray(series) || series.length === 0) return [];

  return series.map((item) => {
    const dateValue = getPointDate(item);
    const date = dayjs(dateValue);
    
    if (!date.isValid()) return 'Unknown';

    switch (rangeType) {
      case 'date':
        return date.format('DD MMM');
      case 'week':
        return `Wk ${date.format('DD MMM')}`;
      case 'month':
      default:
        return date.format('MMM YYYY');
    }
  });
};

const getSeriesByType = (data, seriesName, rangeType) => {
  if (!data) return [];

  const candidateKeys = {
    revenue: [
      rangeType === 'date' ? 'revenueByDay' : null,
      rangeType === 'week' ? 'revenueByWeek' : null,
      rangeType === 'month' ? 'revenueByMonth' : null,
      'revenueByDate',
      'revenueByPeriod',
      'revenueByMonth',
      'revenueByWeek',
      'revenueByDay',
    ],
    users: [
      rangeType === 'date' ? 'usersByDay' : null,
      rangeType === 'week' ? 'usersByWeek' : null,
      rangeType === 'month' ? 'usersByMonth' : null,
      'usersByDate',
      'usersByPeriod',
      'usersByMonth',
      'usersByWeek',
      'usersByDay',
    ],
    orders: [
      rangeType === 'date' ? 'ordersByDay' : null,
      rangeType === 'week' ? 'ordersByWeek' : null,
      rangeType === 'month' ? 'ordersByMonth' : null,
      'ordersByDate',
      'ordersByPeriod',
      'ordersByMonth',
      'ordersByWeek',
      'ordersByDay',
    ],
  };

  const resolvedKey = candidateKeys[seriesName]
    ?.filter(Boolean)
    .find((key) => Array.isArray(data?.[key]));

  return resolvedKey ? data[resolvedKey] : [];
};

const filterSeriesByRange = (series = [], range = [], rangeType = 'month') => {
  if (!Array.isArray(series) || series.length === 0) return [];
  if (!Array.isArray(range) || range.length !== 2 || !range[0] || !range[1]) {
    return series;
  }

  const unit = getRangeUnit(rangeType);
  const [rangeStart, rangeEnd] = normalizeRange(range, rangeType);

  return series.filter((item) => {
    const pointValue = getPointDate(item);
    const pointDate = dayjs(pointValue);

    if (!pointDate.isValid()) return false;

    const pointStart = pointDate.startOf(unit);
    const pointEnd = pointDate.endOf(unit);

    return !pointEnd.isBefore(rangeStart) && !pointStart.isAfter(rangeEnd);
  });
};

export default function Dashboard() {
  const defaultRange = getDefaultRange('month');
  const [utils, setUtils] = useState({
    rangeType: 'month',
    dateRange: defaultRange,
    dateRangeToShow: defaultRange,
    calendarRange: defaultRange,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const Dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const normalizedRange = normalizeRange(utils.dateRange, utils.rangeType);

      const filters = {
        rangeType: utils.rangeType,
        dateRange: normalizedRange?.map((item) => item.toISOString()),
        monthRange:
          utils.rangeType === 'month'
            ? normalizedRange?.map((item) => item.toISOString())
            : undefined,
      };

      const res = await getDashboardData(filters);
      updateUtils({
        dateRange: normalizedRange,
        dateRangeToShow: normalizedRange,
        calendarRange: normalizedRange,
      });
      return res;
    },
    refetchOnWindowFocus: false,
    enabled: false,
  });

  useEffect(() => {
    Dashboard.refetch();
  }, []);

  const revenueSeries = getSeriesByType(
    Dashboard.data,
    'revenue',
    utils.rangeType
  );
  const userSeries = getSeriesByType(Dashboard.data, 'users', utils.rangeType);
  const orderSeries = getSeriesByType(
    Dashboard.data,
    'orders',
    utils.rangeType
  );
  const filteredRevenueSeries = filterSeriesByRange(
    revenueSeries,
    utils.dateRangeToShow,
    utils.rangeType
  );
  const filteredUserSeries = filterSeriesByRange(
    userSeries,
    utils.dateRangeToShow,
    utils.rangeType
  );
  const filteredOrderSeries = filterSeriesByRange(
    orderSeries,
    utils.dateRangeToShow,
    utils.rangeType
  );
  const revenueLabels = getSequentialChartLabels(
    filteredRevenueSeries,
    utils.rangeType
  );
  const userLabels = getSequentialChartLabels(
    filteredUserSeries,
    utils.rangeType
  );
  const orderLabels = getSequentialChartLabels(
    filteredOrderSeries,
    utils.rangeType
  );
  const activeAnchorDate = utils.calendarRange?.find(Boolean);

  const disableOutOfMaxRange = (current) => {
    if (!current || !activeAnchorDate) return false;

    const unit = getRangeUnit(utils.rangeType);
    const anchor = dayjs(activeAnchorDate).startOf(unit);
    const currentDate = dayjs(current).startOf(unit);

    return Math.abs(currentDate.diff(anchor, unit)) > MAX_RANGE_OFFSET;
  };

  return (
    <div className="container min-h-screen mx-auto">
      <PageTitle
        title="Dashboard"
        extra={
          <div className="flex items-end gap-2">
            <Space.Compact>
              <Select
                size="small"
                value={utils.rangeType}
                options={RANGE_TYPE_OPTIONS}
                onChange={(value) =>
                  updateUtils({
                    rangeType: value,
                    dateRange: getDefaultRange(value),
                    dateRangeToShow: getDefaultRange(value),
                    calendarRange: getDefaultRange(value),
                  })
                }
                disabled={Dashboard.isFetching}
                style={{ minWidth: 110 }}
              />
              <DatePicker.RangePicker
                format={getPickerFormat(utils.rangeType)}
                size="small"
                picker={utils.rangeType}
                value={utils.dateRange}
                disabledDate={disableOutOfMaxRange}
                onCalendarChange={(value) =>
                  updateUtils({ calendarRange: value || [] })
                }
                onChange={(value) =>
                  updateUtils({
                    dateRange: normalizeRange(value, utils.rangeType),
                    calendarRange: value || [],
                  })
                }
                disabled={Dashboard.isFetching}
              />
              <Button
                className="mt-0"
                type="primary"
                disabled={Dashboard.isFetching}
                onClick={Dashboard.refetch}
              >
                Apply
              </Button>
            </Space.Compact>
            <RefreshButton
              onClick={Dashboard.refetch}
              isLoading={Dashboard.isFetching}
            />
          </div>
        }
      />
      {Dashboard.isLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-2 mb-4">
            <Card
              title="Total Revenue"
              icon={<LuCreditCard size={24} color="rgb(143, 221, 33)" />}
              value={Dashboard.data?.totalRevenue || 0}
              suffix="AED"
              bgColor="rgba(213, 240, 175, 0.5)"
              moreInfoTo={'/admin/payment'}
            />
            <Card
              title="Total Orders"
              icon={<LuShoppingCart size={24} color="rgb(137, 54, 99)" />}
              value={Dashboard.data?.totalOrders || 0}
              moreInfoTo={'/admin/orders'}
              bgColor="rgba(188, 141, 167, 0.5)"
            />
            <Card
              title="Total Products"
              icon={<LuBox size={24} color="rgb(1, 151, 246)" />}
              value={Dashboard.data?.totalProducts || 0}
              moreInfoTo={'/admin/products'}
              color="rgb(104, 197, 219)"
              bgColor="rgba(186, 237, 248, 0.5)"
            />
            <Card
              title="Total Users"
              icon={<LuUser size={24} color="rgb(246, 170, 28)" />}
              value={Dashboard.data?.totalUsers || 0}
              moreInfoTo={'/admin/users'}
              bgColor="rgba(250, 230, 117, 0.5)"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-lg shadow-md card">
              <LineChart
                title="Revenue"
                subTitle={formatRangeSubtitle(
                  utils.dateRangeToShow,
                  utils.rangeType
                )}
                labels={revenueLabels}
                values={[
                  {
                    name: 'Revenue',
                    data: filteredRevenueSeries.map((item) => item.value),
                  },
                ]}
                area
                chartColors={chartColors}
              />
            </div>

            <div className="p-4 pb-8 border rounded-lg shadow-md card">
              <BarChart
                title="Users"
                subTitle={formatRangeSubtitle(
                  utils.dateRangeToShow,
                  utils.rangeType
                )}
                labels={userLabels}
                values={[
                  {
                    name: 'Users',
                    data: filteredUserSeries.map((item) => item.value),
                  },
                ]}
                chartColors={[chartColors[3]]}
              />
            </div>

            <div className="p-4 pb-8 border rounded-lg shadow-md card">
              <LineChart
                title="Orders"
                subTitle={formatRangeSubtitle(
                  utils.dateRangeToShow,
                  utils.rangeType
                )}
                labels={orderLabels}
                values={[
                  {
                    name: 'Orders',
                    data: filteredOrderSeries.map((item) => item.value),
                  },
                ]}
                markerSize={5}
                chartColors={[chartColors[2]]}
              />
            </div>

            <div className="p-4 pb-8 border rounded-lg shadow-md card">
              <PieChart
                title="Orders by status"
                labels={Dashboard.data?.orderByStatus?.map(
                  (item) => item.status
                )}
                values={Dashboard.data?.orderByStatus?.map(
                  (item) => item.count
                )}
                markerSize={5}
                chartColors={[
                  chartColors[3],
                  chartColors[2],
                  chartColors[0],
                  chartColors[1],
                ]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const Card = ({ title, icon, value, suffix, moreInfoTo, bgColor = '#aaa' }) => {
  return (
    <div className="p-4 border rounded-lg shadow-md card relative overflow-hidden">
      <div
        className="rotate-45 h-full w-[200%] z-[-1] absolute top-0"
        style={{ background: bgColor }}
      ></div>

      <div className="flex items-center gap-4 justify-between">
        <h3>{title}</h3>
        {icon}
      </div>
      <p className="flex items-end gap-2">
        <strong className="text-2xl font-bold">{value}</strong>
        <span className="text-sm text-gray-500">{suffix}</span>
      </p>
      {moreInfoTo && (
        <div className="flex mt-2">
          <Link to={moreInfoTo} className="text-sm text-blue-500">
            More Info
          </Link>
        </div>
      )}
    </div>
  );
};
