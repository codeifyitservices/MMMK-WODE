import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button, Upload, Row, Col, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { updateHomeSection8 } from '../../../../../apis/admin/editPage';
import { resolveAssetUrl } from '../../../../../utils/assetUrl';
import { appendCompressedImage } from '../../../../../utils/imageCompression';

const Section8Form = ({ data, query }) => {
  const [form] = useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [leftFileList, setLeftFileList] = useState([]);
  const [centerFileList, setCenterFileList] = useState([]);
  const [rightFileList, setRightFileList] = useState([]);

  const handleImageChange = (info, setFileList) => {
    const { fileList } = info;
    setFileList(fileList.slice(-1));
  };

  const handleFinish = async (values) => {
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (!key.includes('Image')) {
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
      const res = await updateHomeSection8(formData);
      query.refetch();
      setIsModalOpen(false);
      message.success('Section updated successfully');
    } catch (err) {
      
      message.error(err?.response?.data?.message || 'Failed to update content');
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      leftTitleEnglish: data?.leftTitle?.en,
      leftTitleArabic: data?.leftTitle?.ar,
      leftTitleFrench: data?.leftTitle?.fr,
      leftTitleRussian: data?.leftTitle?.ru,

      leftSubtitleEnglish: data?.leftSubtitle?.en,
      leftSubtitleArabic: data?.leftSubtitle?.ar,
      leftSubtitleFrench: data?.leftSubtitle?.fr,
      leftSubtitleRussian: data?.leftSubtitle?.ru,

      centerTitleEnglish: data?.centerTitle?.en,
      centerTitleArabic: data?.centerTitle?.ar,
      centerTitleFrench: data?.centerTitle?.fr,
      centerTitleRussian: data?.centerTitle?.ru,

      rightTitleEnglish: data?.rightTitle?.en,
      rightTitleArabic: data?.rightTitle?.ar,
      rightTitleFrench: data?.rightTitle?.fr,
      rightTitleRussian: data?.rightTitle?.ru,

      rightSubtitleEnglish: data?.rightSubtitle?.en,
      rightSubtitleArabic: data?.rightSubtitle?.ar,
      rightSubtitleFrench: data?.rightSubtitle?.fr,
      rightSubtitleRussian: data?.rightSubtitle?.ru,
    });

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
        Edit Section
      </Button>

      <Modal
        title="Edit Section"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Row gutter={16}>
            {/* Left Section */}
            <Col span={8}>
              <Form.Item
                label="Left Title (English)"
                name="leftTitleEnglish"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in English!',
                  },
                ]}
              >
                <Input placeholder="Enter left title in English" />
              </Form.Item>
              <Form.Item
                label="Left Title (Arabic)"
                name="leftTitleArabic"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Arabic!',
                  },
                ]}
              >
                <Input placeholder="Enter left title in Arabic" dir="rtl" />
              </Form.Item>

              <Form.Item
                label="Left Title (French)"
                name="leftTitleFrench"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in French!',
                  },
                ]}
              >
                <Input placeholder="Enter left title in French" />
              </Form.Item>

              <Form.Item
                label="Left Title (Russian)"
                name="leftTitleRussian"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Russian!',
                  },
                ]}
              >
                <Input placeholder="Enter left title in Russian" />
              </Form.Item>

              {/* #################### subtitle ################ */}
              <Form.Item
                label="Left Subtitle (English)"
                name="leftSubtitleEnglish"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in English!',
                  },
                ]}
              >
                <Input placeholder="Enter left subtitle in English" />
              </Form.Item>
              <Form.Item
                label="Left Subtitle (Arabic)"
                name="leftSubtitleArabic"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in Arabic!',
                  },
                ]}
              >
                <Input placeholder="Enter left subtitle in Arabic" dir="rtl" />
              </Form.Item>

              <Form.Item
                label="Left Subtitle (French)"
                name="leftSubtitleFrench"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in French!',
                  },
                ]}
              >
                <Input placeholder="Enter left subtitle in French" />
              </Form.Item>

              <Form.Item
                label="Left Subtitle (Russian)"
                name="leftSubtitleRussian"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in Russian!',
                  },
                ]}
              >
                <Input placeholder="Enter left subtitle in Russian" />
              </Form.Item>

              <Form.Item label="Left Image" name="leftImage">
                <Upload
                  listType="picture-card"
                  fileList={leftFileList}
                  beforeUpload={() => false}
                  onChange={(info) => handleImageChange(info, setLeftFileList)}
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

            {/* ############### Center title ############ */}

            {/* Center Section */}
            <Col span={8}>
              <Form.Item
                label="Center Title (English)"
                name="centerTitleEnglish"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in English!',
                  },
                ]}
              >
                <Input placeholder="Enter center title in English" />
              </Form.Item>

              <Form.Item
                label="Center Title (Arabic)"
                name="centerTitleArabic"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Arabic!',
                  },
                ]}
              >
                <Input placeholder="Enter center title in Arabic" dir="rtl" />
              </Form.Item>

              <Form.Item
                label="Center Title (French)"
                name="centerTitleFrench"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in French!',
                  },
                ]}
              >
                <Input placeholder="Enter center title in French" />
              </Form.Item>

              <Form.Item
                label="Center Title (Russian)"
                name="centerTitleRussian"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Russian!',
                  },
                ]}
              >
                <Input placeholder="Enter center title in Russian" />
              </Form.Item>
            </Col>

            {/* ################# Right section ########## */}

            {/* Right Section */}
            <Col span={8}>
              <Form.Item
                label="Right Title (English)"
                name="rightTitleEnglish"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in English!',
                  },
                ]}
              >
                <Input placeholder="Enter right title in English" />
              </Form.Item>

              <Form.Item
                label="Right Title (Arabic)"
                name="rightTitleArabic"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Arabic!',
                  },
                ]}
              >
                <Input placeholder="Enter right title in Arabic" dir="rtl" />
              </Form.Item>

              <Form.Item
                label="Right Title (French)"
                name="rightTitleFrench"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in French!',
                  },
                ]}
              >
                <Input placeholder="Enter right title in French" />
              </Form.Item>

              <Form.Item
                label="Right Title (Russian)"
                name="rightTitleRussian"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the title in Russian!',
                  },
                ]}
              >
                <Input placeholder="Enter right title in Russian" />
              </Form.Item>

              {/* ################## Right subtitle ################ */}

              <Form.Item
                label="Right Subtitle (English)"
                name="rightSubtitleEnglish"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in English!',
                  },
                ]}
              >
                <Input placeholder="Enter right subtitle in English" />
              </Form.Item>

              <Form.Item
                label="Right Subtitle (Arabic)"
                name="rightSubtitleArabic"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in Arabic!',
                  },
                ]}
              >
                <Input placeholder="Enter right subtitle in Arabic" dir="rlt" />
              </Form.Item>

              <Form.Item
                label="Right Subtitle (French)"
                name="rightSubtitleFrench"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in French!',
                  },
                ]}
              >
                <Input placeholder="Enter right subtitle in French" />
              </Form.Item>

              <Form.Item
                label="Right Subtitle (Russian)"
                name="rightSubtitleRussian"
                rules={[
                  {
                    required: true,
                    message: 'Please enter the subtitle in Russian!',
                  },
                ]}
              >
                <Input placeholder="Enter right subtitle in Russian" />
              </Form.Item>

              <Form.Item label="Right Image" name="rightImage">
                <Upload
                  listType="picture-card"
                  fileList={rightFileList}
                  beforeUpload={() => false}
                  onChange={(info) => handleImageChange(info, setRightFileList)}
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

export default Section8Form;
