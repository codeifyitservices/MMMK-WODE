import React, { useEffect, useState } from 'react';
import { Table, Input, Modal, Button, message, Popconfirm } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { deletePayment } from '../../../apis/admin/payment';

const PaymentTable = ({ data, tableQuery }) => {
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [filterData, setFilterData] = useState([]);

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  };

  const handleView = (record) => {
    setModalData(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      const res = await deletePayment(record._id);
      
      message.success('Payment deleted successfully');
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const columns = [
    {
      title: 'Serial No',
      dataIndex: 'key',
      key: 'key',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Payment ID',
      dataIndex: 'paymentId',
      key: 'paymentId',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Payer Name',
      dataIndex: 'payerName',
      key: 'payerName',
      render: (text, record) => record?.user?.name,
    },
    {
      title: 'Payer Email',
      dataIndex: 'payerEmail',
      key: 'payerEmail',
      render: (text, record) => record?.user?.email,
    },
    {
      title: 'Paid At',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (text, record) => {
        const date = new Date(record?.createdAt);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    {
      title: 'Pay Type',
      dataIndex: 'payType',
      key: 'payType',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="actions">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            style={{
              marginRight: '8px',
              background: '#1890ff',
              borderColor: '#1890ff',
              borderRadius: '5px',
            }}
            onClick={() => handleView(record)}
          >
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this record?"
            onConfirm={() => handleDelete(record)}
            onCancel={() => }
            okText="Yes"
            cancelText="No"
            placement="topRight"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              style={{
                background: '#ff4d4f',
                borderColor: '#ff4d4f',
                borderRadius: '5px',
              }}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (data?.length > 0) {
      const filteredData =
        data?.filter((item) =>
          Object.values(item).some(
            (value) =>
              value &&
              String(value).toLowerCase().includes(searchText.toLowerCase())
          )
        ) || [];
      setFilterData(filteredData);
    }
  }, [data, searchText]);

  return (
    <div
      style={{ padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}
    >
      <Input
        placeholder="Search..."
        style={{
          marginBottom: '20px',
          width: '300px',
          border: '1px solid #ccc',
          borderRadius: '5px',
        }}
        onChange={handleSearch}
      />
      <Table
        columns={columns}
        dataSource={filterData}
        pagination={{ pageSize: 10 }}
        bordered
        style={{
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: '10px',
        }}
      />
      <Modal
        title="Payment Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        {modalData && (
          <div>
            <p>
              <strong>Payment ID:</strong> {modalData.paymentId}
            </p>
            <p>
              <strong>Amount:</strong> {modalData.amount}
            </p>
            <p>
              <strong>Payer Name:</strong> {modalData?.user?.name}
            </p>
            <p>
              <strong>Payer Email:</strong> {modalData?.user?.email}
            </p>

            <p>
              <strong>Paid At:</strong>{' '}
              {modalData?.createdAt
                ? format(new Date(modalData.createdAt), 'MMMM dd, yyyy')
                : 'N/A'}
            </p>
            <p>
              <strong>Pay Type:</strong> {modalData.payType}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentTable;
