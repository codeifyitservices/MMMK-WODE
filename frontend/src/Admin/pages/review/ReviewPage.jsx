import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, message, Modal, Popconfirm, Table, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { getAllReview, deleteReview } from '../../../apis/admin/review';
import PageTitle from '../../UI/PageTitle';
import { DeleteButton, RefreshButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { LuStar } from 'react-icons/lu';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';

const ReviewPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const [search, setSearch] = useState({ searchKey: null, searchValue: null });
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });
  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  const Reviews = useQuery({
    queryKey: ['reviews', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllReview({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleDelete = async (record) => {
    try {
      await deleteReview(record._id);
      Reviews.refetch();
      message.success('Review deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete review');
    }
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
        title: 'Product',
        dataIndex: 'product',
        key: 'product',
        render: (product) => product?.productName?.en || <span className="text-gray-400 italic">Deleted Product</span>,
      },
      {
        title: 'User',
        dataIndex: 'user',
        key: 'user',
        align: 'center',
        render: (user) => user?.firstName || <span className="text-gray-400 italic">Deleted User</span>,
      },
      {
        title: 'Review',
        dataIndex: 'review',
        key: 'review',
        align: 'center',
        render: (text, record) => (
          <Button
            type="link"
            onClick={() =>
              Modal.info({
                title: 'Review by ' + (record.user?.firstName || 'Deleted User'),
                content: (
                  <div className="flex items-start gap-2">
                    <span className="flex items-center gap-1 border rounded-md px-2">
                      {record.rating}{' '}
                      <LuStar className="text-yellow-300 fill-yellow-300" />
                    </span>
                    <p>{text}</p>
                  </div>
                ),
                okButton: false,
              })
            }
          >
            View
          </Button>
        ),
      },
      {
        title: 'Rating',
        dataIndex: 'rating',
        key: 'rating',
        align: 'center',
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 100,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Review',
                  content: 'Are you sure to delete this review?',
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
      <PageTitle title="Reviews Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Product Name', value: 'productName' },
              { label: 'User Name', value: 'userName' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Reviews.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Reviews.refetch}
              isLoading={Reviews.isFetching}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Reviews.data?.data || []}
          loading={Reviews.isLoading}
          bordered
          rowKey="_id"
          scroll={{ x: 600 }}
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

export default ReviewPage;
