/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import { Navigate, NavLink } from 'react-router-dom';
import bgImg from '../assets/bg.png';
import { message } from 'antd';
import { useTranslationContext } from '../context/TranslationContext';
import { forgotPassword } from '../apis/nonAuth/userAuth';

const ForgetPassword = () => {
  const {
    content: { common, forgotPasswordPage },
  } = useTranslationContext();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      message.info('Email required');
      return null;
    }
    try {
      setLoading(true);
      const res = await forgotPassword({ email });
      
      setEmail('');
      message.success('Reset password link sent to your email');
      setLoading(false);
    } catch (err) {
      
      setLoading(false);
      message.error(err?.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="w-full">
      <Banner bg={bgImg}>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-lg p-10 rounded-lg md:max-w-xl lg:max-w-2xl">
            {' '}
            {/* Increased padding */}
            <form onSubmit={handleSubmit}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-7th mb-8 after:block after:w-[20%] after:h-1 after:bg-white after:mb-6 after:mt-2">
                {' '}
                {/* Increased font sizes */}
                {forgotPasswordPage.forgotPassword}
              </h2>
              <div className="mb-8">
                {' '}
                {/* Increased margin bottom */}
                <input
                  type="email"
                  required={true}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 text-lg placeholder-gray-400 bg-transparent border-b border-gray-300 outline-none focus:border-gray-500" // Increased padding and font size
                  placeholder={common.email}
                />
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {loading ? (
                  <button
                    disabled={true}
                    className="w-full px-12 py-2 text-lg font-semibold text-white transition duration-300 bg-transparent border-2 border-white rounded-md sm:w-auto"
                  >
                    {forgotPasswordPage.sendingMail}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full px-12 py-2 text-lg font-semibold text-white transition duration-300 bg-transparent border-2 border-white rounded-md sm:w-auto"
                  >
                    {common.send}
                  </button>
                )}

                <NavLink
                  to={'/auth'}
                  className="text-base text-center text-orange-200 transition duration-300 hover:text-white hover:underline sm:text-right"
                >
                  {forgotPasswordPage.backtoAuth}
                </NavLink>
              </div>
            </form>
          </div>
        </div>
      </Banner>
      <NewsLetter></NewsLetter>
    </div>
  );
};

export default ForgetPassword;
