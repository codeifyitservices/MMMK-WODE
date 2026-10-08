import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Tag,
  message,
  Popconfirm,
  Space,
  Table,
  Input,
  Modal,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getAllGiftCards, deleteGiftCard } from '../../../apis/admin/giftCard';
import GiftCardForm from './GiftCardForm';
import PageTitle from '../../UI/PageTitle';
import {
  RefreshButton,
  EditButton,
  DeleteButton,
  ViewButton,
} from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { convertPrice, formatPrice } from '../../../utils/currency';
import { useCurrency } from '../../../context/CurrencyContext';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';
import { getFullName } from '../../../utils/globalMethods';
import dayjs from 'dayjs';
import { BsClipboard } from 'react-icons/bs';
import { FiCopy } from 'react-icons/fi';

const GiftCardPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const { currency, rates } = useCurrency();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    isViewModalVisible: false,
    currentEditGiftCard: null,
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

  const GiftCards = useQuery({
    queryKey: [
      'giftCards',
      search,
      pagination.pageSize,
      pagination.currentPage,
    ],
    queryFn: async () => {
      const res = await getAllGiftCards({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleEdit = (record) => {
    updateUtils({
      isModalVisible: true,
      currentEditGiftCard: record,
    });
  };

  const handleDelete = async (record) => {
    try {
      await deleteGiftCard(record._id);
      GiftCards.refetch();
      message.success('Gift card deleted successfully');
    } catch (err) {
      
      message.error(
        err?.response?.data?.message || 'Failed to delete gift card'
      );
    }
  };

  const handleSubmit = () => {
    updateUtils({
      isModalVisible: false,
    });
  };

  const handleCloseModal = () => {
    updateUtils({
      isModalVisible: false,
      isViewModalVisible: false,
      currentEditGiftCard: null,
    });
  };

  const handleView = (record) => {
    updateUtils({
      isViewModalVisible: true,
      currentEditGiftCard: record,
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
        title: 'Gift Card Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Gift Card Code',
        dataIndex: 'code',
        key: 'code',
        render: (code) => (
          <div className="flex items-center gap-2">
            {code}{' '}
            <Button
              title="Copy Code"
              size="sm"
              icon={<FiCopy />}
              onClick={() => navigator.clipboard.writeText(code)}
              variant="ghost"
              type="text"
            />
          </div>
        ),
      },
      {
        title: 'Password',
        dataIndex: 'password',
        key: 'password',
        align: 'center',
        render: (password) => (
          <Button
            size="sm"
            title="Copy Password"
            icon={<FiCopy />}
            onClick={() => {
              navigator.clipboard.writeText(password);
              message.success('Password copied');
            }}
            variant="ghost"
            type="text"
          />
        ),
      },
      {
        title: 'Created By',
        dataIndex: 'createdBy',
        key: 'createdBy',
        align: 'center',
        render: (createdBy) =>
          createdBy ? (
            <div className="flex flex-col items-center">
              {}
              <p>
                {createdBy?.firstName} {createdBy?.lastName}
              </p>
              <p className="text-xs text-gray-500">{createdBy?.email}</p>
            </div>
          ) : (
            'Admin'
          ),
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        align: 'center',
        render: (amount) => formatPrice(convertPrice(amount, currency, rates), currency),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status) => (
          <Tag
            color={
              status === 'Active'
                ? 'blue'
                : status === 'Redeemed'
                  ? 'green'
                  : 'default'
            }
          >
            {status}
          </Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 100,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            {record.status === 'Redeemed' ? (
              <ViewButton onClick={() => handleView(record)} />
            ) : (
              <>
                <EditButton onClick={() => handleEdit(record)} />
                <DeleteButton
                  onClick={() =>
                    confirmDelete({
                      title: 'Delete the Gift Card',
                      content: 'Are you sure to delete this gift card?',
                      onOk: () => handleDelete(record),
                    })
                  }
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [currency, pagination, rates, screenSizeFactor]
  );

  return (
    <>
      <GiftCardForm
        visible={utils.isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        query={GiftCards}
        editedRow={utils.currentEditGiftCard}
        setEditedRow={(bool) =>
          updateUtils({ isModalVisible: bool, currentEditGiftCard: null })
        }
        setIsModalOpen={(bool) =>
          updateUtils({ isModalVisible: bool, currentEditGiftCard: null })
        }
      />
      <Modal
        width={500}
        title="View Gift Card"
        open={utils.isViewModalVisible}
        onCancel={() => handleCloseModal()}
        footer={null}
      >
        <div className="space-y-4 mt-8">
          <p className="flex items-center justify-between">
            <strong>Name:</strong> {utils.currentEditGiftCard?.name}
          </p>
          <p className="flex items-center justify-between">
            <strong>Code:</strong> {utils.currentEditGiftCard?.code}
          </p>
          <p className="flex items-center justify-between">
            <strong>Amount:</strong> {formatPrice(convertPrice(utils.currentEditGiftCard?.amount, currency, rates), currency)}
          </p>
          <p className="flex items-center justify-between">
            <strong>Status:</strong> {utils.currentEditGiftCard?.status}
          </p>
          <p className="flex items-center justify-between">
            <strong>Redeemed By:</strong>{' '}
            {getFullName(utils.currentEditGiftCard?.redeemedBy)} (
            {utils.currentEditGiftCard?.redeemedBy?.email})
          </p>
          <p className="flex items-center justify-between">
            <strong>Created By:</strong>{' '}
            {utils.currentEditGiftCard?.createdBy
              ? `${getFullName(utils.currentEditGiftCard?.createdBy)} (${utils.currentEditGiftCard?.createdBy?.email})`
              : 'Admin'}
          </p>
          <p className="flex items-center justify-between">
            <strong>Redeemed At:</strong>{' '}
            {dayjs(utils.currentEditGiftCard?.redeemedAt).format(
              'DD/MM/YYYY HH:mm:ss'
            )}
          </p>
        </div>
      </Modal>
      <PageTitle title="Gift Card Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Card Name', value: 'name' },
              { label: 'Card Code', value: 'code' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={GiftCards.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={GiftCards.refetch}
              isLoading={GiftCards.isFetching}
            />
            <Button
              onClick={() =>
                updateUtils({
                  isModalVisible: true,
                  currentEditGiftCard: null,
                })
              }
              type="primary"
            >
              Add Gift Card
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={GiftCards.data?.data || []}
          loading={GiftCards.isLoading}
          bordered
          rowKey="_id"
          scroll={{ x: 1400 }}
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

export default GiftCardPage;
