import { useState } from 'react';
import Banner from '../components/global/Banner';
import { FaBox, FaHome, FaMapMarkerAlt, FaMoneyBill, FaUser } from 'react-icons/fa';
import { BsCart3, BsCashCoin } from 'react-icons/bs';
import { IoIosLogOut } from 'react-icons/io';
import bgImage from '../assets/bg.png';
import { useUserAuthContext } from '../context/userAuthProvider';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { userLogout } from '../apis/nonAuth/userAuth';
import { RiMoneyDollarBoxFill } from 'react-icons/ri';
import { useTranslationContext } from '../context/TranslationContext';
import { useCart } from '../context/CartProvider';

const menuItems = (profile) => [
  {
    icon: <FaHome />,
    label: profile.home || 'Home',
    key: 'home',
    to: '/',
  },
  {
    icon: <FaUser />,
    label: profile.myAccount,
    key: 'my-account',
    to: '/profile/my-account',
  },
  {
    icon: <FaBox />,
    label: profile.myOrders,
    key: 'my-order',
    to: '/profile/my-orders',
  },
  {
    icon: <BsCart3 />,
    label: profile.savedItems,
    key: 'savedItem',
    to: '/profile/saved-items',
  },
  {
    icon: <FaMapMarkerAlt />,
    label: profile.addressBook,
    key: 'address-book',
    to: '/profile/address-book',
  },
  {
    icon: <RiMoneyDollarBoxFill />,
    label: profile.myCredit,
    key: 'my-credit',
    to: '/profile/my-credit',
  },
  // {
  //   icon: <BsCashCoin />,
  //   label: profile.paymentMethods,
  //   key: 'payment-method',
  //   to: '/profile/payment-methods',
  // },
  {
    icon: <IoIosLogOut />,
    label: profile.signOut,
    key: 'sign-out',
  },
];

const Profile = ({ children }) => {
  const {
    content: { profile },
  } = useTranslationContext();
  const navigate = useNavigate();
  const { setData } = useUserAuthContext();
  const [menuItemOpen, setMenuItemOpen] = useState(false);
  const { pathname } = useLocation();
  const { clearCart } = useCart();

  const handleMenuToggle = () => setMenuItemOpen((prev) => !prev);

  const handleLogout = async () => {
    try {
      await userLogout();
      setData({});
      localStorage.removeItem('userToken');
      clearCart();
      return navigate('/');
    } catch (err) {
      
      message.error('Something went wrong, please refresh the page');
    }
  };

  const items = menuItems(profile);

  return (
    <div className="w-full">
      {/* Banner - visible on all screens, responsive height */}
      <div className="block">
        <Banner bg={bgImage} minHeight={20} desktopMinHeight={35}>
          <div className="text-white text-center h-[10vh] md:h-[15vh] flex flex-col items-center justify-center md:mt-16 md:mb-0 "></div>
        </Banner>
      </div>

      {/* Mobile Navigation - horizontal scrollable tabs */}
      <div className="md:hidden w-full overflow-x-auto bg-[#d9d9d9] border-b border-gray-300">
        <div className="flex items-center gap-1 px-2 py-2 min-w-max">
          {items.map(({ icon, label, key, to }) => (
            <Link
              to={to}
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors duration-200 ${
                pathname.includes(to)
                  ? 'bg-[#28120b] text-white'
                  : 'text-gray-700 hover:bg-[#28120b] hover:text-white'
              }`}
              onClick={(e) => {
                if (key === 'sign-out') {
                  e.preventDefault();
                  handleLogout();
                  return;
                }
              }}
            >
              <span className="text-sm">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full mt-4 md:mt-10">
        <main className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Left Sidebar - desktop only */}
          <div className="hidden md:block col-span-3 bg-[#d9d9d9] p-5 rounded-lg shadow-lg">
            {/* Menu Items */}
            {items.map(({ icon, label, key, to }) => (
              <Link
                to={to}
                key={key}
                className={`px-3 py-3 flex items-center gap-5 cursor-pointer text-sm md:text-lg  duration-300 hover:bg-[#28120b] hover:text-white rounded-lg mb-2 ${
                  pathname.includes(to) ? 'bg-[#28120b] text-white' : ''
                }`}
                onClick={(e) => {
                  if (key === 'sign-out') {
                    e.preventDefault(); // Prevent navigation for sign-out
                    handleLogout();
                    return;
                  }
                }}
              >
                <span className="text-xl">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* Right Content Area */}
          <div className="col-span-12 p-4 bg-white rounded-lg shadow-lg md:col-span-9 md:p-10 lg:px-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
