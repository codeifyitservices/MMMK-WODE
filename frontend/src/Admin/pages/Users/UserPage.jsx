import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers, deleteUser } from '../../../apis/admin/user';
import { Button, Tag, message, Popconfirm, Space, Table, Input } from 'antd';
import PageTitle from '../../UI/PageTitle';
import { DeleteButton, EditButton, RefreshButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import UserModalForm from './UserModalForm';
import CreateUserForm from './CreateUserForm';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';

const UserPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditUser: null,
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

  const Users = useQuery({
    queryKey: ['users', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllUsers({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleEdit = (record) => {
    updateUtils({
      isModalVisible: true,
      currentEditUser: record,
    });
  };

  const handleDelete = async (record) => {
    try {
      await deleteUser(record._id);
      Users.refetch();
      message.success('User deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete user');
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
      currentEditUser: null,
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
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (_, record) =>
          `${record?.firstName || ''} ${record?.lastName || ''}`,
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
        dataIndex: 'isVerified',
        key: 'isVerified',
        render: (isVerified) =>
          isVerified ? (
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
        title: 'Date of Birth',
        dataIndex: 'dateOfBirth',
        key: 'dateOfBirth',
        render: (date) =>
          date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      },
      {
        title: 'Actions',
        key: 'actions',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <EditButton onClick={() => handleEdit(record)} />
            <DeleteButton
              onClick={() =>
                confirmDelete({
                  title: 'Delete the User',
                  content: 'Are you sure to delete this user?',
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
      <UserModalForm
        isOpen={utils.isModalVisible}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        refetchTable={Users.refetch}
        selectedUser={utils.currentEditUser}
        setCurrentEditUser={(bool) =>
          updateUtils({ isModalVisible: bool, currentEditUser: null })
        }
      />
      <PageTitle title="User Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Name', value: 'name' },
              { label: 'Email', value: 'email' },
              { label: 'Phone Number', value: 'contactNumber' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Users.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Users.refetch}
              isLoading={Users.isFetching}
            />
            <CreateUserForm tableQuery={Users} />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Users.data?.data || []}
          loading={Users.isLoading}
          bordered
          rowKey="_id"
          scroll={{ x: 800 }}
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

export default UserPage;
