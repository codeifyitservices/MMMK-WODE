import { Spin } from 'antd';

export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Spin />
    </div>
  );
}
