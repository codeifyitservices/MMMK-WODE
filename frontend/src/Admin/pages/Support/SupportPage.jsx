import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllSupports,
  deleteSupport,
  addReply,
} from '../../../apis/admin/support';
import { Button, message, Modal, Form, Space, Table, Input, Tag } from 'antd';
import PageTitle from '../../UI/PageTitle';
import { DeleteButton, RefreshButton, ViewButton } from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { confirmDelete } from '../../UI/Modals';
import { tablePageSizes } from '../../../utils/staticData';

const SupportPage = () => {
  const { screenSizeFactor } = useGlobalContext();

  const [search, setSearch] = useState({ searchKey: null, searchValue: null });
  const [pagination, setPagination] = useState({
    pageSize: 10,
    currentPage: 1,
    total: 0,
  });
  const updatePagination = (newPagination) =>
    setPagination((prev) => ({ ...prev, ...newPagination }));

  const [viewModal, setViewModal] = useState({
    visible: false,
    record: null,
  });

  const Supports = useQuery({
    queryKey: ['supports', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllSupports({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const handleDelete = async (record) => {
    try {
      await deleteSupport(record._id);
      Supports.refetch();
      message.success('Support deleted successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete support');
    }
  };

  const handleView = (record) => {
    setViewModal({ visible: true, record });
  };

  const handleCloseViewModal = () => {
    setViewModal({ visible: false, record: null });
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
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
        align: 'center',
        render: (email) => (
          <a href={`mailto:${email}`} className="text-blue-500">
            {email}
          </a>
        ),
      },
      {
        title: 'Contact Number',
        dataIndex: 'phone',
        key: 'phone',
        align: 'center',
      },
      {
        title: 'Subject',
        dataIndex: 'subject',
        key: 'subject',
        render: (subject) => subject || 'Contact Us',
      },
      {
        title: 'Query',
        dataIndex: 'query',
        key: 'query',
        render: (query, record) => {
          const text = query || record.description;
          return text?.length > 50 ? `${text.slice(0, 50)}...` : text || '-';
        },
      },
      {
        title: 'Source',
        dataIndex: 'source',
        key: 'source',
        align: 'center',
        render: (source) => (
          <Tag color={source === 'enquiry' ? 'blue' : 'green'}>
            {(source || 'contact-us').toUpperCase()}
          </Tag>
        ),
      },
      {
        title: 'Locale',
        dataIndex: 'locale',
        key: 'locale',
        align: 'center',
        render: (locale) => String(locale || 'en').toUpperCase(),
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
                  title: 'Delete the Support',
                  content: 'Are you sure to delete this support request?',
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
        title="Support Message Details"
        open={viewModal.visible}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Close
          </Button>,
        ]}
      >
        {viewModal.record && (
          <div>
            <p>
              <strong>Name:</strong> {viewModal.record.name}
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${viewModal.record.email}`}>
                {viewModal.record.email}
              </a>
            </p>
            <p>
              <strong>Subject:</strong> {viewModal.record.subject || 'Contact Us'}
            </p>
            <p>
              <strong>Contact Number:</strong> {viewModal.record.phone}
            </p>
            <p>
              <strong>Country Code:</strong>{' '}
              {viewModal.record.phoneCountryCode || '-'}
            </p>
            <p>
              <strong>Phone Number:</strong>{' '}
              {viewModal.record.phoneNumber || viewModal.record.phone || '-'}
            </p>
            <p>
              <strong>Locale:</strong>{' '}
              {String(viewModal.record.locale || 'en').toUpperCase()}
            </p>
            <p>
              <strong>Source:</strong> {viewModal.record.source || 'contact-us'}
            </p>
            <p>
              <strong>Query:</strong>
              <br />
              <span style={{ whiteSpace: 'pre-line' }}>
                {viewModal.record.query || viewModal.record.description}
              </span>
            </p>
          </div>
        )}
      </Modal>
      <PageTitle title="Support Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[
              { label: 'Name', value: 'name' },
              { label: 'Email', value: 'email' },
              { label: 'Contact Number', value: 'phone' },
              { label: 'Subject', value: 'subject' },
              { label: 'Source', value: 'source' },
              { label: 'Locale', value: 'locale' },
            ]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Supports.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Supports.refetch}
              isLoading={Supports.isFetching}
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Supports.data?.data || []}
          loading={Supports.isLoading}
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

export default SupportPage;
