import React, { useEffect, useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Form, Input, Button, message, ConfigProvider } from 'antd';
import { useAdminAuthContext } from '../../context/AdminAuthProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'antd/es/form/Form';
import { adminLogin } from '../../apis/nonAuth/adminAuth';
import '../../css/adminLogin.css';
import bannerVideo from '../../assets/banner/banner.mp4';
import { isStoredAdminTokenValid } from '../../utils/adminAuth';

const Login = () => {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const { setData } = useAdminAuthContext();
  const navigate = useNavigate();
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await adminLogin(values);
      
      setData(res?.data);
      localStorage.setItem('adminAuthToken', JSON.stringify(res?.data));
      return navigate('/admin/dashboard');
    } catch (err) {
      
      message.error(
        err?.response?.data?.message || 'Failed to login please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStoredAdminTokenValid()) {
      navigate('/admin/dashboard');
    }
  }, []);

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
          <img width={100} src="/Wode Logo.png" />
          <h2 className="text-center text-xl font-extrabold text-white">
            Admin Login
          </h2>
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
            name="admin_login"
            className="space-y-6"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            form={form}
          >
            <Form.Item
              name="username"
              rules={[
                {
                  required: true,
                  message: 'Please input your Username!',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="Username"
                className="h-12 text-base"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your Password!',
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="Password"
                className="h-12 text-base"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 text-base mb-4"
              >
                Log in
              </Button>
              <div className="text-center">
                <Link
                  to="/admin/forgot-password"
                  title="Forgot Password"
                  style={{ color: '#fff' }}
                >
                  Forgot Password?
                </Link>
              </div>
            </Form.Item>
          </Form>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default Login;
