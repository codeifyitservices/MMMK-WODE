import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Tag,
  message,
  Popconfirm,
  Table,
  Input,
  Modal,
  Form,
  Space,
  Tooltip,
  InputNumber,
  Select,
} from 'antd';
import {
  getAllFilters,
  createFilter,
  updateFilter,
  deleteFilter,
} from '../../../apis/admin/filter';
import PageTitle from '../../UI/PageTitle';
import {
  RefreshButton,
  EditButton,
  AddButton,
  DeleteButton,
} from '../../UI/Buttons';
import SearchInTable from '../../UI/SearchInTable';
import { useGlobalContext } from '../../../context/GlobalProvider';
import { tablePageSizes } from '../../../utils/staticData';

const FilterPage = () => {
  const { screenSizeFactor } = useGlobalContext();
  const [utils, setUtils] = useState({
    isModalVisible: false,
    currentEditFilter: null,
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

  const Filters = useQuery({
    queryKey: ['filters', search, pagination.pageSize, pagination.currentPage],
    queryFn: async () => {
      const res = await getAllFilters({ ...search, ...pagination });
      updatePagination({
        total: res?.total || 0,
      });
      return res;
    },
  });

  const [form] = Form.useForm();
  const filterName = Form.useWatch('filterName', form);
  const [customFilterName, setCustomFilterName] = useState('');

  // Reset form when modal opens/closes or currentEditFilter changes
  useEffect(() => {
    if (utils.isModalVisible && utils.currentEditFilter) {
      form.setFieldsValue({
        filterName: utils.currentEditFilter.filterName,
        options: utils.currentEditFilter.options,
      });
    } else if (utils.isModalVisible && !utils.currentEditFilter) {
      form.resetFields();
    }
  }, [utils.isModalVisible, utils.currentEditFilter, form]);

  const handleEdit = (record) => {
    updateUtils({
      isModalVisible: true,
      currentEditFilter: record,
    });
  };

  const handleAdd = () => {
    updateUtils({
      isModalVisible: true,
      currentEditFilter: null,
    });
  };

  const handleSubmit = async (data) => {
    try {
      // If "Other" is selected, use custom filter name
      if (data.filterName === 'Other') {
        data.filterName = data.customFilterName;
        delete data.customFilterName;
      }

      // For Gender filter, ensure options are in correct format
      if (data.filterName === 'Gender') {
        // If options are objects, extract values
        if (
          data.options &&
          data.options.length > 0 &&
          typeof data.options[0] === 'object'
        ) {
          data.options = data.options.map((opt) => opt.value || opt);
        }
      }

      if (utils.currentEditFilter) {
        await updateFilter(utils.currentEditFilter._id, data);
        message.success('Filter updated successfully');
      } else {
        await createFilter(data);
        message.success('Filter added successfully');
      }
      Filters.refetch();
      setCustomFilterName('');
      updateUtils({ isModalVisible: false, currentEditFilter: null });
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Server Error');
    }
  };

  const handleCloseModal = () => {
    updateUtils({
      isModalVisible: false,
      currentEditFilter: null,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteFilter(id);
      message.success('Filter deleted successfully');
      Filters.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete filter');
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
        title: 'Filter Name',
        dataIndex: 'filterName',
        key: 'filterName',
      },
      {
        title: 'Options',
        dataIndex: 'options',
        key: 'options',
        render: (options, record) => (
          <div>
            {options?.slice(0, 5).map((item, idx) => (
              <Tag key={idx} color="blue" style={{ margin: '2px' }}>
                {record.filterName === 'Price'
                  ? `${item.from} - ${item.to}`
                  : record.filterName === 'Discount'
                    ? `Upto ${item}%`
                    : item}
              </Tag>
            ))}
            {options?.length > 5 && (
              <Tooltip title={options.slice(5).join(', ')}>
                <span
                  style={{ color: 'blue', cursor: 'pointer', marginLeft: 4 }}
                >
                  +{options.length - 5} more
                </span>
              </Tooltip>
            )}
          </div>
        ),
      },
      {
        title: 'Action',
        key: 'action',
        align: 'center',
        fixed: screenSizeFactor > 3 && 'right',
        width: 120,
        render: (_, record) => (
          <div className="flex items-center gap-2 justify-center">
            <EditButton onClick={() => handleEdit(record)} />
            <Popconfirm
              title="Delete Filter"
              description="Are you sure you want to delete this filter?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <DeleteButton />
            </Popconfirm>
          </div>
        ),
      },
    ],
    [pagination, screenSizeFactor]
  );

  return (
    <>
      <Modal
        title={utils.currentEditFilter ? 'Edit Filter' : 'Add Filter'}
        open={utils.isModalVisible}
        onOk={form.submit}
        onCancel={handleCloseModal}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="Filter Name"
            name="filterName"
            rules={[{ required: true, message: 'Please enter a filter name' }]}
          >
            <Input placeholder="Enter filter name" />
          </Form.Item>

          {filterName === 'Price' ? (
            <>
              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <label className="font-medium">Price Ranges</label>
                      <AddButton onClick={() => add({ from: '', to: '' })} />
                    </div>

                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="mb-3">
                        <Form.Item
                          label={`Price Range ${name + 1}`}
                          className="mb-2"
                        >
                          <div className="flex items-start gap-2">
                            <Form.Item
                              {...restField}
                              name={[name, 'from']}
                              rules={[
                                {
                                  required: true,
                                  message: 'From price is required',
                                },
                                {
                                  pattern: /^\d+(\.\d{1,2})?$/,
                                  message: 'Please enter a valid price',
                                },
                              ]}
                              className="flex-1 mb-0"
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="From"
                                min={0}
                                precision={2}
                              />
                            </Form.Item>

                            <span className="flex items-center px-2">-</span>

                            <Form.Item
                              {...restField}
                              name={[name, 'to']}
                              rules={[
                                {
                                  required: true,
                                  message: 'To price is required',
                                },
                                {
                                  pattern: /^\d+(\.\d{1,2})?$/,
                                  message: 'Please enter a valid price',
                                },
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    const fromValue = getFieldValue([
                                      'options',
                                      name,
                                      'from',
                                    ]);
                                    if (
                                      value &&
                                      fromValue &&
                                      parseFloat(value) <= parseFloat(fromValue)
                                    ) {
                                      return Promise.reject(
                                        new Error(
                                          'To price must be greater than From price'
                                        )
                                      );
                                    }
                                    return Promise.resolve();
                                  },
                                }),
                              ]}
                              className="flex-1 mb-0"
                            >
                              <InputNumber
                                style={{ width: '100%' }}
                                placeholder="To"
                                min={0}
                                precision={2}
                              />
                            </Form.Item>

                            {fields.length > 1 && (
                              <DeleteButton
                                onClick={() => remove(name)}
                                className="mt-0"
                              />
                            )}
                          </div>
                        </Form.Item>
                      </div>
                    ))}

                    {fields.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>No price ranges added yet</p>
                        <Button
                          type="dashed"
                          onClick={() => add({ from: '', to: '' })}
                          className="mt-2"
                        >
                          Add First Price Range
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Form.List>
            </>
          ) : (
            <>
              <Form.Item
                label={`${filterName || 'Filter'} Options (Press Enter to add multiple)`}
                name="options"
                rules={[{ required: true, message: 'Options are required' }]}
              >
                <Select
                  mode="tags"
                  open={false}
                  suffixIcon={null}
                  placeholder={`Add ${filterName || 'filter'} options`}
                  tagRender={(props) => {
                    const { label, value, closable, onClose } = props;
                    return (
                      <Tag
                        closable={closable}
                        onClose={onClose}
                        style={{ marginRight: 3 }}
                      >
                        {filterName === 'Discount' ? `Upto ${label}%` : label}
                      </Tag>
                    );
                  }}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
      <PageTitle title="Filter Management" />
      <div className="p-4 bg-white shadow-lg rounded-lg overflow-x-auto">
        <div className="flex sm:flex-row flex-col sm:items-center justify-between mb-4">
          <SearchInTable
            searchBy={[{ label: 'Filter Name', value: 'filterName' }]}
            onSearch={(value, key) => {
              setSearch({ searchKey: key, searchValue: value });
              updatePagination({ currentPage: 1 });
            }}
            onClear={() => {
              setSearch({ searchKey: null, searchValue: null });
              updatePagination({ currentPage: 1 });
            }}
            isLoading={Filters.isFetching}
            className="sm:order-1 order-2"
          />
          <div className="flex items-center gap-2 sm:order-2 order-1 ms-auto">
            <RefreshButton
              onClick={Filters.refetch}
              isLoading={Filters.isFetching}
            />
            <Button onClick={handleAdd} type="primary">
              Add Filter
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={Filters.data?.data || []}
          loading={Filters.isLoading}
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

export default FilterPage;
