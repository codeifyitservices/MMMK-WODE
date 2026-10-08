import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Image,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { updateHomeSection2 } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
import { appendCompressedImage } from '../../../../../utils/imageCompression';

const Section2Form = ({ data, query }) => {
  const [form] = useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leftImage, setLeftImage] = useState(null);
  const [rightImage, setRightImage] = useState(null);

  const [leftFileList, setLeftFileList] = useState([]);
  const [rightFileList, setRightFileList] = useState([]);

  const handleImageChange = (info, setImage, setFileList) => {
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
      if (key !== 'leftImage' && key !== 'rightImage') {
        formData.append(key, values[key]);
      }
    });
    await appendCompressedImage(
      formData,
      'leftImage',
      values?.leftImage?.fileList?.[0]
    );
    await appendCompressedImage(
      formData,
      'rightImage',
      values?.rightImage?.fileList?.[0]
    );

    try {
      const res = await updateHomeSection2(formData);
      
      query.refetch();
      setIsModalOpen(false);
      message.success('Section updated successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to add content');
    }
  };

  useEffect(() => {
    form.setFieldValue('titleEnglish', data?.title?.en);
    form.setFieldValue('titleArabic', data?.title?.ar);
    form.setFieldValue('titleFrench', data?.title?.fr);
    form.setFieldValue('titleRussian', data?.title?.ru);

    form.setFieldValue('subtitleEnglish', data?.subtitle?.en);
    form.setFieldValue('subtitleArabic', data?.subtitle?.ar);
    form.setFieldValue('subtitleFrench', data?.subtitle?.fr);
    form.setFieldValue('subtitleRussian', data?.subtitle?.ru);

    if (data?.leftImage) {
      setLeftFileList([
        { url: resolveAssetUrl(data?.leftImage) },
      ]);
    }

    if (data?.rightImage) {
      setRightFileList([
        { url: resolveAssetUrl(data?.rightImage) },
      ]);
    }
  }, [data]);

  return (
    <div className="flex justify-end mb-2 items-center">
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Edit
      </Button>

      <Modal
        title="Add Content"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Row gutter={16}>
            {/* Left Image Upload */}
            <Col span={12}>
              <Form.Item label="Left Image" name="leftImage">
                <Upload
                  listType="picture-card"
                  fileList={leftFileList}
                  onPreview={(file) => {
                    window.open(file.url || file.thumbUrl);
                  }}
                  beforeUpload={() => false} // Disable automatic upload
                  onChange={(info) =>
                    handleImageChange(info, setLeftImage, setLeftFileList)
                  }
                >
                  {leftFileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            {/* Right Image Upload */}
            <Col span={12}>
              <Form.Item label="Right Image" name="rightImage">
                <Upload
                  listType="picture-card"
                  fileList={rightFileList}
                  onPreview={(file) => {
                    window.open(file.url || file.thumbUrl);
                  }}
                  beforeUpload={() => false} // Disable automatic upload
                  onChange={(info) =>
                    handleImageChange(info, setRightImage, setRightFileList)
                  }
                >
                  {rightFileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          {/* English Title */}
          <Form.Item
            label="Title (English)"
            name="titleEnglish"
            rules={[
              { required: true, message: 'Please enter the title in English!' },
            ]}
          >
            <Input placeholder="Enter title in English" />
          </Form.Item>

          {/* Arabic Title */}
          <Form.Item
            label="Title (Arabic)"
            name="titleArabic"
            rules={[
              { required: true, message: 'Please enter the title in Arabic!' },
            ]}
          >
            <Input placeholder="Enter title in Arabic" dir="rtl" />
          </Form.Item>

          {/* French Title */}
          <Form.Item
            label="Title (French)"
            name="titleFrench"
            rules={[
              { required: true, message: 'Please enter the title in French!' },
            ]}
          >
            <Input placeholder="Enter title in French" />
          </Form.Item>

          {/* French Russian */}
          <Form.Item
            label="Title (Russian)"
            name="titleRussian"
            rules={[
              { required: true, message: 'Please enter the title in Russian!' },
            ]}
          >
            <Input placeholder="Enter title in Russian" />
          </Form.Item>

          {/* English Subtitle */}
          <Form.Item
            label="Subtitle (English)"
            name="subtitleEnglish"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in English!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in English" />
          </Form.Item>

          {/* Arabic Subtitle */}
          <Form.Item
            label="Subtitle (Arabic)"
            name="subtitleArabic"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in Arabic!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in Arabic" dir="rtl" />
          </Form.Item>

          {/* French Subtitle */}
          <Form.Item
            label="Subtitle (French)"
            name="subtitleFrench"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in French!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in French" />
          </Form.Item>

          {/* Rissian Subtitle */}
          <Form.Item
            label="Subtitle (Russian)"
            name="subtitleRussian"
            rules={[
              {
                required: true,
                message: 'Please enter the subtitle in Russian!',
              },
            ]}
          >
            <Input placeholder="Enter subtitle in Russian" />
          </Form.Item>

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

export default Section2Form;
