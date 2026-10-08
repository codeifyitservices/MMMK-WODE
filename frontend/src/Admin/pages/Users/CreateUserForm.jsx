import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { userSignup } from '../../../apis/nonAuth/userAuth';

const CreateUserForm = ({ tableQuery }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const onFinish = async (values) => {
    

    try {
      const res = await userSignup(values);
      
      message.success('User create successfully');
      tableQuery.refetch();
      form.resetFields();
    } catch (err) {
      
      message.error(
        err?.response?.data?.message || 'Failed to create new user'
      );
    }

    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div className="flex justify-end items-center">
      <Button type="primary" onClick={showModal}>
        Create New User
      </Button>

      <Modal
        title="Signup Form"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4"
        >
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[
              { required: true, message: 'Please enter your first name' },
            ]}
          >
            <Input placeholder="Enter your first name" />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter your last name' }]}
          >
            <Input placeholder="Enter your last name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>

          <Form.Item className="text-right">
            <Button type="primary" htmlType="submit">
              Signup
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateUserForm;
