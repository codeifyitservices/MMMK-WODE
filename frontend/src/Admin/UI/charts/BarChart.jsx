import Chart from './ApexChart';
import { Empty } from 'antd';
import { cn } from '../../../utils/cn';

export default function BarChart({
  chartProps,
  className,
  values,
  labels,
  setConfig,
  title,
  subTitle,
  chartColors,
  labelType = 'Category',
  stacked = false,
}) {
  const color = '#111';
  const xColors = new Array(labels?.length || 0).fill(color);
  const legendColors = new Array(values?.length || 0).fill(color);

  const chartOptions = {
    // title: {
    //   text: title,
    //   align: "center",
    //   style: {
    //     color,
    //     fontWeight: "light",
    //   },
    // },
    chart: {
      type: 'bar',
      stacked: stacked,
      toolbar: {
        show: labelType === 'datetime',
        offsetX: 0,
        offsetY: 0,
        tools: {
          download: false,
          selection: true,
          zoom: true, // Disable default zooming
          zoomin: true, // Enable zoom in button
          zoomout: true, // Enable zoom out button
          pan: true,
          reset: true | '<img src="/static/icons/reset.png" width="20">',
          customIcons: [],
        },
      },
      background: 'transparent',
      zoom: {
        enabled: true, // Disable zooming on scroll
        allowMouseWheelZoom: false,
      },
    },

    tooltip: {
      style: {
        fontSize: '14px',
        colors: [color],
      },
    },
    xaxis: {
      labels: {
        style: {
          colors: xColors,
        },
      },
      type: labels?.length ? labelType : 'category', // Avoid datetime type if labels are empty
      categories: labels,
    },
    yaxis: {
      decimalsInFloat: 0,
      labels: {
        formatter: (val) => Math.round(val),
        style: {
          colors: xColors,
        },
      },
    },
    legend: {
      labels: {
        colors: legendColors,
      },
    },
    dataLabels: { enabled: false },
    grid: {
      show: true,
      borderColor: '#eee',
      //   strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  return (
    <div
      className={cn(
        `w-full pt-4 h-[calc(50vh-95px)] ${
          values?.length == 0 && 'flex justify-center items-center'
        }`,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="opacity-50 text-xs">{subTitle}</span>
      </div>
      {values?.length == 0 ? (
        <Empty />
      ) : (
        <Chart
          options={setConfig ? setConfig(chartOptions) : chartOptions}
          series={values || []}
          type="bar"
          height={'100%'}
          width={'100%'}
          {...chartProps}
        />
      )}
    </div>
  );
}
