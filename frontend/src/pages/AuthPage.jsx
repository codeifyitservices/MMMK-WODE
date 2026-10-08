import { useEffect, useState } from 'react';
import Banner from '../components/global/Banner';
import NewsLetter from '../components/global/NewsLetter';
import bgImg from '../assets/bg.png';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { userLogin, userSignup } from '../apis/nonAuth/userAuth';
import { useUserAuthContext } from '../context/userAuthProvider';
import { useCart } from '../context/CartProvider';
import {LuEye, LuEyeOff} from 'react-icons/lu';
import { jwtDecode } from 'jwt-decode';
import { useTranslationContext } from '../context/TranslationContext';
import {
  getStoredUserToken,
  normalizeUserAuthPayload,
} from '../utils/authStorage';

const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;

function testPasswordRegex(password) {
  return passwordRegex.test(password);
}

const AuthPage = () => {
  const {
    content: { common, auth },
  } = useTranslationContext();
  const navigate = useNavigate();
  const { mergeCart } = useCart();
  const { state } = useLocation();
  const { setData } = useUserAuthContext();
  const [activeTab, setActiveTab] = useState('signIn');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signInData, setSignInData] = useState({
    email: localStorage.getItem('signinData')
      ? JSON.parse(localStorage.getItem('signinData')).email
      : '',
    password: localStorage.getItem('signinData')
      ? JSON.parse(localStorage.getItem('signinData')).password
      : '',
    rememberMe: true,
  });
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignupChange = (key, value) => {
    setSignUpData((prevData) => {
      return { ...prevData, [key]: value };
    });
  };

  const handleSigninChange = (key, value) => {
    setSignInData((prevData) => {
      return { ...prevData, [key]: value };
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (
      !signUpData.firstName ||
      !signUpData.lastName ||
      !signUpData.email ||
      !signUpData.password ||
      !signUpData.confirmPassword
    ) {
      message.info('All fields are required');
      return null;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      message.info('Passwords do not match');
      return null;
    }

    if (!testPasswordRegex(signUpData.password)) {
      message.info(
        'Password must be at least 6 characters long and contain at least one letter, one number, and one special character'
      );
      return null;
    }
    setLoading(true);
    try {
      const res = await userSignup(signUpData);
      const authPayload = normalizeUserAuthPayload(res?.data);
      message.success('Signup successful');
      setSignUpData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setData(authPayload);
      localStorage.setItem('userToken', JSON.stringify(authPayload));
      localStorage.setItem(
        'signinData',
        JSON.stringify({
          email: signUpData.email,
          password: signUpData.password,
        })
      );
      await mergeCart();
      setLoading(false);
      return navigate(state?.from || '/');
    } catch (err) {
      
      setLoading(false);
      message.error(err?.response?.data?.message || 'Failed to signup');
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();

    if (!signInData.email || !signInData.password) {
      message.info('All fields are required');
      return null;
    }

    setLoading(true);

    try {
      const res = await userLogin(signInData);
      const authPayload = normalizeUserAuthPayload(res?.data);
      message.success('Login successfully');
      setSignInData({ email: '', password: '', rememberMe: false });
      setData(authPayload);
      localStorage.setItem('userToken', JSON.stringify(authPayload));
      if (signInData.rememberMe) {
        localStorage.setItem(
          'signinData',
          JSON.stringify({
            email: signInData.email,
            password: signInData.password,
          })
        );
      } else {
        localStorage.removeItem('signinData');
      }
      await mergeCart();
      setLoading(false);
      return navigate(state?.from || '/');
    } catch (err) {
      setLoading(false);
      
      message.error(err?.response?.data?.message || 'Failed to login');
    }
  };

  useEffect(() => {
    const token = getStoredUserToken();

    if (token) {
      try {
        const { exp } = jwtDecode(token);
        if (Date.now() < exp * 1000) {
          // Token is valid, redirect
          return navigate(state?.from || '/');
        } else {
          // Token expired, remove it
          localStorage.removeItem('userToken');
          setData({});
        }
      } catch (error) {
        // Invalid token, remove it
        localStorage.removeItem('userToken');
        setData({});
      }
    }
  }, []);

  return (
    <div className="w-full relative z-[10]">
      {/* <Banner bg={bgImg}> */}
      <Banner bg={bgImg}>
        <div className="text-white text-center md:h-[0vh] h-[20vh] flex flex-col items-center justify-center md:mt-16 md:mb-0 "></div>
        {/* </Banner> */}
        <div className="flex items-center justify-center min-h-screen ">
          <div className="w-full max-w-2xl p-6 bg-opacity-75 rounded-lg md:p-16">
            {/* Tab Headers */}
            <div className="flex justify-center mb-8 space-x-8 md:mb-12 md:space-x-28">
              <button
                className={`text-2xl md:text-4xl font-semibold pb-3 mx-4 md:mx-6 ${
                  activeTab === 'signIn'
                    ? 'border-b-2 border-white text-white'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signIn')}
              >
                {common.signIn}
              </button>

              <button
                className={`text-2xl md:text-4xl font-semibold pb-3 mx-4 md:mx-6 ${
                  activeTab === 'signUp'
                    ? 'border-b-2 border-white text-white'
                    : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('signUp')}
              >
                {common.signUp}
              </button>
            </div>

            {/* Sign In Form */}
            {activeTab === 'signIn' && (
              <form onSubmit={handleSignin}>
                <div className="px-4 mb-6 md:px-16">
                  <input
                    type="text"
                    value={signInData.email}
                    onChange={(e) =>
                      handleSigninChange('email', e.target.value)
                    }
                    className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.email}
                  />
                </div>
                <div className="px-4 mb-6 md:px-16">
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInData.password}
                      onChange={(e) =>
                        handleSigninChange('password', e.target.value)
                      }
                      className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                      placeholder={auth.password}
                    />{' '}
                    <button
                      type="button"
                      className="absolute right-2 flex items-center"
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                    >
                      <span className="text-gray-300">
                        {showPassword ? <LuEye /> : <LuEyeOff />}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 mb-6 md:px-16">
                  <label className="flex items-center text-lg text-orange-200">
                    <input
                      checked={signInData.rememberMe}
                      onChange={(e) =>
                        handleSigninChange('rememberMe', e.target.checked)
                      }
                      type="checkbox"
                      className="mr-2"
                    />
                    {auth.rememberMe}
                  </label>
                  <NavLink
                    to={'/forgot-password'}
                    className="text-lg text-orange-200 hover:underline"
                  >
                    {auth.forgotPassword}
                  </NavLink>
                </div>
                {loading ? (
                  <button
                    disabled={true}
                    className="w-full px-12 py-2 mt-6 text-lg text-orange-200 border border-white rounded-md md:ml-16 md:w-auto"
                  >
                    {common.loading}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full px-12 py-2 mt-6 text-lg text-orange-200 border border-white rounded-md md:ml-16 md:w-auto"
                  >
                    {common.signIn}
                  </button>
                )}
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === 'signUp' && (
              <form onSubmit={handleSignup}>
                <div className="grid flex-col grid-cols-2 gap-4 px-4 mb-6 space-x-0 md:flex-row md:px-16">
                  <input
                    name="firstName"
                    type="text"
                    value={signUpData.firstName}
                    className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.firstName}
                    onChange={(e) =>
                      handleSignupChange('firstName', e.target.value)
                    }
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={signUpData.lastName}
                    onChange={(e) =>
                      handleSignupChange('lastName', e.target.value)
                    }
                    className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.lastName}
                  />
                </div>
                <div className="px-4 mb-6 md:px-16">
                  <input
                    type="email"
                    name="email"
                    onChange={(e) =>
                      handleSignupChange('email', e.target.value)
                    }
                    value={signUpData.email}
                    className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.email}
                  />
                </div>
                <div className="px-4 mb-6 md:px-16 flex items-center relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={signUpData.password}
                    onChange={(e) =>
                      handleSignupChange('password', e.target.value)
                    }
                    className="w-full p-4 pr-8 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.password}
                  />
                  <button
                    type="button"
                    className="absolute right-[80px] flex items-center"
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  >
                    <span className="text-gray-300">
                      {showPassword ? <LuEye /> : <LuEyeOff />}
                    </span>
                  </button>
                </div>
                <div className="px-4 mb-6 md:px-16">
                  <input
                    type="password"
                    name="confirmPassword"
                    onChange={(e) =>
                      handleSignupChange('confirmPassword', e.target.value)
                    }
                    value={signUpData.confirmPassword}
                    className="w-full p-4 font-sans text-xl text-gray-300 bg-transparent border-b border-gray-300 outline-none"
                    placeholder={auth.confirmPassword}
                  />
                </div>

                <div className="px-4 mb-6 md:px-16">
                  <label className="text-base text-orange-200">
                    {auth.offer}
                  </label>
                </div>

                {loading ? (
                  <button
                    disabled={true}
                    className="w-full px-12 py-2 mt-6 text-lg text-white border border-white rounded-md md:ml-16 md:w-auto"
                  >
                    {common.loading}
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full px-12 py-2 mt-6 text-lg text-white border border-white rounded-md md:ml-16 md:w-auto"
                  >
                    {common.signUp}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </Banner>
      <NewsLetter />
    </div>
  );
};

export default AuthPage;
