import React, { useEffect, useState } from 'react';
import { Form, Select, Button, message } from 'antd';
import 'antd/dist/reset.css';
import {
  getSectionProducts,
  updateSectionProducts,
} from '../../../../../apis/admin/editPage';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'antd/es/form/Form';
import { getAllProducts } from '../../../../../apis/admin/product';

const { Option } = Select;

const FormWithFields = () => {
  const [products, setProducts] = useState([]);
  const sections = [3, 7];
  const [form] = useForm();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => getAllProducts(),
  });

  const query = useQuery({
    queryKey: ['section-products'],
    queryFn: () => getSectionProducts(),
  });

  const handleFinish = async (values) => {
    try {
      const res = await updateSectionProducts(values);
      
      message.success('Section products updated successfully');
    } catch (err) {
      
      message.error(
        err?.response?.data?.message || 'Failed to updated section products'
      );
    }
  };

  useEffect(() => {
    if (productsQuery.data) {
      setProducts(() => {
        return productsQuery.data?.data?.map((list) => {
          return {
            label: list?.productName?.en,
            value: list?._id,
          };
        });
      });
    }
  }, [productsQuery.data]);

  useEffect(() => {
    if (query.data) {
      form.setFieldValue(
        'section3_product',
        query.data?.data?.section3_product?._id
      );
      form.setFieldValue(
        'section7_product',
        query.data?.data?.section7_product?._id
      );
    }
  }, [query.data]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-xl bg-white p-8 rounded-md shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Dynamic Form</h2>
        <Form
          name="dynamic_form"
          layout="vertical"
          onFinish={handleFinish}
          className="space-y-6"
          form={form}
        >
          {sections.map((section) => (
            <Form.Item
              key={`section${section}_product`}
              name={`section${section}_product`}
              label={`Section ${section} Product`}
              rules={[
                {
                  required: true,
                  message: `Please select a product for Section ${section}!`,
                },
              ]}
            >
              <Select placeholder={`Select product for Section ${section}`}>
                {products?.map((product, index) => (
                  <Option key={index} value={product.value}>
                    {product.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ))}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default FormWithFields;
