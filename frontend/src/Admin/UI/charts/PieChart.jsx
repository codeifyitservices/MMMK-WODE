import Chart from './ApexChart';
import { cn } from '../../../utils/cn';

export default function PieChart({
  chartProps,
  className,
  values,
  labels,
  setConfig,
  chartColors = [],
  title,
  subTitle,
  showAsPercentage = false,
}) {
  const color = '#111';

  const legendColors = new Array(labels?.length || 0).fill(color);

  const chartOptions = {
    labels,
    // title: {
    //   text: title,
    //   align: "center",
    //   style: {
    //     color,
    //     fontWeight: "light",
    //   },
    // },
    chart: {
      type: 'pie',
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    tooltip: {
      style: {
        fontSize: '14px',
      },
    },
    colors: chartColors.length == 0 ? [] : chartColors,
    legend: {
      show: false,
      position: 'bottom',
      labels: {
        colors: legendColors,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(1)}%`,
      style: {
        colors: ['#fff'],
      },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        dataLabels: {
          offset: 0,
        },
      },
    },
    stroke: {
      show: false,
    },
  };

  return (
    <div className={cn('w-full py-4 pb-0', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="opacity-50 text-xs">{subTitle}</span>
      </div>
      <Chart
        options={setConfig ? setConfig(chartOptions) : chartOptions}
        series={values || []}
        type="pie"
        height={220}
        {...chartProps}
      />
    </div>
  );
}
