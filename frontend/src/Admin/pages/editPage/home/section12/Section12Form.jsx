import React, { useEffect, useState } from 'react';
import { Form, Button, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { updateHomeSection12 } from '../../../../../apis/admin/editPage';

const { Dragger } = Upload;

const VideoUploadForm = ({ data, query }) => {
  const [fileList, setFileList] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);

  useEffect(() => {
    const formattedFiles = (data?.videos || []).map((video, index) => ({
      uid: `${index}`,
      name: video.split('/').pop(),
      url: video,
      status: 'done',
    }));
    setFileList(formattedFiles);
  }, [data]);

  const onFinish = async () => {
    const formData = new FormData();

    // Append new files to FormData
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('videos', file.originFileObj); // New files
      } else {
        formData.append('existingVideos', file.url); // Existing files
      }
    });

    formData.append('deletedFiles', JSON.stringify(deletedFiles));

    try {
      const res = await updateHomeSection12(formData);
      
      query.refetch();
      setDeletedFiles([]);
      message.success('Videos uploaded successfully!');
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || 'Failed to upload videos');
    }
  };

  const props = {
    name: 'file',
    multiple: true,
    fileList,
    accept: 'video/*',
    beforeUpload: (file) => {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error(`${file.name} is not a video file`);
      }
      return isVideo || Upload.LIST_IGNORE;
    },
    onChange: (info) => {
      if (info.file.status === 'removed') {
        return;
      }

      const updatedFileList = info.fileList.filter((file) => {
        if (file.type && file.type.startsWith('video/')) {
          return true;
        }
        message.error(`${file.name} is not a video file`);
        return false;
      });
      setFileList(updatedFileList);
    },
    onRemove: (file) => {
      if (!file.originFileObj) {
        setDeletedFiles((prev) => [...prev, file.name]);
      }
      setFileList((prev) => prev.filter((item) => item.uid !== file.uid));
    },
  };

  return (
    <div className="container">
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="videos"
          label="Upload Videos"
          rules={[
            { required: true, message: 'Please upload at least one video!' },
          ]}
        >
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag videos to this area to upload
            </p>
            <p className="ant-upload-hint">Supports multiple video uploads.</p>
          </Dragger>
        </Form.Item>
        <Form.Item className="flex justify-end">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default VideoUploadForm;
