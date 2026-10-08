import { useEffect, useRef } from 'react';
import ApexCharts from 'apexcharts';

const mergeOptions = (base, override) => {
  const result = { ...(base || {}) };

  Object.keys(override || {}).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = override[key];

    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === 'object' &&
      typeof overrideValue === 'object' &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = mergeOptions(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  });

  return result;
};

export default function ApexChart({
  options = {},
  series = [],
  type = 'line',
  width = '100%',
  height = 'auto',
  ...props
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const chartOptions = mergeOptions(options, {
      chart: { type, width, height },
      series,
    });

    chartRef.current = new ApexCharts(containerRef.current, chartOptions);
    chartRef.current.render();

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.updateOptions(
      mergeOptions(options, {
        chart: { type, width, height },
        series,
      }),
      false,
      true
    );
  }, [height, options, series, type, width]);

  return <div ref={containerRef} {...props} />;
}
