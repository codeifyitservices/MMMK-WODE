import { useEffect, useMemo, useState } from 'react';
import ProductModalForm from './ProductModalForm';
import { Button, message, Select, Space, Table } from 'antd';
import {
  deleteProduct,
  getAllProducts,
  reorderProducts,
} from '../../../apis/admin/product';
import { useQuery } from '@tanstack/react-query';
import PageTitle from '../../UI/PageTitle';
import SearchInTable from '../../UI/SearchInTable';
import { DeleteButton, EditButton, RefreshButton } from '../../UI/Buttons';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';
import { getAllCategories } from '../../../apis/admin/category';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';

const RowDragHandle = ({ rowKey, disabled = false }) => {
  const { listeners, attributes } = useSortable({ id: rowKey });

  return (
    <HolderOutlined
      {...(!disabled ? listeners : {})}
      {...(!disabled ? attributes : {})}
      style={{
        cursor: disabled ? 'not-allowed' : 'grab',
        color: disabled ? '#d9d9d9' : '#999',
        fontSize: 16,
        touchAction: 'none',
      }}
    />
  );
};

const SortableRow = ({ id, children, ...props }) => {
  const { setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={{
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: isDragging ? '#fafafa' : undefined,
      }}
    >
      {children}
    </tr>
  );
};

const tableComponents = {
  body: {
    row: ({ children, ...props }) => (
      <SortableRow id={props['data-row-key']} {...props}>
        {children}
      </SortableRow>
    ),
  },
};

export default function AdminProductPage() {
  const { screenSizeFactor } = useGlobalContext();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditProduct: null,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const [search, setSearch] = useState({
    searchKey: null,
    searchValue: null,
    category: null,
  });
  const updateSearch = (newSearch) =>
    setSearch((prev) => ({ ...prev, ...newSearch }));
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });
  const [orderedIds, setOrderedIds] = useState([]);

  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  const Products = useQuery({
    queryKey: ['products', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllProducts({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  useEffect(() => {
    const ids = (Products.data?.data || []).map((product) => product._id);
    setOrderedIds(ids);
  }, [Products.data]);

  const categories = useQuery({
    queryKey: ['getAllCategories'],
    queryFn: getAllCategories,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const isReorderDisabled = Boolean(search.searchKey || search.searchValue);

  const productMap = useMemo(() => {
    const data = Products.data?.data || [];
    return Object.fromEntries(data.map((product) => [product._id, product]));
  }, [Products.data]);

  const sortedData = useMemo(() => {
    if (!orderedIds.length) return Products.data?.data || [];
    return orderedIds.map((id) => productMap[id]).filter(Boolean);
  }, [orderedIds, productMap, Products.data]);

  const handleEdit = (record) => {
    updateUtils({
      isModalVisible: true,
      currentEditProduct: record,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      message.success('Product deleted successfully');
      Products.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!orderedIds.length) return;
    if (isReorderDisabled) {
      message.warning('Clear search before reordering products.');
      return;
    }
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id);
    const newIndex = orderedIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const previousIds = [...orderedIds];
    const newIds = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newIds);

    try {
      const pageOffset = (pagination.currentPage - 1) * pagination.pageSize;
      await reorderProducts(
        newIds.map((id, index) => ({
          id,
          order: pageOffset + index,
        })),
        { category: search.category || null }
      );
      await Products.refetch();
    } catch (err) {
      message.error('Failed to save product order.');
      setOrderedIds(previousIds);
    }
  };

  const getTotalStock = (record) => {
    if (Array.isArray(record?.skus) && record.skus.length > 0) {
      return record.skus.reduce(
        (sum, sku) => sum + Number(sku?.quantity || 0),
        0
      );
    }
    return Number(record?.quantity || 0);
  };

  const getDisplayStatus = (record) => {
    const totalStock = getTotalStock(record);
    if (totalStock <= 0) {
      return 'Out of stock';
    }
    if (record?.status === 'Inactive') {
      return 'Inactive';
    }
    return 'Active';
  };

  const columns = useMemo(
    () => [
      {
        title: '',
        key: 'sort',
        width: 40,
        align: 'center',
        render: (_, record) => (
          <RowDragHandle rowKey={record._id} disabled={isReorderDisabled} />
        ),
      },
      {
        title: 'S/N',
        dataIndex: 'key',
        render: (text, record, index) =>
          (pagination.currentPage - 1) * pagination.pageSize + index + 1,
        width: 100,
      },
      {
        title: 'Product Name',
        dataIndex: 'productName',
        render: (text) => text?.en,
        width: 150,
      },
      {
        title: 'Category Name',
        dataIndex: 'categoryName',
        render: (text, record) => record?.category?.name?.en,
        width: 150,
      },
      {
        title: 'Sub Category Name',
        dataIndex: 'subCategoryName',
        render: (text, record) =>
          record?.category?.subcategories?.find(
            (list) => list._id == record?.subCategory
          )?.en,
        width: 150,
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        width: 100,
        align: 'center',
        render: (_, record) => getTotalStock(record),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        align: 'center',
        render: (_, record) => getDisplayStatus(record),
      },
      {
        title: 'Action',
        align: 'center',
        key: 'action',
        fixed: screenSizeFactor > 3 && 'right',
        width: 100,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <EditButton onClick={() => handleEdit(record)} />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Product',
                  content: 'Are you sure to delete this product?',
                  onOk: () => handleDelete(record._id),
                })
              }
            />
          </div>
        ),
      },
    ],
    [isReorderDisabled, pagination, screenSizeFactor]
  );

  return (
    <>
      <ProductModalForm
        isOpen={utils.isModalVisible}
        onClose={() =>
          updateUtils({ isModalVisible: false, currentEditProduct: null })
        }
        selected={utils.currentEditProduct}
        refetchTable={Products.refetch}
        mode={utils.currentEditProduct ? 'edit' : 'add'}
      />
      <PageTitle title="Product Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <Space.Compact className="flex items-end">
            <Select
              className="w-[200px] mb-0 mt-0"
              popupClassName="min-w-[300px]"
              placeholder="Select Category"
              allowClear
              showSearch
              onChange={(value) => {
                updateSearch({ category: value });
                updatePagination({ currentPage: 1 });
              }}
              options={[
                {
                  label: 'Categories',
                  options: categories.data?.data?.map((item) => ({
                    label: item.name.en,
                    value: item._id,
                  })),
                },
              ]}
            />
            <SearchInTable
              searchBy={[
                { label: 'Product Name', value: 'productName' },
                { label: 'Subcategory Name', value: 'subcategoryName' },
              ]}
              onSearch={(value, key) => {
                updateSearch({ searchKey: key, searchValue: value });
                updatePagination({ currentPage: 1 });
              }}
              onClear={() => {
                updateSearch({ searchKey: null, searchValue: null });
                updatePagination({ currentPage: 1 });
              }}
              isLoading={Products.isFetching}
              className="sm:order-1 order-2"
            />
          </Space.Compact>
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Products.refetch}
              isLoading={Products.isFetching}
            />
            <Button
              onClick={() =>
                updateUtils({ isModalVisible: true, currentEditProduct: null })
              }
              type="primary"
            >
              Add Product
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedData.map((product) => product._id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              columns={columns}
              dataSource={sortedData}
              loading={Products.isLoading}
              bordered
              rowKey="_id"
              scroll={{ x: 600 }}
              components={tableComponents}
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
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}
