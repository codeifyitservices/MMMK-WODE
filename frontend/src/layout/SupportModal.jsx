import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { createSupport } from '../apis/nonAuth/support';

const SupportModal = ({ isModalOpen, handleCancel }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const res = await createSupport(values);
      
      message.success('Message sent successfully');
      form.resetFields();
      handleCancel();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <Modal
      title="Contact Form"
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          handleSubmit(values);
          form.resetFields();
        }}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Enter a valid email' },
          ]}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: 'Name is required' },
            { type: 'name', message: 'name a valid email' },
          ]}
        >
          <Input placeholder="Enter your name" />
        </Form.Item>

        <Form.Item
          label="Phone Number"
          name="phone"
          rules={[{ required: true, message: 'Phone number is required' }]}
        >
          <Input placeholder="Enter your phone number" />
        </Form.Item>

        <Form.Item
          label="Subject"
          name="subject"
          rules={[{ required: true, message: 'Subject is required' }]}
        >
          <Input placeholder="Enter subject" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Description is required' }]}
        >
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button style={{ marginLeft: '10px' }} onClick={handleCancel}>
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SupportModal;
