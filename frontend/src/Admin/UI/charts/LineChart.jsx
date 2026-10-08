import Chart from './ApexChart';
import { cn } from '../../../utils/cn';

export default function LineChart({
  chartProps,
  className,
  values,
  labels,
  setConfig,
  title,
  subTitle,
  chartColors,
  curve = 'smooth',
  area = false,
  markerSize = 0,
  labelType = 'Category',
  showGrid = false,
  enableDateTime = false,
}) {
  const color = '#111';
  const xColors = new Array(labels?.length || 0).fill(color);
  const legendColors = new Array(values?.length || 0).fill(color);

  const chartOptions = {
    // title: {
    //   text: title,
    //   align: "left",
    //   style: {
    //     color,
    //     fontWeight: "light",
    //   },
    // },
    chart: {
      type: area ? 'area' : 'line',
      background: 'transparent',

      zoom: {
        enabled: true,
        type: 'x',
        allowMouseWheelZoom: false,
        autoScaleYaxis: true,
      },

      toolbar: {
        show: labelType === 'datetime',
        offsetX: 0,
        offsetY: 0,
        tools: {
          download: true,
          selection: true,
          zoom: true, // Disable default zooming
          zoomin: true, // Enable zoom in button
          zoomout: true, // Enable zoom out button
          pan: true,
          reset: true | '<img src="/static/icons/reset.png" width="20">',
          customIcons: [],
        },
      },

      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },

    tooltip: {
      style: {
        fontSize: '14px',
        colors: [color],
      },
    },
    colors: chartColors?.length == 0 ? [] : chartColors,
    xaxis: {
      ...(enableDateTime ? { type: 'datetime' } : {}),
      tickAmount: 12,
      labels: {
        style: {
          colors: xColors,
        },
      },
      type: labelType,
      categories: labels,
    },

    yaxis: {
      decimalsInFloat: 0,
      labels: {
        formatter: (val) => Math.round(val),
        style: {
          colors: [color],
        },
      },
    },
    legend: {
      labels: {
        colors: legendColors,
      },
    },
    stroke: {
      curve,
      width: 2,
    },
    markers: {
      size: markerSize,
    },
    dataLabels: { enabled: false },
    fill: {
      type: 'gradient',
      // gradient: {
      //   shadeIntensity: 1,
      //   opacityFrom: 0.8,
      //   opacityTo: 0.9,
      //   stops: [0, 100]
      // }
    },
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
    <div className={cn('w-full pt-4 relative h-[calc(50vh-95px)]', className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="opacity-50 text-xs">{subTitle}</span>
      </div>
      <Chart
        options={setConfig ? setConfig(chartOptions) : chartOptions}
        series={values || []}
        type={area ? 'area' : 'line'}
        height={'100%'}
        {...chartProps}
      />
    </div>
  );
}
