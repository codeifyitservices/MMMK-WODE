import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Checkbox,
  Select,
  Button,
  message,
  DatePicker,
} from 'antd';
import { updateUser } from '../../../apis/admin/user';

const UserModalForm = ({ isOpen, onCancel, refetchTable, selectedUser }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await updateUser(selectedUser._id, values);
      message.success('User updated successfully');
      refetchTable();
      form.resetFields();
      onCancel();
    } catch (err) {
      
      message.error(err?.response?.data?.message);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      form.setFieldsValue(selectedUser);
    }
  }, [selectedUser]);

  return (
    <Modal
      title="User Details"
      open={isOpen}
      onOk={handleOk}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleOk}>
          Save
        </Button>,
      ]}
    >
      <div
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '0px 10px 0px 0px',
        }}
      >
        <Form form={form} layout="vertical" name="userForm">
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter the first Name!' },
            ]}
          >
            <Input placeholder="Enter First Name" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter the last Name!' }]}
          >
            <Input placeholder="Enter Last Name" />
          </Form.Item>

          <Form.Item
            name="contactNumber"
            label="Contact Number"
            rules={[
              { required: true, message: 'Please enter the phone number!' },
            ]}
          >
            <Input placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter the email!' },
              { type: 'email', message: 'Enter a valid email!' },
            ]}
          >
            <Input disabled={true} placeholder="Enter email" />
          </Form.Item>

          <Form.Item name="isVerified" valuePropName="checked" label="Verified">
            <Checkbox>Is Verified</Checkbox>
          </Form.Item>
          {/* 
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please enter the address!" }]}
          >
            <Input.TextArea placeholder="Enter address" rows={2} />
          </Form.Item> */}

          {/* <Form.Item
            name="country"
            label="Country"
            rules={[{ required: true, message: "Please enter the country!" }]}
          >
            <Input placeholder="Enter country" />
          </Form.Item> */}

          {/* <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: "Please enter the state!" }]}
          >
            <Input placeholder="Enter state" />
          </Form.Item> */}

          {/* <Form.Item
            name="pincode"
            label="Pincode"
            rules={[
              { required: true, message: "Please enter the pincode!" },
              { pattern: /^\d{5}$/, message: "Enter a valid 5-digit pincode!" },
            ]}
          >
            <Input placeholder="Enter pincode" />
          </Form.Item> */}

          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: 'Please select the gender!' }]}
          >
            <Select placeholder="Select gender">
              <Select.Option value="Male">Male</Select.Option>
              <Select.Option value="Female">Female</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default UserModalForm;
