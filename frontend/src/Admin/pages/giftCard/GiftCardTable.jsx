import { Table, Input, Tag, Button, Space, Popconfirm, message } from 'antd';
import { useState } from 'react';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { deleteGiftCard } from '../../../apis/admin/giftCard';

const GiftCardTable = ({ data, query, setEditedRow, setIsModalOpen }) => {
  const [searchText, setSearchText] = useState('');

  const handleDelete = async (id) => {
    try {
      await deleteGiftCard(id);
      message.success('Gift card deleted successfully');
      query.refetch();
    } catch (err) {
      
      message.error(
        err?.response?.data?.messsage || 'Gift card deleted successfully'
      );
    }
    setData(data.filter((item) => item.key !== key));
  };

  const handleEdit = (record) => {
    setEditedRow(record);
    setIsModalOpen(true);
  };

  const filteredData = data?.filter(
    (item) =>
      item?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item?.status?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sNo',
      key: 'sNo',
      width: 80,
      render: (_, __, index) => index + 1,
    },
    { title: 'Gift Card Name', dataIndex: 'name', key: 'name' },
    { title: 'Amount', dataIndex: 'value', key: 'value' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag
          color={
            status === 'active'
              ? 'green'
              : status === 'inactive'
                ? 'orange'
                : 'red'
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this item?"
            description="This action cannot be undone."
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record?._id)}
          >
            <Button type="primary" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Input
        className="mb-4 w-[250px] border-gray-300  p-2"
        placeholder="Search Gift Cards..."
        prefix={<SearchOutlined className="text-gray-400" />}
        onChange={(e) => setSearchText(e.target.value)}
      />
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{ pageSize: 5 }}
        className="border rounded-lg"
      />
    </div>
  );
};

export default GiftCardTable;
