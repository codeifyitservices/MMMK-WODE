import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, InputNumber, message } from 'antd';
import { updateOrder } from '../../../apis/admin/order';

const { Option } = Select;

const OrderFormModal = ({ editData, onCancel, tableQuery }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    try {
      if (!editData?._id) {
        message.error('No order selected');
        return;
      }

      const res = await updateOrder(editData._id, {
        status: values.status,
        deliveryStatus: values.deliveryStatus,
        paymentStatus: values.paymentStatus,
      });
      
      message.success('Order updated successfully');
      tableQuery.refetch();
      form.resetFields();
      onCancel();
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'failed to update status');
    }
  };

  useEffect(() => {
    if (editData) {
      form.setFieldsValue({
        user: editData?.userId?.firstName
          ? `${editData.userId.firstName} ${editData.userId.lastName || ''}`.trim()
          : '',
        amountUSD: editData?.displayAmountUSD,
        amountOriginal: editData?.displayAmountOriginal,
        paymentType: editData?.mode,
        pendingAmount: editData?.displayPendingAmount,
        status: editData?.status,
        deliveryStatus: editData?.deliveryStatus,
        paymentStatus: editData?.paymentStatus,
      });
    } else {
      form.resetFields();
    }
  }, [editData, form]);

  return (
    <Modal
      open={Boolean(editData)}
      title="Update order status"
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        {/* User Field */}
        <Form.Item
          label="User"
          name="user"
          rules={[{ required: true, message: 'Please enter a user ID' }]}
        >
          <Input placeholder="User" disabled={true} />
        </Form.Item>

        {/* Status Field */}
        <Form.Item
          label="Status"
          name="status"
          rules={[{ required: true, message: 'Please select a status' }]}
        >
          <Select>
            <Option value="Pending">Pending</Option>
            <Option value="Processing">Processing</Option>
            <Option value="Complete">Complete</Option>
            <Option value="Cancelled">Cancelled</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Delivery Status"
          name="deliveryStatus"
          rules={[{ required: true, message: 'Please select a delivery status' }]}
        >
          <Select>
            <Option value="Pending">Pending</Option>
            <Option value="Processing">Processing</Option>
            <Option value="In Transit">In Transit</Option>
            <Option value="Out for Delivery">Out for Delivery</Option>
            <Option value="Delivered">Delivered</Option>
            <Option value="Failed">Failed</Option>
            <Option value="Returned">Returned</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Payment Status"
          name="paymentStatus"
          rules={[{ required: true, message: 'Please select a payment status' }]}
        >
          <Select>
            <Option value="Pending">Pending</Option>
            <Option value="Paid">Paid</Option>
            <Option value="Failed">Failed</Option>
          </Select>
        </Form.Item>

        {/* Amount USD Field */}
        <Form.Item
          label="Amount (USD)"
          name="amountUSD"
        >
          <InputNumber
            style={{ width: '100%' }}
            disabled={true}
            formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          />
        </Form.Item>

        {/* Amount Original Field */}
        <Form.Item
          label={`Paid Amount (${editData?.displayCurrency || 'Original'})`}
          name="amountOriginal"
        >
          <InputNumber
            style={{ width: '100%' }}
            disabled={true}
          />
        </Form.Item>

        {editData?.mode === 'cod' && (
          <Form.Item
            label={`Pending Amount (COD) (${editData?.displayCurrency || 'Original'})`}
            name="pendingAmount"
          >
            <InputNumber
              style={{ width: '100%', color: 'red', fontWeight: 'bold' }}
              disabled={true}
            />
          </Form.Item>
        )}

        {/* Payment Type Field */}
        <Form.Item
          label="Payment Type"
          name="paymentType"
          rules={[{ required: true, message: 'Please enter a payment type' }]}
        >
          <Input placeholder="Enter payment type" disabled={true} />
        </Form.Item>

        {/* Submit Button */}
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Update
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderFormModal;
