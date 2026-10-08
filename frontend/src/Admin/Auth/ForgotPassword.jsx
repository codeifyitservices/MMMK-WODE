import React, { useState } from 'react';
import { Button, message, ConfigProvider } from 'antd';
import { Link } from 'react-router-dom';
import { adminForgotPassword } from '../../apis/nonAuth/adminAuth';
import '../../css/adminLogin.css';
import bannerVideo from '../../assets/banner/banner.mp4';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      if (typeof adminForgotPassword !== 'function') {
        throw new Error('API function not found');
      }
      const res = await adminForgotPassword();
      message.success(res?.message || 'Reset link sent to the authorized admin email');
    } catch (err) {
      console.error('Reset password error:', err);
      message.error(
        err?.response?.data?.message || err?.message || 'Failed to send reset link'
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
            Admin Password Recovery
          </h2>
          <p className="mt-4 text-center text-sm text-gray-200">
            Click the button below to send a password reset link to the authorized admin email address configured in the system.
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
          <div className="mt-8 space-y-6">
            <Button
              type="primary"
              onClick={handleReset}
              loading={loading}
              className="w-full h-12 text-base mb-4"
            >
              Send Reset Link
            </Button>
            <div className="text-center">
              <Link to="/admin/login" className="text-white hover:text-gray-300">
                Back to Login
              </Link>
            </div>
          </div>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default ForgotPassword;
