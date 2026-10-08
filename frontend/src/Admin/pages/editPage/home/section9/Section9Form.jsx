import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Upload, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { updateHomeSection9 } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
import { appendCompressedImage } from '../../../../../utils/imageCompression';

const Section9Form = ({ data, query }) => {
  const [form] = useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [fileList, setFileList] = useState([]);

  const handleImageChange = (info) => {
    const { fileList } = info;
    // Only keep the latest image in fileList
    setFileList(fileList.slice(-1));

    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      const preview = URL.createObjectURL(file);
      setImage(preview);
    } else {
      setImage(null);
    }
  };

  const handleFinish = async (values) => {
    

    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key !== 'image') {
        formData.append(key, values[key]);
      }
    });
    await appendCompressedImage(formData, 'image', values?.image?.fileList?.[0]);

    try {
      const res = await updateHomeSection9(formData);
      query.refetch();
      setIsModalOpen(false);
      message.success('Section9 updated successfully');
    } catch (err) {
      console.error(err);
      message.error('Failed to update content');
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      titleEnglish: data?.title?.en,
      titleArabic: data?.title?.ar,
      titleFrench: data?.title?.fr,
      titleRussian: data?.title?.ru,

      subTitleEnglish: data?.subtitle?.en,
      subTitleArabic: data?.subtitle?.ar,
      subTitleFrench: data?.subtitle?.fr,
      subTitleRussian: data?.subtitle?.ru,
    });

    if (data?.image) {
      setFileList([{ url: resolveAssetUrl(data.image) }]);
    }
  }, [data, form]);

  return (
    <div className="flex justify-end mb-2 items-center">
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Edit
      </Button>

      <Modal
        title="Edit Content"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {/* Title (English) */}
          <Form.Item
            label="Title (English)"
            name="titleEnglish"
            rules={[
              { required: true, message: 'Please enter the title in English!' },
            ]}
          >
            <Input placeholder="Enter title in English" />
          </Form.Item>

          {/* Title (Arabic) */}
          <Form.Item
            label="Title (Arabic)"
            name="titleArabic"
            rules={[
              { required: true, message: 'Please enter the title in Arabic!' },
            ]}
          >
            <Input placeholder="Enter title in Arabic" dir="rlt" />
          </Form.Item>

          {/* Title (French) */}
          <Form.Item
            label="Title (French)"
            name="titleFrench"
            rules={[
              { required: true, message: 'Please enter the title in French!' },
            ]}
          >
            <Input placeholder="Enter title in French" />
          </Form.Item>

          {/* Title (Russian) */}
          <Form.Item
            label="Title (Russian)"
            name="titleRussian"
            rules={[
              { required: true, message: 'Please enter the title in Russian!' },
            ]}
          >
            <Input placeholder="Enter title in Russian" />
          </Form.Item>

          {/* Subtitle (English) */}
          <Form.Item
            label="Subtitle (English)"
            name="subTitleEnglish"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in English!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in English" />
          </Form.Item>

          {/* Subtitle (Arabic) */}
          <Form.Item
            label="Subtitle (Arabic)"
            name="subTitleArabic"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in Arabic!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in Arabic" dir="rtl" />
          </Form.Item>

          {/* Subtitle (French) */}
          <Form.Item
            label="Subtitle (French)"
            name="subTitleFrench"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in French!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in French" />
          </Form.Item>

          {/* Subtitle (Russian) */}
          <Form.Item
            label="Subtitle (Russian)"
            name="subTitleRussian"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in Russian!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in Russian" />
          </Form.Item>

          {/* Image Upload */}
          <Form.Item label="Image" name="image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={(file) => {
                window.open(file.url || file.thumbUrl);
              }}
              beforeUpload={() => false} // Disable automatic upload
              onChange={handleImageChange}
            >
              {fileList.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Section9Form;
