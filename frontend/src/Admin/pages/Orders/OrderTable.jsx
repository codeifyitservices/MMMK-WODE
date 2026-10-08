import React, { useEffect, useState } from 'react';
import { Table, Input, Button, Popconfirm, message } from 'antd';
import { FaSearch, FaEdit, FaEye, FaTrash, FaSync } from 'react-icons/fa';
import { deleteOrder, checkJuraStatus } from '../../../apis/admin/order';
import { convertPrice, formatPrice } from '../../../utils/currency';
import { useCurrency } from '../../../context/CurrencyContext';

const { Search } = Input;

export default function OrdersTable({ data, tableQuery, setIsEditData }) {
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const { currency, rates } = useCurrency();

  // Filter Data
  const handleSearch = (value) => {
    if (!value) {
      setFilteredData(data);
      return;
    }

    const lowercasedValue = value.toLowerCase();

    const filtered = data?.filter((item) => {
      const userName = item?.user?.name?.toLowerCase() || '';
      const status = item?.status?.toLowerCase() || '';
      const paymentType = item?.paymentType?.toLowerCase() || '';
      const productName =
        item?.products?.[0]?.productName?.en?.toLowerCase() || '';

      return (
        userName.includes(lowercasedValue) ||
        status.includes(lowercasedValue) ||
        paymentType.includes(lowercasedValue) ||
        productName.includes(lowercasedValue)
      );
    });

    setFilteredData(filtered);
  };

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Action Handlers
  const handleView = (record) =>
    alert('View details of ' + record.customerName);
  const handleEdit = (record) => alert('Edit order of ' + record.customerName);
  const handleDelete = async (record) => {
    try {
      const res = await deleteOrder(record._id);
      message.success('Order deleted successfully');
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleSyncStatus = async (record) => {
    try {
      message.loading({ content: 'Syncing tracking status...', key: 'syncTracking' });
      const res = await checkJuraStatus(record.orderId);
      if (res.success) {
        message.success({ content: 'Status updated successfully', key: 'syncTracking' });
        tableQuery.refetch();
      } else {
        message.error({ content: res.message || 'Failed to update status', key: 'syncTracking' });
      }
    } catch (err) {
      
      message.error({ content: err?.response?.data?.message || err.message || 'Failed to sync tracking status', key: 'syncTracking' });
    }
  };

  const columns = (onEdit, onView, onDelete) => [
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Order Id',
      dataIndex: 'orderId',
      key: 'orderId',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
      render: (text, record) => `#${record?.orderId}`,
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
      render: (text, record) => record?.userId?.firstName,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text, record) => record?.userId?.email,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      render: (_, record) =>
        record.products
          ?.map((product) => product.id?.productName?.en)
          .filter(Boolean) // Remove any undefined/null values
          .join(', '),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span
          className={`font-medium ${status === 'Complete'
            ? 'text-green-500'
            : status === 'Processing'
              ? 'text-yellow-500'
              : 'text-red-500'
            }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: 'Amount (USD)',
      dataIndex: 'displayAmountUSD',
      key: 'displayAmountUSD',
      render: (amount) => formatPrice(amount, 'USD'),
      sorter: (a, b) => a.displayAmountUSD - b.displayAmountUSD,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'displayAmountOriginal',
      key: 'displayAmountOriginal',
      render: (amount, record) => formatPrice(amount, record.displayCurrency),
      sorter: (a, b) => a.displayAmountOriginal - b.displayAmountOriginal,
    },
    {
      title: 'Pending Amount (COD)',
      dataIndex: 'displayPendingAmount',
      key: 'displayPendingAmount',
      render: (amount, record) => {
        if (record.mode === 'cod' && amount > 0) {
          return (
            <span className="text-red-600 font-bold">
              {formatPrice(amount, record.displayCurrency)}
            </span>
          );
        }
        return '-';
      },
      sorter: (a, b) => a.displayPendingAmount - b.displayPendingAmount,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (text, record) => record?.paymentStatus || 'Pending',
    },
    {
      title: 'Payment Type',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (text, record) => (record?.mode).toUpperCase(),
    },
    {
      title: 'Delivery Status',
      dataIndex: 'deliveryStatus',
      key: 'deliveryStatus',
      render: (deliveryStatus) => (
        <span
          className={`font-medium ${deliveryStatus === 'Delivered'
            ? 'text-green-600'
            : deliveryStatus === 'In Transit' || deliveryStatus === 'Out for Delivery'
              ? 'text-blue-500'
              : deliveryStatus === 'Failed' || deliveryStatus === 'Returned'
                ? 'text-red-500'
                : 'text-gray-500'
            }`}
        >
          {deliveryStatus || 'Pending'}
        </span>
      ),
    },
    {
      title: 'Shipper',
      dataIndex: 'shipperName',
      key: 'shipperName',
      render: (shipper) => shipper || '-',
    },
    {
      title: 'AWB',
      dataIndex: 'awb',
      key: 'awb',
      render: (awb) => awb || '-',
    },
    {
      title: 'Tracking',
      dataIndex: 'trackingUrl',
      key: 'trackingUrl',
      render: (trackingUrl) =>
        trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Track
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            type="link"
            onClick={() => handleSyncStatus(record)}
            icon={<FaSync className="text-green-500" title="Sync Tracking Status" />}
          />
          <Button
            type="link"
            onClick={() => {
              setIsEditData(record);
            }}
            icon={<FaEdit className="text-yellow-500" />}
          />
          <Popconfirm
            title="Are you sure you want to delete this order?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" icon={<FaTrash className="text-red-500" />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      {/* Search Input */}
      <div className="flex justify-between pb-4">
        <Input
          placeholder="Search..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Table */}
      <Table
        columns={columns(handleEdit, handleView, handleDelete)}
        dataSource={filteredData}
        pagination={{ pageSize: 5 }}
        bordered
        rowClassName="hover:bg-gray-100"
        className="rounded-lg"
        loading={tableQuery.loading}
        scroll={{ x: 1500 }}
      />
    </div>
  );
}
