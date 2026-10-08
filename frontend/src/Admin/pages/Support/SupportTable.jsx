import React, { useMemo, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Popconfirm,
  Space,
  Modal,
  Form,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { addReply, deleteSupport } from '../../../apis/admin/support';
import { useForm } from 'antd/es/form/Form';

const SupportTable = ({ data, tableQuery }) => {
  const [searchText, setSearchText] = useState('');
  const [form] = useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleSearch = (value) => {
    setSearchText(value.toLowerCase());
  };

  const handleDelete = async (id) => {
    try {
      const res = await deleteSupport(id);
      message.success('Support deleted successfully');
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to delete support');
    }
  };

  const handleReply = (record) => {
    form.setFieldValue('reply', record.reply);
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setSelectedRecord(null);
  };

  const handleModalOk = (values) => {
    try {
      const res = addReply(selectedRecord._id, values);
      message.success('Reply added successfully');
      form.resetFields();
      setIsModalVisible(false);
      setSelectedRecord(null);
      tableQuery.refetch();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to reply');
    }
  };

  const filteredData = data?.filter(
    (item) =>
      item?.name?.toLowerCase()?.includes(searchText) ||
      item?.subject?.toLowerCase()?.includes(searchText) ||
      item?.description?.toLowerCase()?.includes(searchText)
  );

  const columns = useMemo(
    () => [
      {
        title: 'S.No',
        dataIndex: 'sno',
        key: 'sno',
        render: (_, __, index) => index + 1, // Dynamically calculates the row number
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'name',
      },
      {
        title: 'Contact Number',
        dataIndex: 'phone',
        key: 'name',
      },
      {
        title: 'Subject',
        dataIndex: 'subject',
        key: 'subject',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Action',
        key: 'action',
        render: (text, record) => (
          <Space>
            {/* <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => handleReply(record)}
            /> */}
            <Popconfirm
              title="Are you sure you want to delete this item?"
              onConfirm={() => handleDelete(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [data]
  );

  return (
    <div
      style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          placeholder="Search"
          allowClear
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: '300px' }}
        />
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 5 }}
          bordered
          style={{ background: '#fff' }}
        />
      </Space>
      <Modal
        title={`Reply to ${selectedRecord?.user?.name}`}
        visible={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleModalOk}>
          <Form.Item
            name="reply"
            rules={[{ required: true, message: 'Please enter your reply!' }]}
          >
            <Input.TextArea placeholder="Type your reply here..." rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={handleModalCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Send
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportTable;
