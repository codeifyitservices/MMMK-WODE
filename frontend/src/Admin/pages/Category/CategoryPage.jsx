import { useEffect, useMemo, useState } from 'react';
import CategoryModal from './CategoryModal';
import { useQuery } from '@tanstack/react-query';
import {
  deleteCategory,
  getAllCategories,
  reorderCategories,
} from '../../../apis/admin/category';
import { Button, Image, message, Space, Table } from 'antd';
import PageTitle from '../../UI/PageTitle';
import { DeleteButton, EditButton, RefreshButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';
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
import { resolveAssetUrl } from '../../../utils/assetUrl';

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

const CategoryPage = () => {
  const { screenSizeFactor } = useGlobalContext();

  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditCategory: null,
  });
  const updateUtils = (newUtils) =>
    setUtils((prev) => ({ ...prev, ...newUtils }));

  const [search, setSearch] = useState({ searchKey: null, searchValue: null });
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });
  const [orderedIds, setOrderedIds] = useState([]);

  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  const Categories = useQuery({
    queryKey: [
      'categories',
      search,
      pagination.pageSize,
      pagination.currentPage,
    ],
    queryFn: async () => {
      const res = await getAllCategories({ ...search, ...pagination });
      updatePagination({ total: res?.total || 0 });
      return res;
    },
  });

  useEffect(() => {
    const ids = (Categories.data?.data || []).map((category) => category._id);
    setOrderedIds(ids);
  }, [Categories.data]);

  const categoryMap = useMemo(() => {
    const data = Categories.data?.data || [];
    return Object.fromEntries(data.map((category) => [category._id, category]));
  }, [Categories.data]);

  const sortedData = useMemo(() => {
    if (!orderedIds.length) return Categories.data?.data || [];
    return orderedIds.map((id) => categoryMap[id]).filter(Boolean);
  }, [orderedIds, categoryMap, Categories.data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const isReorderDisabled = Boolean(search.searchKey || search.searchValue);

  const handleDragEnd = async ({ active, over }) => {
    if (!orderedIds.length) return;
    if (isReorderDisabled) {
      message.warning('Clear search before reordering categories.');
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
      await reorderCategories(
        newIds.map((id, index) => ({
          id,
          order: pageOffset + index,
        }))
      );
      await Categories.refetch();
    } catch (err) {
      message.error('Failed to save new order.');
      setOrderedIds(previousIds);
    }
  };

  const handleEdit = (record) =>
    updateUtils({ isModalVisible: true, currentEditCategory: record });

  const handleDelete = async (record) => {
    try {
      await deleteCategory(record._id);
      Categories.refetch();
      message.success('Category deleted successfully');
    } catch (err) {
      message.error(err.response?.data.message || 'Failed to delete category');
    }
  };

  const handleSubmit = () => updateUtils({ isModalVisible: false });

  const handleCloseModal = () =>
    updateUtils({ isModalVisible: false, currentEditCategory: null });

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
        key: 'index',
        width: 80,
        render: (_, __, index) =>
          (pagination.currentPage - 1) * pagination.pageSize + index + 1,
      },
      {
        title: 'Name',
        dataIndex: ['name', 'en'],
        key: 'name',
      },
      {
        title: 'Subcategories',
        dataIndex: 'subcategories',
        key: 'subcategories',
        render: (subcategories) => (
          <Space wrap>
            {subcategories.map((subcategory, index) => (
              <span
                className="border border-black text-black p-1 rounded"
                key={index}
              >
                {subcategory.en}
              </span>
            ))}
          </Space>
        ),
      },
      {
        title: 'Image',
        dataIndex: 'image',
        key: 'image',
        align: 'center',
        render: (image) => (
          <Image
            src={resolveAssetUrl(image)}
            alt="category"
            width={50}
            height={50}
            style={{ objectFit: 'cover' }}
          />
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
            <EditButton onClick={() => handleEdit(record)} />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the Category',
                  content: 'Are you sure to delete this category?',
                  onOk: () => handleDelete(record),
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
      <CategoryModal
        isVisible={utils.isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        tableQuery={Categories}
        currentEditCategory={utils.currentEditCategory}
        setCurrentEditCategory={(bool) =>
          updateUtils({ isModalVisible: bool, currentEditCategory: null })
        }
      />

      <PageTitle title="Category Management" />

      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Category Name', value: 'name' },
              { label: 'Subcategory Name', value: 'subcategoryName' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Categories.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Categories.refetch}
              isLoading={Categories.isFetching}
            />
            <Button
              onClick={() =>
                updateUtils({ isModalVisible: true, currentEditCategory: null })
              }
              type="primary"
            >
              Add Category
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedData.map((category) => category._id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              columns={columns}
              dataSource={sortedData}
              loading={Categories.isLoading}
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
};

export default CategoryPage;
