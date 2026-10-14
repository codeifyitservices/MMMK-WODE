import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, Rate, Button, message } from 'antd';
import { getAllCategory } from '../../../apis/nonAuth/category';
import { getAllProducts } from '../../../apis/admin/product';
import { addAdminReview, updateAdminReview } from '../../../apis/admin/review';
import { getReviewsByProduct } from '../../../apis/nonAuth/review';

const ReviewModal = ({ isVisible, onClose, onSuccess, editReview }) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productReviewCount, setProductReviewCount] = useState(null);
  const [loadingReviewCount, setLoadingReviewCount] = useState(false);

  const isEditing = Boolean(editReview && editReview._id);
  const selectedCategory = Form.useWatch('category', form);
  const selectedProduct = Form.useWatch('product', form);
  const reviewText = Form.useWatch('review', form) || '';
  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).filter(Boolean).length : 0;

  // Load all categories when modal becomes visible
  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await getAllCategory();
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setCategories(list);
        }
      } catch (err) {
        message.error('Failed to load categories');
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, [isVisible]);

  // Sync form values whenever modal opens or editReview changes
  useEffect(() => {
    if (!isVisible) {
      form.resetFields();
      return;
    }

    if (editReview) {
      const categoryId =
        editReview.product?.category?._id || editReview.product?.category;
      const productId =
        editReview.product?._id || editReview.product;
      const reviewerName =
        editReview.reviewerName ||
        (editReview.user
          ? `${editReview.user.firstName || ''} ${editReview.user.lastName || ''}`.trim()
          : '');

      if (editReview.product && editReview.product._id) {
        setProducts([editReview.product]);
      }

      form.setFieldsValue({
        category: categoryId,
        product: productId,
        reviewerName: reviewerName,
        rating: editReview.rating || 5,
        review: editReview.review || '',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ rating: 5 });
    }
  }, [isVisible, editReview, form]);

  // Load products filtered by selected category
  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      return;
    }

    let isMounted = true;
    const fetchProductsByCategory = async () => {
      try {
        setLoadingProducts(true);
        const res = await getAllProducts({
          category: selectedCategory,
          pageSize: 1000,
          currentPage: 1,
        });
        if (isMounted) {
          const list = res?.data || [];
          // If editing and current product is in this category, ensure it is included
          if (
            editReview?.product &&
            editReview.product._id &&
            !list.some((p) => p._id === editReview.product._id)
          ) {
            setProducts([editReview.product, ...list]);
          } else {
            setProducts(list);
          }
        }
      } catch (err) {
        message.error('Failed to load products for selected category');
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    fetchProductsByCategory();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, editReview]);

  // Check review count for the selected product
  useEffect(() => {
    if (!selectedProduct) {
      setProductReviewCount(null);
      return;
    }

    let isMounted = true;
    const checkProductReviews = async () => {
      try {
        setLoadingReviewCount(true);
        const res = await getReviewsByProduct(selectedProduct);
        if (isMounted) {
          const list = res?.data || [];
          const adminCount = list.filter((r) => r.isAdminReview || !r.user).length;
          setProductReviewCount(adminCount);
        }
      } catch {
        if (isMounted) setProductReviewCount(null);
      } finally {
        if (isMounted) setLoadingReviewCount(false);
      }
    };

    checkProductReviews();
    return () => {
      isMounted = false;
    };
  }, [selectedProduct]);

  const handleCategoryChange = () => {
    // Reset product selection whenever category changes manually
    form.setFieldValue('product', undefined);
    setProductReviewCount(null);
  };

  const handleSubmit = async (values) => {
    try {
      if (!isEditing && productReviewCount !== null && productReviewCount >= 10) {
        message.error(
          'Maximum limit reached. Cannot add more than 10 reviews for this product.'
        );
        return;
      }

      setIsSubmitting(true);
      if (isEditing) {
        await updateAdminReview(editReview._id, {
          product: values.product,
          reviewerName: values.reviewerName,
          rating: values.rating,
          review: values.review,
        });
        message.success('Review updated successfully');
      } else {
        await addAdminReview({
          product: values.product,
          reviewerName: values.reviewerName,
          rating: values.rating,
          review: values.review,
        });
        message.success('Review added successfully');
      }

      form.resetFields();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          (isEditing ? 'Failed to update review' : 'Failed to add review')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setProductReviewCount(null);
    if (onClose) onClose();
  };

  const isLimitReached = !isEditing && productReviewCount !== null && productReviewCount >= 10;

  return (
    <Modal
      title={isEditing ? 'Edit Review' : 'Add Review for Product'}
      open={isVisible}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={560}
      centered
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ rating: 5 }}
        className="mt-4"
      >
        {/* Category Dropdown */}
        <Form.Item
          name="category"
          label={<span className="font-medium text-gray-700">Select Category</span>}
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            placeholder="Choose category (e.g. Perfumes, Dresses, Gym Items)"
            loading={loadingCategories}
            showSearch
            optionFilterProp="label"
            onChange={handleCategoryChange}
            options={categories.map((cat) => ({
              label: cat.name?.en || cat.name || 'Unnamed Category',
              value: cat._id,
            }))}
          />
        </Form.Item>

        {/* Product Dropdown (Filtered by selected category) */}
        <Form.Item
          name="product"
          label={<span className="font-medium text-gray-700">Select Product</span>}
          rules={[{ required: true, message: 'Please select a product' }]}
          className="mb-2"
        >
          <Select
            placeholder={
              selectedCategory
                ? products.length === 0 && !loadingProducts
                  ? 'No products found in this category'
                  : 'Choose a product'
                : 'Select a category first'
            }
            disabled={!selectedCategory}
            loading={loadingProducts || loadingReviewCount}
            showSearch
            optionFilterProp="label"
            options={products.map((prod) => ({
              label: prod.productName?.en || prod.productName || 'Unnamed Product',
              value: prod._id,
            }))}
          />
        </Form.Item>

        {/* 10-Review Limit Indicator */}
        {selectedProduct && productReviewCount !== null && (
          <div className="mb-4">
            {isLimitReached ? (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md flex items-center justify-between">
                <span className="font-semibold">
                  ⚠️ Maximum limit reached: 10 / 10 reviews already added.
                </span>
                <span className="bg-red-200 px-2 py-0.5 rounded text-red-800 text-[11px] font-bold">
                  10 / 10
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200">
                <span>Admin reviews for this product:</span>
                <span
                  className={`font-semibold ${
                    productReviewCount >= 8 ? 'text-amber-600' : 'text-blue-600'
                  }`}
                >
                  {productReviewCount} / 10
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reviewer Name */}
        <Form.Item
          name="reviewerName"
          label={<span className="font-medium text-gray-700">Reviewer Name</span>}
          rules={[
            { required: true, message: 'Please provide a reviewer name' },
            { whitespace: true, message: 'Name cannot be empty' },
          ]}
        >
          <Input placeholder="Enter display name (e.g. Dev, Sarah M., John D.)" maxLength={80} />
        </Form.Item>

        {/* Star Rating */}
        <Form.Item
          name="rating"
          label={<span className="font-medium text-gray-700">Star Rating</span>}
          rules={[{ required: true, message: 'Please select rating' }]}
        >
          <Rate allowClear={false} count={5} className="text-yellow-400" />
        </Form.Item>

        {/* Review Text */}
        <Form.Item
          name="review"
          label={
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-gray-700">Review Text</span>
              <span
                className={`text-xs ${
                  wordCount > 100
                    ? 'text-red-600 font-bold'
                    : wordCount >= 85
                    ? 'text-amber-600 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {wordCount} / 100 words
              </span>
            </div>
          }
          rules={[
            { required: true, message: 'Please enter review text' },
            { whitespace: true, message: 'Review cannot be empty' },
            {
              validator(_, value) {
                if (!value) return Promise.resolve();
                const words = value.trim().split(/\s+/).filter(Boolean);
                if (words.length > 100) {
                  return Promise.reject(
                    new Error(`Review cannot exceed 100 words (currently ${words.length} words)`)
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Write the product experience and customer feedback here (max 100 words)..."
          />
        </Form.Item>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            disabled={isSubmitting || isLimitReached || wordCount > 100}
          >
            {isEditing ? 'Update Review' : 'Add Review'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ReviewModal;
