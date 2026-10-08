import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllPayments, deletePayment } from '../../../apis/admin/payment';
import { Button, Table, Input, Modal, message, Popconfirm } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import PageTitle from '../../UI/PageTitle';
import { DeleteButton, RefreshButton, ViewButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { getFullName } from '../../../utils/globalMethods';
import { tablePageSizes } from '../../../utils/staticData';

const PaymentPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentViewPayment: null,
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

  const Payments = useQuery({
    queryKey: ['payments', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllPayments({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleView = (record) => {
    updateUtils({
      isModalVisible: true,
      currentViewPayment: record,
    });
  };

  const handleDelete = async (record) => {
    try {
      await deletePayment(record._id);
      Payments.refetch();
      message.success('Payment deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete payment');
    }
  };

  const handleCloseModal = () => {
    updateUtils({
      isModalVisible: false,
      currentViewPayment: null,
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
        title: 'Payment ID',
        dataIndex: 'paymentId',
        key: 'paymentId',
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'center',
      },
      {
        title: 'Payer Name',
        dataIndex: 'payerName',
        key: 'payerName',
        render: (_, record) => getFullName(record?.user),
      },
      {
        title: 'Payer Email',
        dataIndex: 'payerEmail',
        key: 'payerEmail',
        align: 'center',
        render: (_, record) => record?.user?.email,
      },
      {
        title: 'Paid At',
        dataIndex: 'paidAt',
        key: 'paidAt',
        align: 'center',
        render: (_, record) =>
          record?.createdAt
            ? new Date(record.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'N/A',
      },
      {
        title: 'Pay Type',
        dataIndex: 'payType',
        key: 'payType',
        align: 'center',
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <ViewButton onClick={() => handleView(record)} />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Payment',
                  content: 'Are you sure to delete this payment?',
                  onOk: () => handleDelete(record),
                })
              }
            />
          </div>
        ),
      },
    ],
    [pagination, screenSizeFactor]
  );

  return (
    <>
      <Modal
        title="Payment Details"
        open={utils.isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
      >
        {utils.currentViewPayment && (
          <div>
            <p>
              <strong>Payment ID:</strong> {utils.currentViewPayment.paymentId}
            </p>
            <p>
              <strong>Amount:</strong> {utils.currentViewPayment.amount}
            </p>
            <p>
              <strong>Payer Name:</strong>{' '}
              {utils.currentViewPayment?.user?.name}
            </p>
            <p>
              <strong>Payer Email:</strong>{' '}
              {utils.currentViewPayment?.user?.email}
            </p>
            <p>
              <strong>Paid At:</strong>{' '}
              {utils.currentViewPayment?.createdAt
                ? new Date(
                    utils.currentViewPayment.createdAt
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
            <p>
              <strong>Pay Type:</strong> {utils.currentViewPayment.payType}
            </p>
          </div>
        )}
      </Modal>
      <PageTitle title="Payments Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Payment ID', value: 'paymentId' },
              { label: 'Payer Name', value: 'payerName' },
              { label: 'Payer Email', value: 'payerEmail' },
              { label: 'Pay Type', value: 'payType' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Payments.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Payments.refetch}
              isLoading={Payments.isFetching}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Payments.data?.data || []}
          loading={Payments.isLoading}
          bordered
          rowKey="_id"
          scroll={{ x: 1100 }}
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

export default PaymentPage;
