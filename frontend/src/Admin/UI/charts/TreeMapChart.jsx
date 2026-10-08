import Chart from './ApexChart';
import { cn } from '../../../utils/cn';

export default function TreeMapChart({
  chartProps,
  className,
  values,
  title,
  setConfig,
  chartColors = [],
}) {
  const color = '#111';

  const chartOptions = {
    title: {
      text: title,
      align: 'center',
      style: {
        color,
        fontWeight: 'light',
      },
    },
    chart: {
      type: 'treemap',
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} units`,
      },
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '14px',
      labels: {
        colors: ['#333'],
      },
      formatter: function (seriesName, opts) {
        const value =
          opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex];
        return `${seriesName}: ${value} units`;
      },
    },
    colors: chartColors.length == 0 ? [] : chartColors,
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
        useFillColorAsStroke: true,
        borderRadius: 0,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
      },
      formatter: (val, opts) => `${val}: ${opts.value}`,
    },
  };

  return (
    <div className={cn('w-full pt-4 px-3 h-[calc(50vh-95px)]', className)}>
      <Chart
        options={setConfig ? setConfig(chartOptions) : chartOptions}
        series={[{ data: values || [] }]}
        type="treemap"
        height={'90%'}
        {...chartProps}
      />
      <div className="flex items-center justify-center flex-wrap gap-4 mb-4">
        {values?.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-[14px] h-[14px] border border-white"
              style={{ backgroundColor: chartColors[index] }}
            ></div>
            <div className="text-sm whitespace-nowrap">{item.x}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
