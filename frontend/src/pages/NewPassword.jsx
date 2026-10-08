/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';

import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import bg from '../assets/bg.png';
import { message } from 'antd';
import { updatePassword } from '../apis/nonAuth/userAuth';
import { useTranslationContext } from '../context/TranslationContext';
import { CommonButton } from '../components/global/UIButtons';

const NewPassword = () => {
  const {
    content: { common, forgotPasswordPage },
  } = useTranslationContext();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!params.token) {
      navigate('/auth');
    }
  }, [params.token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword) {
      message.info('password required');
      return null;
    }

    if (formData.password !== formData.confirmPassword) {
      message.info('Password does not match');
      return null;
    }

    try {
      setLoading(true);
      const res = await updatePassword(params.token, {
        password: formData.password,
      });
      
      message.success('Password updated successfully');
      setFormData({ password: '', confirmPassword: '' });
      setLoading(false);
      navigate('/auth');
    } catch (err) {
      setLoading(false);
      
      message.error(
        err?.response?.data?.message || 'Failed to set new password'
      );
    }
  };

  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-lg p-10">
            {' '}
            {/* Changed to max-w-lg and increased padding */}
            <form onSubmit={handleSubmit}>
              <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl lg:text-6xl after:block after:w-52 after:h-1 after:bg-white after:mb-6 after:mt-2">
                {forgotPasswordPage.newPassword}
              </h2>
              <div className="mb-8">
                {' '}
                {/* Increased margin bottom */}
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-4 text-lg text-gray-300 placeholder-gray-400 transition duration-300 bg-transparent border-b border-gray-200 outline-none focus:border-white" // Increased padding and font size
                  placeholder={forgotPasswordPage.password}
                />
              </div>
              <div className="mb-8">
                {' '}
                {/* Increased margin bottom */}
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-4 text-lg text-gray-300 placeholder-gray-400 transition duration-300 bg-transparent border-b border-gray-200 outline-none focus:border-white" // Increased padding and font size
                  placeholder={forgotPasswordPage.confirmPassword}
                />
              </div>
              <div className="flex flex-wrap items-end justify-between">
                <CommonButton variant={4} disabled={loading} className="mt-0">
                  {loading ? common.loading : common.submit}
                </CommonButton>

                <NavLink
                  to={'/auth'}
                  className="text-base text-orange-200 hover:underline"
                >
                  {forgotPasswordPage.backtoAuth}
                </NavLink>
              </div>
              {/* <div className="flex justify-center mt-6"> */}{' '}
              {/* Increased margin top */}
              {/* </div> */}
            </form>
          </div>
        </div>
      </Banner>
      <NewsLetter></NewsLetter>
    </div>
  );
};

export default NewPassword;
