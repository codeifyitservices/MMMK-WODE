import React, { useEffect, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  Input as AntInput,
  Tag,
  Tooltip,
  Space,
  Popconfirm,
  message,
  Select,
} from 'antd';
import { createFilter, updateFilter } from '../../../apis/admin/filter';

const { Option } = Select;

const FilterTable = ({ data, tableQuery }) => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null);
  const [newFilter, setNewFilter] = useState({
    filterName: '',
    subFilterName: [],
    filterType: 'general', // Add filter type
  });

  // Define available filter types including brand
  const filterTypes = [
    { value: 'general', label: 'General' },
    { value: 'brand', label: 'Brand' },
    { value: 'category', label: 'Category' },
    { value: 'price', label: 'Price Range' },
    // Add more filter types as needed
  ];

  const columns = [
    {
      title: 'Filter Type',
      dataIndex: 'filterType',
      key: 'filterType',
      render: (filterType) => (
        <Tag color={filterType === 'brand' ? 'green' : 'blue'}>
          {filterType?.toUpperCase() || 'GENERAL'}
        </Tag>
      ),
    },
    {
      title: 'Filter Name',
      dataIndex: 'filterName',
      key: 'filterName',
    },
    {
      title: 'Sub Filter Name',
      dataIndex: 'subFilterName',
      key: 'subFilterName',
      render: (subFilterName) => (
        <div>
          {subFilterName.slice(0, 5).map((item, index) => (
            <Tag key={index} color="blue" style={{ margin: '2px' }}>
              {item}
            </Tag>
          ))}
          {subFilterName.length > 5 && (
            <Tooltip title={subFilterName.slice(5).join(', ')}>
              <div
                style={{
                  color: 'blue',
                  cursor: 'pointer',
                  display: 'inline-block',
                  marginTop: '5px',
                }}
              >
                Show more
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() => handleEdit(record)}
            type="primary"
            shape="round"
            icon={<i className="fa fa-edit"></i>}
            style={{ backgroundColor: '#4CAF50', color: 'white' }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const filteredData = filters.filter(
    (item) =>
      item.filterName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.filterType &&
        item.filterType.toLowerCase().includes(searchText.toLowerCase()))
  );

  const handleAddFilter = () => {
    setNewFilter({
      filterName: '',
      subFilterName: [],
      filterType: 'general',
    });
    setCurrentEdit(null);
    setIsModalVisible(true);
  };

  const handleAddBrandFilter = () => {
    setNewFilter({
      filterName: 'Brand',
      subFilterName: [],
      filterType: 'brand',
    });
    setCurrentEdit(null);
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      // Validate required fields
      if (!newFilter.filterName.trim()) {
        message.error('Filter name is required');
        return;
      }

      if (
        newFilter.subFilterName.length === 0 ||
        (newFilter.subFilterName.length === 1 &&
          !newFilter.subFilterName[0].trim())
      ) {
        message.error('At least one sub-filter is required');
        return;
      }

      const filterData = {
        ...newFilter,
        subFilterName: newFilter.subFilterName.filter(
          (item) => item.trim() !== ''
        ),
      };

      if (currentEdit) {
        const res = await updateFilter(currentEdit._id, filterData);
        
        message.success('Filter updated successfully');
      } else {
        const res = await createFilter(filterData);
        
        message.success('Filter added successfully');
      }

      tableQuery.refetch();
      setIsModalVisible(false);
      setCurrentEdit(null);
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Server Error');
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setCurrentEdit(null);
  };

  const handleEdit = (record) => {
    setNewFilter({
      filterName: record.filterName,
      subFilterName: record.subFilterName,
      filterType: record.filterType || 'general',
    });
    setCurrentEdit(record);
    setIsModalVisible(true);
  };

  // Predefined brand suggestions for easier input
  const brandSuggestions = [
    'Nike',
    'Adidas',
    'Apple',
    'Samsung',
    'Sony',
    'LG',
    'Dell',
    'HP',
    'Canon',
    'Nikon',
    'Ford',
    'Toyota',
    'BMW',
    'Mercedes',
  ];

  useEffect(() => {
    setFilters(data || []);
  }, [data]);

  return (
    <div style={{ padding: '20px', backgroundColor: '#fff' }}>
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <Button type="primary" onClick={handleAddFilter}>
          Add Filter
        </Button>
        <Button
          type="primary"
          onClick={handleAddBrandFilter}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Add Brand Filter
        </Button>
        <Input
          placeholder="Search Filter or Type"
          value={searchText}
          onChange={handleSearch}
          style={{ width: '300px' }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
        }}
        bordered
        style={{
          borderColor: '#fff',
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
        rowKey={(record) => record._id || record.filterName}
      />

      <Modal
        title={currentEdit ? 'Edit Filter' : 'Add Filter'}
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Filter Type">
            <Select
              value={newFilter.filterType}
              onChange={(value) =>
                setNewFilter({ ...newFilter, filterType: value })
              }
              style={{ width: '100%' }}
            >
              {filterTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Filter Name">
            <AntInput
              value={newFilter.filterName}
              onChange={(e) =>
                setNewFilter({ ...newFilter, filterName: e.target.value })
              }
              placeholder={
                newFilter.filterType === 'brand' ? 'Brand' : 'Enter filter name'
              }
            />
          </Form.Item>

          <Form.Item label="Sub Filter Names">
            {newFilter.filterType === 'brand' && (
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Quick add brands:
                </span>
                {brandSuggestions.map((brand) => (
                  <Tag
                    key={brand}
                    style={{ cursor: 'pointer', margin: '2px' }}
                    onClick={() => {
                      if (!newFilter.subFilterName.includes(brand)) {
                        setNewFilter({
                          ...newFilter,
                          subFilterName: [...newFilter.subFilterName, brand],
                        });
                      }
                    }}
                  >
                    + {brand}
                  </Tag>
                ))}
              </div>
            )}
            <AntInput.TextArea
              value={newFilter.subFilterName.join(', ')}
              onChange={(e) => {
                setNewFilter({
                  ...newFilter,
                  subFilterName: e.target.value
                    .split(',')
                    .map((item) => item.trim()),
                });
              }}
              placeholder={
                newFilter.filterType === 'brand'
                  ? 'Enter brand names separated by commas (e.g., Nike, Adidas, Apple)'
                  : 'Enter sub-filter names separated by commas'
              }
              rows={4}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Current sub-filters:{' '}
              {newFilter.subFilterName.filter((item) => item.trim()).length}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FilterTable;
