import { useMemo, useState } from 'react';
import CouponForm from './CouponForm';
import { getAllCoupon, deleteCoupon } from '../../../apis/admin/coupon';
import { useQuery } from '@tanstack/react-query';
import { Button, Tag, message, Popconfirm, Table, Input } from 'antd';
import PageTitle from '../../UI/PageTitle';
import { RefreshButton, DeleteButton, EditButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';

const CouponPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditCoupon: null,
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

  const Coupons = useQuery({
    queryKey: ['coupons', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllCoupon({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleDelete = async (record) => {
    try {
      await deleteCoupon(record._id);
      Coupons.refetch();
      message.success('Coupon deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete coupon');
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
      currentEditCoupon: null,
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
        title: 'Coupon Name',
        dataIndex: 'couponName',
        key: 'couponName',
        render: (text) => <span className="font-semibold">{text}</span>,
      },
      {
        title: 'Coupon Code',
        dataIndex: 'couponCode',
        key: 'couponCode',
        align: 'center',
        render: (text) => (
          <Tag color="blue" className="px-3 text-sm">
            {text}
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'expiryDate',
        key: 'status',
        align: 'center',
        render: (text) => {
          const isExpired = text ? new Date(text) < new Date() : false;
          return (
            <Tag color={isExpired ? 'red' : 'green'} className="px-3 text-sm">
              {isExpired ? 'Expired' : 'Active'}
            </Tag>
          );
        },
      },
      {
        title: 'Product Discount',
        key: 'productDiscount',
        align: 'center',
        render: (_, record) => {
          if (record.applyToProducts === false) return '-';
          const type = record.discountType === 'amount' ? 'Fixed' : '%';
          return `${record.discount || 0}${type === '%' ? '%' : ''} (${type})`;
        }
      },
      {
        title: 'Delivery Discount',
        key: 'deliveryDiscount',
        align: 'center',
        render: (_, record) => {
          if (!record.applyToDelivery) return '-';
          const type = record.deliveryDiscountType === 'amount' ? 'Fixed' : '%';
          return `${record.deliveryDiscount || 0}${type === '%' ? '%' : ''} (${type})`;
        }
      },
      {
        title: 'Scope',
        dataIndex: 'scope',
        key: 'scope',
        width: 200,
        render: (scope, record) => {
          if (record.applyToProducts === false) return <Tag color="default">N/A</Tag>;
          if (scope === 'Category') {
            if (Array.isArray(record.scopeCategory)) {
              if (record.scopeCategory.length === 0) return <Tag color="purple">Category: None</Tag>;
              return (
                <div className="flex flex-wrap gap-1 max-w-[180px]">
                  {record.scopeCategory.map((cat) => {
                    const catName = cat?.name?.en || cat?.name || 'Unknown Category';
                    return (
                      <Tag key={cat?._id || cat} color="purple" className="truncate max-w-[150px]" title={catName}>
                        {catName}
                      </Tag>
                    );
                  })}
                </div>
              );
            }
            const catName =
              record.scopeCategory?.name?.en ||
              record.scopeCategory?.name ||
              'Unknown Category';
            return (
              <Tag color="purple" className="max-w-[180px] truncate" title={`Category: ${catName}`}>
                Category: {catName}
              </Tag>
            );
          }
          if (scope === 'Product') {
            const prodName =
              record.scopeProduct?.productName?.en ||
              record.scopeProduct?.productName ||
              'Unknown Product';
            return (
              <Tag color="orange" className="max-w-[180px] truncate" title={`Product: ${prodName}`}>
                Product: {prodName}
              </Tag>
            );
          }
          return <Tag color="green">All Products</Tag>;
        },
      },
      {
        title: 'Usage Count',
        dataIndex: 'currentUsage',
        key: 'currentUsage',
        align: 'center',
        render: (value) => Number(value || 0),
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <EditButton
              onClick={() =>
                updateUtils({ isModalVisible: true, currentEditCoupon: record })
              }
            />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Coupon',
                  content: 'Are you sure to delete this coupon?',
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
      <CouponForm
        isModalVisible={utils.isModalVisible}
        handleCancel={handleCloseModal}
        tableQuery={Coupons}
        currentEditCoupon={utils.currentEditCoupon}
        setCurrentEditCoupon={(bool) =>
          updateUtils({ isModalVisible: bool, currentEditCoupon: null })
        }
      />
      <PageTitle title="Coupons Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Coupon Name', value: 'couponName' },
              { label: 'Coupon Code', value: 'couponCode' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Coupons.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Coupons.refetch}
              isLoading={Coupons.isFetching}
            />
            <Button
              onClick={() =>
                updateUtils({ isModalVisible: true, currentEditCoupon: null })
              }
              type="primary"
            >
              Add Coupon
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Coupons.data?.data || []}
          loading={Coupons.isLoading}
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

export default CouponPage;
