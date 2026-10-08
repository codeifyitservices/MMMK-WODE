import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Checkbox,
  Button,
  message,
  Select,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import { createCoupon, updateCoupon } from '../../../apis/admin/coupon';
import { getAllCategories } from '../../../apis/admin/category';
import { getAllProducts } from '../../../apis/admin/product';
import dayjs from 'dayjs';

const { Option } = Select;

const CouponForm = ({ isModalVisible, handleCancel, tableQuery, currentEditCoupon }) => {
  const [form] = useForm();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [scope, setScope] = useState('All');
  const [loading, setLoading] = useState(false);

  const [applyToProducts, setApplyToProducts] = useState(true);
  const [applyToDelivery, setApplyToDelivery] = useState(false);

  useEffect(() => {
    const fetchScopeData = async () => {
      try {
        const catRes = await getAllCategories();
        setCategories(catRes?.data || []);

        const prodRes = await getAllProducts({ pageSize: 1000 }); // Adjust as needed
        setProducts(prodRes?.data || []);
      } catch (err) {
        console.error('Failed to fetch categories/products', err);
      }
    };

    if (isModalVisible) {
      fetchScopeData();
      if (currentEditCoupon) {
        form.setFieldsValue({
          ...currentEditCoupon,
          expiryDate: currentEditCoupon.expiryDate ? dayjs(currentEditCoupon.expiryDate) : null,
          scopeCategory: Array.isArray(currentEditCoupon.scopeCategory)
            ? currentEditCoupon.scopeCategory.map(cat => cat?._id || cat)
            : (currentEditCoupon.scopeCategory?._id || currentEditCoupon.scopeCategory
              ? [currentEditCoupon.scopeCategory?._id || currentEditCoupon.scopeCategory]
              : []),
          scopeProduct: currentEditCoupon.scopeProduct?._id || currentEditCoupon.scopeProduct,
        });
        setScope(currentEditCoupon.scope || 'All');
        setApplyToProducts(currentEditCoupon.applyToProducts !== false);
        setApplyToDelivery(!!currentEditCoupon.applyToDelivery);
      } else {
        form.resetFields();
        setScope('All');
        setApplyToProducts(true);
        setApplyToDelivery(false);
      }
    }
  }, [isModalVisible, currentEditCoupon, form]);

  const handleFinish = async (value) => {
    setLoading(true);
    try {
      if (currentEditCoupon?._id) {
        await updateCoupon(currentEditCoupon._id, value);
        message.success('Coupon updated successfully');
      } else {
        await createCoupon(value);
        message.success('Coupon created successfully');
      }
      handleCancel();
      tableQuery.refetch();
      form.resetFields();
      setScope('All');
      setApplyToProducts(true);
      setApplyToDelivery(false);
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={currentEditCoupon ? "Edit Coupon" : "Create Coupon"}
      visible={isModalVisible}
      onCancel={handleCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          scope: 'All',
          discountType: 'percentage',
          applyToProducts: true,
          applyToDelivery: false,
          deliveryDiscountType: 'percentage',
          perUserLimit: 1,
          showToUsers: true,
        }}
      >
        <Form.Item
          label="Coupon Name"
          name="couponName"
          rules={[{ required: true, message: 'Please enter the coupon name' }]}
        >
          <Input placeholder="Enter coupon name" />
        </Form.Item>

        <Form.Item
          label="Coupon Code"
          name="couponCode"
          rules={[{ required: true, message: 'Please enter the coupon code' }]}
        >
          <Input placeholder="Enter coupon code" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Form.Item
            label="Expiry Date"
            name="expiryDate"
            rules={[{ required: true, message: 'Please select the expiry date' }]}
            style={{ flex: 1 }}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Per User Limit"
            name="perUserLimit"
            rules={[{ required: true, message: 'Please enter usage limit per user' }]}
            style={{ flex: 1 }}
          >
            <Input type="number" min={1} placeholder="Limit per user" />
          </Form.Item>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Form.Item name="showToUsers" valuePropName="checked" noStyle>
            <Checkbox>Show to users in Cart</Checkbox>
          </Form.Item>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Form.Item name="applyToProducts" valuePropName="checked" noStyle>
            <Checkbox onChange={(e) => setApplyToProducts(e.target.checked)}>
              Apply to Products/Categories
            </Checkbox>
          </Form.Item>
        </div>

        {applyToProducts && (
          <div
            style={{
              padding: '16px',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <Form.Item
              label="Scope"
              name="scope"
              rules={[{ required: true, message: 'Please select scope' }]}
            >
              <Select onChange={(val) => setScope(val)}>
                <Option value="All">All Products</Option>
                <Option value="Category">Specific Category</Option>
                <Option value="Product">Specific Product</Option>
              </Select>
            </Form.Item>

            {scope === 'Category' && (
              <Form.Item
                label="Select Categories"
                name="scopeCategory"
                rules={[{ required: true, message: 'Please select at least one category', type: 'array' }]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Search and select categories"
                  optionFilterProp="children"
                >
                  {categories.map((cat) => (
                    <Option key={cat._id} value={cat._id}>
                      {cat.name?.en || cat.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            {scope === 'Product' && (
              <Form.Item
                label="Select Product"
                name="scopeProduct"
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <Select
                  showSearch
                  placeholder="Search product"
                  optionFilterProp="children"
                >
                  {products.map((prod) => (
                    <Option key={prod._id} value={prod._id}>
                      {prod.productName?.en || prod.productName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                label="Product Discount Type"
                name="discountType"
                style={{ flex: 1 }}
              >
                <Select>
                  <Option value="percentage">Percentage (%)</Option>
                  <Option value="amount">Fixed Amount</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Discount Value"
                name="discount"
                rules={[
                  { required: true, message: 'Please enter the discount value' },
                ]}
                style={{ flex: 1 }}
              >
                <Input type="number" placeholder="Enter discount value" />
              </Form.Item>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <Form.Item name="applyToDelivery" valuePropName="checked" noStyle>
            <Checkbox onChange={(e) => setApplyToDelivery(e.target.checked)}>
              Apply to Delivery Charges
            </Checkbox>
          </Form.Item>
        </div>

        {applyToDelivery && (
          <div
            style={{
              padding: '16px',
              border: '1px solid #f0f0f0',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                label="Delivery Discount Type"
                name="deliveryDiscountType"
                style={{ flex: 1 }}
              >
                <Select>
                  <Option value="percentage">Percentage (%)</Option>
                  <Option value="amount">Fixed Amount</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Delivery Discount Value"
                name="deliveryDiscount"
                rules={[
                  {
                    required: true,
                    message: 'Please enter delivery discount value',
                  },
                ]}
                style={{ flex: 1 }}
              >
                <Input type="number" placeholder="Enter discount value" />
              </Form.Item>
            </div>
          </div>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }} loading={loading} disabled={loading}>
            Submit
          </Button>
          <Button onClick={handleCancel} disabled={loading}>Cancel</Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CouponForm;
