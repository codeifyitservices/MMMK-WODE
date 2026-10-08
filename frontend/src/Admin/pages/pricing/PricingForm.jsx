import React, { useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { getPricing, updatePricing } from '../../../apis/admin/pricing';
import { useQuery } from '@tanstack/react-query';

const PricingForm = () => {
  const [form] = Form.useForm();

  const query = useQuery({
    queryKey: ['pricing'],
    queryFn: () => getPricing(),
  });

  const onFinish = async (values) => {
    try {
      const res = await updatePricing(values);
      
      message.success('Pricing update sucessfully');
    } catch (err) {
      
      message.error(err.response.data.message || 'Failed to update pricing');
    }
  };

  useEffect(() => {
    if (query.data) {
      form.setFieldsValue(query.data);
    }
  }, [query.data]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Pricing</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
        >
          {/* Shipping Cost */}
          <Form.Item
            label="Shipping Cost"
            name="shippingCost"
            rules={[
              { required: true, message: 'Please enter the shipping cost' },
            ]}
          >
            <Input
              type="number"
              placeholder="Enter shipping cost"
              className="rounded-md"
            />
          </Form.Item>

          {/* Taxes */}
          <Form.Item
            label="Taxes (%)"
            name="taxes"
            rules={[
              { required: true, message: 'Please enter the taxes percentage' },
            ]}
          >
            <Input
              type="number"
              placeholder="Enter taxes percentage"
              className="rounded-md"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full rounded-md bg-blue-500 hover:bg-blue-600"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default PricingForm;
