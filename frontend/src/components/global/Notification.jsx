import React from 'react';
import { Button, Divider, notification, Space } from 'antd';

const Notification = () => {
  const [api, contextHolder] = notification.useNotification();
  return <div>Notification</div>;
};

export default Notification;
