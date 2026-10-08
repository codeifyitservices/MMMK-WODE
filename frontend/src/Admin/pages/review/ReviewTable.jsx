import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Input, Space, Popconfirm, message } from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { deleteReview } from '../../../apis/admin/review';

const ReviewTable = ({ data, tableQuery }) => {
  const handleDelete = async (id) => {
    try {
      await deleteReview(id);
      message.success('Product deleted successfully');
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'SNo',
        dataIndex: 'key',
        render: (text, record, index) => index + 1,
        width: 100,
      },
      {
        title: 'Product',
        dataIndex: 'product',
        render: (record, text) => record?.productName?.en,
        width: 150,
      },
      {
        title: 'User',
        dataIndex: 'user',
        render: (record, text) => record?.firstName,
        width: 150,
      },
      {
        title: 'Review',
        dataIndex: 'review',
        width: 150,
      },
      {
        title: 'Rating',
        dataIndex: 'rating',
        width: 120,
      },
      {
        title: 'Action',
        render: (_, record) => (
          <div className="flex gap-2">
            <Popconfirm
              title="Are you sure you want to delete this product?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                icon={<DeleteOutlined />}
                type="primary"
                danger
                size="small"
              >
                Delete
              </Button>
            </Popconfirm>
          </div>
        ),
        width: 200,
      },
    ],
    [data]
  );

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg overflow-x-auto">
      {/* Search Section */}
      <div className="mb-4 flex items-center">
        <Input
          placeholder="Search by Product, Category, or Status"
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-gray-300 rounded-md p-2 w-72"
          prefix={<SearchOutlined />}
        />
      </div>

      {/* Table Section */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="key"
        loading={tableQuery.isLoading}
        pagination={{
          pageSize: 10,
        }}
        bordered
        className="border border-gray-300 rounded-md"
        rowClassName="hover:bg-gray-50"
      />
    </div>
  );
};

export default ReviewTable;
