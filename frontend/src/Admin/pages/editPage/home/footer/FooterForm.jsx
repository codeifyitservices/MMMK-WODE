import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Space,
  Upload,
  message,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { updateFooter } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
import { appendCompressedImage } from '../../../../../utils/imageCompression';

const { Option } = Select;

const FooterForm = ({ data, query }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (data) {
      const updateFooterLinks = data?.footerLinks?.map((link) => ({
        text: link.text.en,
        arabicText: link.text.ar,
        link: link.link,
      }));

      form.setFieldsValue({
        footerContent: data?.footerContent,
        footerLinks: updateFooterLinks,
        socialLinks: data?.socialLinks,
        footerImage:
          resolveAssetUrl(data.image)
            ? [
                {
                  uid: '-1',
                  name: 'Footer Image',
                  status: 'done',
                  url: resolveAssetUrl(data.image),
                },
              ]
            : [],
      });
    }
  }, [data]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const formData = new FormData();
      await appendCompressedImage(formData, 'image', values?.footerImage?.[0]);
      formData.append('footerContent', JSON.stringify(values?.footerContent));
      formData.append('footerLinks', JSON.stringify(values?.footerLinks));
      formData.append('socialLinks', JSON.stringify(values?.socialLinks));
      const res = await updateFooter(formData);
      
      query.refetch();
      message.success('Footer updated successfully');
      setIsModalVisible(false);
    } catch (err) {
      
      
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  return (
    <>
      <div className="w-full flex justify-end py-5">
        <Button className="block" type="primary" onClick={showModal}>
          Edit Footer
        </Button>
      </div>

      <Modal
        title="Edit Footer"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Save"
        cancelText="Cancel"
        width={700}
      >
        <Form
          form={form}
          layout="horizontal"
          name="footer_edit_form"
          initialValues={{
            collections: [],
            socialLinks: { snapchat: '', instagram: '' },
          }}
        >
          {/* MMMK Wood Collections */}
          <Form.List name="footerLinks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, fieldKey, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    {/* Text Input */}
                    <Form.Item
                      {...restField}
                      name={[name, 'text']}
                      fieldKey={[fieldKey, 'text']}
                      rules={[
                        {
                          required: true,
                          message: 'Please add link text!',
                        },
                      ]}
                    >
                      <Input placeholder="Enter link text" />
                    </Form.Item>

                    {/* Arabic Text Input */}
                    <Form.Item
                      {...restField}
                      name={[name, 'arabicText']}
                      fieldKey={[fieldKey, 'arabicText']}
                      rules={[
                        {
                          required: true,
                          message: 'Please add Arabic text!',
                        },
                      ]}
                    >
                      <Input placeholder="Enter Arabic text" dir="rtl" />
                    </Form.Item>

                    {/* Dropdown for Associated Link */}
                    <Form.Item
                      {...restField}
                      name={[name, 'link']}
                      fieldKey={[fieldKey, 'link']}
                      rules={[
                        { required: true, message: 'Please select a link!' },
                      ]}
                    >
                      <Select placeholder="Select a link">
                        <Option value="/product-page">Product Page</Option>
                        <Option value="/forget-password">
                          Forget Password
                        </Option>
                        <Option value="/new-password">New Password</Option>
                        <Option value="/product-listings">
                          Product Listings
                        </Option>
                        <Option value="/product-details">
                          Product Details
                        </Option>
                        <Option value="/shopping-cart">Shopping Cart</Option>
                        <Option value="/checkout">Checkout</Option>
                        <Option value="/thank-you">Thank You</Option>
                        <Option value="/profile/my-account">Profile</Option>
                        <Option value="/checkout-form">Checkout Form</Option>
                        <Option value="/blogs">Blogs Layout</Option>
                      </Select>
                    </Form.Item>

                    {/* Remove Button */}
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Footer Links
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Content Field */}
          <Form.Item label="Footer Content" required>
            <Form.Item
              name={['footerContent', 'en']}
              noStyle
              rules={[
                {
                  required: true,
                  message: 'Please add footer content in English!',
                },
              ]}
            >
              <Input.TextArea
                placeholder="Enter footer content in English"
                rows={4}
              />
            </Form.Item>
            <Form.Item
              name={['footerContent', 'ar']}
              noStyle
              rules={[
                {
                  required: true,
                  message: 'Please add footer content in Arabic!',
                },
              ]}
            >
              <Input.TextArea
                placeholder="Enter footer content in Arabic"
                rows={4}
                dir="rtl" // Right-to-left text direction for Arabic
              />
            </Form.Item>
          </Form.Item>

          {/* Image Upload */}
          <Form.Item
            name="footerImage"
            label="Footer Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
            rules={[
              {
                required: true,
                message: 'Please upload an image!',
              },
            ]}
          >
            <Upload
              name="footerImage"
              listType="picture"
              maxCount={1}
              beforeUpload={() => false} // Prevent automatic upload
              defaultFileList={
                data?.footerImage
                  ? [
                      {
                        uid: '-1', // Unique identifier
                        name: 'Footer Image', // Name displayed in the file list
                        status: 'done', // Marks the file as uploaded
                        url: resolveAssetUrl(data.footerImage),
                      },
                    ]
                  : []
              }
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

          {/* Social Media Links */}
          <Form.Item
            name={['socialLinks', 'snapchat']}
            label="Snapchat Link"
            rules={[
              {
                type: 'url',
                message: 'Please enter a valid URL!',
              },
            ]}
          >
            <Input placeholder="Enter Snapchat URL" />
          </Form.Item>
          <Form.Item
            name={['socialLinks', 'instagram']}
            label="Instagram Link"
            rules={[
              {
                type: 'url',
                message: 'Please enter a valid URL!',
              },
            ]}
          >
            <Input placeholder="Enter Instagram URL" />
          </Form.Item>

          {/* Additional Social Media Links */}
          <Form.Item
            name={['socialLinks', 'facebook']}
            label="Facebook Link"
            rules={[
              {
                type: 'url',
                message: 'Please enter a valid URL!',
              },
            ]}
          >
            <Input placeholder="Enter Facebook URL" />
          </Form.Item>
          <Form.Item
            name={['socialLinks', 'twitter']}
            label="Twitter Link"
            rules={[
              {
                type: 'url',
                message: 'Please enter a valid URL!',
              },
            ]}
          >
            <Input placeholder="Enter Twitter URL" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default FooterForm;
