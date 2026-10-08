import Chart from './ApexChart';
import { cn } from '../../../utils/cn';

export default function DonutChart({
  chartProps,
  className,
  values,
  labels,
  setConfig,
  chartColors = [],
  title,
}) {
  const color = '#111';

  const legendColors = new Array(labels?.length || 0).fill(color);

  const chartOptions = {
    labels,
    title: {
      text: title,
      align: 'center',
      style: {
        color,
        fontWeight: 'light',
      },
    },
    chart: {
      type: 'donut',
      toolbar: {
        show: false,
      },
      background: 'transparent',
    },
    tooltip: {
      style: {
        fontSize: '14px',
        color: '#fff',
      },
    },
    colors: chartColors.length == 0 ? [] : chartColors,
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: legendColors,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff'],
      },
      textAnchor: 'middle',
      distributed: true,
      offsetX: 100,
      offsetY: 10,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '50%',
          borderWidth: 0,
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 700,
              color,
              formatter: function (w) {
                return Number(
                  w.globals.seriesTotals.reduce((a, b) => {
                    return a + b;
                  }, 0)
                ).toFixed(2);
              },
            },
            value: {
              show: true,
              fontSize: '18px',
              fontWeight: 700,
              color,
            },
          },
        },
      },
    },
    stroke: {
      show: false,
    },
  };

  return (
    <div
      className={cn(
        'w-full flex justify-center items-center h-[calc(50vh-105px)] pt-4',
        className
      )}
    >
      <Chart
        options={setConfig ? setConfig(chartOptions) : chartOptions}
        series={values || []}
        type="donut"
        height={'100%'}
        {...chartProps}
      />
    </div>
  );
}
