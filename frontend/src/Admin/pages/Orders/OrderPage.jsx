import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAll, deleteOrder } from '../../../apis/admin/order';
import { Button, Input, Table, Popconfirm, message, Tag } from 'antd';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import PageTitle from '../../UI/PageTitle';
import {
  DeleteButton,
  EditButton,
  RefreshButton,
  ViewButton,
} from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import OrderFormModal from './OrderFormModal';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';
import { convertPrice, formatPrice } from '../../../utils/currency';
import { useCurrency } from '../../../context/CurrencyContext';

const OrderPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const { currency, rates } = useCurrency();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditOrder: null,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const [search, setSearch] = useState({ searchKey: null, searchValue: null });
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });
  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  const Orders = useQuery({
    queryKey: ['orders', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAll({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleEdit = (record) => {
    updateUtils({
      isModalVisible: true,
      currentEditOrder: record,
    });
  };

  const handleDelete = async (record) => {
    try {
      await deleteOrder(record._id);
      Orders.refetch();
      message.success('Order deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete order');
    }
  };

  const handleCloseModal = () => {
    updateUtils({
      isModalVisible: false,
      currentEditOrder: null,
    });
  };

  const columns = useMemo(
    () => [
      {
        title: 'S/N',
        dataIndex: 'index',
        key: 'index',
        render: (_, __, index) =>
          (pagination.currentPage - 1) * pagination.pageSize + index + 1,
        width: 80,
      },
      {
        title: 'Order Id',
        dataIndex: 'orderId',
        key: 'orderId',
        width: 150,
        render: (text, record) => `#${record?.orderId}`,
      },
      {
        title: 'Customer Name',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 200,
        render: (text, record) =>
          record?.userId?.firstName
            ? `${record.userId.firstName} ${record.userId.lastName || ''}`
            : '',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        width: 250,
        render: (text, record) => record?.userId?.email,
      },
      {
        title: 'Products',
        dataIndex: 'productName',
        key: 'productName',
        width: 300,
        render: (_, record) =>
          record.products
            ?.map((product) => product?.id?.productName?.en || product?.productName?.en || product?.name)
            .filter(Boolean)
            .join(', '),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        align: 'center',
        render: (status) => (
          <Tag
            color={
              status === 'Complete'
                ? 'success'
                : status === 'Processing'
                  ? 'processing'
                  : status === 'Pending'
                    ? 'default'
                    : 'error'
            }
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Tag>
        ),
      },
      {
        title: 'Amount (USD)',
        dataIndex: 'displayAmountUSD',
        key: 'displayAmountUSD',
        width: 120,
        align: 'center',
        render: (amount) => formatPrice(amount, 'USD'),
      },
      {
        title: 'Paid Amount',
        dataIndex: 'displayAmountOriginal',
        key: 'displayAmountOriginal',
        width: 150,
        align: 'center',
        render: (amount, record) => formatPrice(amount, record.displayCurrency),
      },
      {
        title: 'Pending Amount (COD)',
        dataIndex: 'displayPendingAmount',
        key: 'displayPendingAmount',
        width: 180,
        align: 'center',
        render: (amount, record) => {
          if ((record.mode === 'cod' || record.paymentMethod?.includes('cod')) && amount > 0) {
            return (
              <span className="text-red-600 font-bold">
                {formatPrice(amount, record.displayCurrency)}
              </span>
            );
          }
          return '-';
        },
      },
      {
        title: 'Payment Status',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        width: 150,
        align: 'center',
        render: (text, record) => record?.paymentStatus || 'Pending',
      },
      {
        title: 'Payment Type',
        dataIndex: 'paymentType',
        key: 'paymentType',
        width: 120,
        align: 'center',
        render: (text, record) => (record?.mode || '').toUpperCase(),
      },
      {
        title: 'Delivery Status',
        dataIndex: 'deliveryStatus',
        key: 'deliveryStatus',
        width: 150,
        align: 'center',
        render: (deliveryStatus) => (
          <Tag
            color={
              deliveryStatus === 'Delivered'
                ? 'success'
                : deliveryStatus === 'In Transit' || deliveryStatus === 'Out for Delivery'
                  ? 'processing'
                  : deliveryStatus === 'Failed' || deliveryStatus === 'Returned'
                    ? 'error'
                    : 'default'
            }
          >
            {deliveryStatus || 'Pending'}
          </Tag>
        ),
      },
      {
        title: 'Shipper',
        dataIndex: 'shipperName',
        key: 'shipperName',
        width: 120,
        align: 'center',
        render: (shipper) => shipper || '-',
      },
      {
        title: 'AWB',
        dataIndex: 'awb',
        key: 'awb',
        width: 120,
        align: 'center',
        render: (awb) => awb || '-',
      },
      {
        title: 'Tracking',
        dataIndex: 'trackingUrl',
        key: 'trackingUrl',
        width: 100,
        align: 'center',
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
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 150,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <EditButton onClick={() => handleEdit(record)} />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Order',
                  content: 'Are you sure to delete this order?',
                  onOk: () => handleDelete(record),
                })
              }
            />
          </div>
        ),
      },
    ],
    [currency, pagination, rates, screenSizeFactor]
  );

  return (
    <>
      <OrderFormModal
        onCancel={handleCloseModal}
        editData={utils.currentEditOrder}
        tableQuery={Orders}
      />
      <PageTitle title="Order Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Order Id', value: 'orderId' },
              { label: 'Customer Name', value: 'customerName' },
              { label: 'Customer Email', value: 'customerEmail' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Orders.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Orders.refetch}
              isLoading={Orders.isFetching}
            />
            {/* Add Order button if needed */}
            {/* <Button
              onClick={() =>
                updateUtils({ isModalVisible: true, currentEditOrder: null })
              }
              type="primary"
            >
              Add Order
            </Button> */}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Orders.data?.data || []}
          loading={Orders.isLoading}
          bordered
          rowKey="_id"
          scroll={{ x: 2500 }}
          pagination={{
            current: pagination.currentPage,
            total: pagination.total,
            pageSize: pagination.pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100', '10000'],
            onChange: (page, pageSize) => {
              const actualPageSize = Number(pageSize);
              
              // Reset to page 1 only if pageSize changes, otherwise keep current page
              const isPageSizeChanged = actualPageSize !== pagination.pageSize;
              
              updatePagination({ 
                currentPage: isPageSizeChanged ? 1 : page, 
                pageSize: !isNaN(actualPageSize) ? actualPageSize : pagination.pageSize 
              });
            },
          }}
        />
      </div>
    </>
  );
};

export default OrderPage;
