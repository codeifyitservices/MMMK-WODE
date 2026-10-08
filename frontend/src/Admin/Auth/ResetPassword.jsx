import React, { useState } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { Form, Input, Button, message, ConfigProvider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { adminResetPassword } from '../../apis/nonAuth/adminAuth';
import '../../css/adminLogin.css';
import bannerVideo from '../../assets/banner/banner.mp4';

const ResetPassword = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (typeof adminResetPassword !== 'function') {
        throw new Error('API function not found');
      }
      const res = await adminResetPassword(token, { password: values.password });
      message.success(res?.message || 'Password updated successfully');
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      message.error(
        err?.response?.data?.message || err?.message || 'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={bannerVideo}
        autoPlay
        loop
        muted
        playsInline
      ></video>
      <div className="relative w-full max-w-md space-y-8 bg-[rgba(104,88,36,.5)] p-10 rounded-xl shadow-2xl z-10 backdrop:blur-sm">
        <div className="flex flex-col items-center">
          <img width={100} src="/Wode Logo.png" alt="Logo" />
          <h2 className="text-center text-xl font-extrabold text-white">
            Reset Admin Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-200">
            Enter your new password below
          </p>
        </div>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#28120B',
              colorBgBase: '#111',
              colorText: '#fff',
            },
          }}
        >
          <Form
            name="reset_password"
            className="space-y-6"
            onFinish={onFinish}
            form={form}
          >
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your new password!',
                },
                {
                  min: 6,
                  message: 'Password must be at least 6 characters!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="New Password"
                className="h-12 text-base"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: 'Please confirm your password!',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('The two passwords do not match!')
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Confirm New Password"
                className="h-12 text-base"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 text-base"
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ResetPassword;
