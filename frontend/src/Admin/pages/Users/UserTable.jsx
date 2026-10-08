import React, { useState } from 'react';
import { Table, Input, Button, Tag, Space, message, Popconfirm } from 'antd';
import { deleteUser } from '../../../apis/admin/user';

const UserTable = ({ data, tableQuery, setEditRow }) => {
  const [searchText, setSearchText] = useState('');

  const [filteredData, setFilteredData] = useState(data);

  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    const filtered = data.filter((item) =>
      Object.values(item).some((val) =>
        val.toString().toLowerCase().includes(text)
      )
    );
    setFilteredData(filtered);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success('User delete successfully');
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      title: 'SN',
      dataIndex: 'key',
      key: 'key',
      render: (_, __, index) => <strong>{index + 1}</strong>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => record?.firstName + record?.lastName,
    },
    {
      title: 'Phone Number',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Verified',
      dataIndex: 'verified',
      key: 'verified',
      render: (verified, record) =>
        record?.isVerified ? (
          <Tag color="green">Verified</Tag>
        ) : (
          <Tag color="red">Not Verified</Tag>
        ),
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: 'Date of Creation',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) =>
        date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
    },
    // {
    //   title: "Address",
    //   dataIndex: "address",
    //   key: "address",
    // },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {/* Edit Button */}
          <Button
            type="primary"
            onClick={() => {
              setEditRow(record);
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger type="primary">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
      }}
    >
      <div className="mb-4 flex justify-between">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={handleSearch}
          style={{
            width: '300px',
            borderRadius: '8px',
            border: '1px solid #d9d9d9',
            padding: '8px',
          }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={searchText ? filteredData : data}
        bordered
        pagination={{ pageSize: 10 }}
        style={{
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default UserTable;
