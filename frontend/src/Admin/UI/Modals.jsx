import { Modal } from 'antd';

export const confirmDelete = ({ title, content, onOk }) =>
  Modal.confirm({
    title,
    content,
    okButtonProps: { danger: true },
    okText: 'Delete',
    onOk,
  });
