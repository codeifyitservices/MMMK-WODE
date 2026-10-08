import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { createGiftcard, updateGiftCard } from '../../../apis/admin/giftCard';
import { LuRefreshCcw } from 'react-icons/lu';

const GiftCardForm = ({
  visible,
  onClose,
  query,
  editedRow,
  setEditedRow,
  setIsModalOpen,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    

    try {
      setLoading(true);

      const res = editedRow
        ? await updateGiftCard(editedRow?._id, values)
        : await createGiftcard(values);

      message.success('Gift card added successfully');
      query.refetch();
      setEditedRow(false);
      form.resetFields();
      onClose();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to add gift card');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (editedRow) {
        
        form.setFieldsValue(editedRow);
      }
    }
  }, [editedRow, visible]);

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    form.setFieldsValue({ pin: randomPin });
  };

  return (
    <Modal
      title={`${editedRow ? 'Edit' : 'Add'} Gift Card`}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Gift Card Code"
          name="code"
          rules={[{ required: false, message: 'Please enter gift card code' }]}
        >
          <Input
            disabled={!!editedRow}
            placeholder="Leave blank to auto-generate"
          />
        </Form.Item>

        {/* Gift Card Name */}
        <Form.Item
          label="Gift Card Name"
          name="name"
          rules={[{ required: true, message: 'Please enter gift card name' }]}
        >
          <Input placeholder="Enter gift card name" />
        </Form.Item>

        {/* Gift Card Value */}
        <Form.Item
          label="Gift Card Amount"
          name="amount"
          rules={[{ required: true, message: 'Please enter gift card amount' }]}
        >
          <Input type="number" placeholder="Enter amount" />
        </Form.Item>

        {/* Gift Card Status */}
        <Form.Item
          label="Gift Card Status"
          name="status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select
            placeholder="Select status"
            options={['Active', 'Redeemed', 'Expired'].map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </Form.Item>

        {/* Submit Button */}
        <Form.Item className="flex justify-end">
          <Button loading={loading} type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GiftCardForm;
