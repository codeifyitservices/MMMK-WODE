import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import {
  Home,
  Tags,
  Box,
  Users,
  ShoppingCart,
  Ticket,
  LifeBuoy,
  FileText,
  SlidersHorizontal,
  CreditCard,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { FaGift, FaMoneyBill1Wave } from 'react-icons/fa6';
import { useAdminAuthContext } from '../../context/AdminAuthProvider';

// Import your components
import Dashboard from '../pages/Dashboard';
import Category from '../pages/Category/CategoryPage';
import Products from '../pages/Products/ProductPage';
import User from '../pages/Users/UserPage';
import Coupons from '../pages/Coupons/CouponPage';
import Support from '../pages/Support/SupportPage';
import Filters from '../pages/Filters/FilterPage';
import Payment from '../pages/Payments/PaymentPage';
import Orders from '../pages/Orders/OrderPage';
import Blogs from '../pages/Blogs/BlogPage';
import Editpages from '../pages/PageContentHandler/ContentHandler';
import GiftCardPage from '../pages/giftCard/GiftCardPage';

// edit page components
// home
import HomeBanner from '../pages/editPage/home/banner/Banner';
import HomeSection2 from '../pages/editPage/home/section2/Section2';
import HomeSection8 from '../pages/editPage/home/section8/Section8';
import HomeSection9 from '../pages/editPage/home/section9/Section9';
import HomeSection11 from '../pages/editPage/home/section11/Section11';
import HomeSection12 from '../pages/editPage/home/section12/Section12';
import EditPagesFooter from '../pages/editPage/home/footer/Footer';
import PricingForm from '../pages/pricing/PricingForm';
import SectionProducts from '../pages/editPage/home/sectionProducts/SectionProducts';
import ReviewPage from '../pages/review/ReviewPage';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', section: 'Dashboard' },
  { icon: Tags, label: 'Category', section: 'Category' },
  { icon: Box, label: 'Products', section: 'Products' },
  { icon: Ticket, label: 'Review', section: 'Review' },
  { icon: Users, label: 'Users', section: 'User' },
  { icon: FaGift, label: 'Gift Card', section: 'GiftCardPage' },
  { icon: ShoppingCart, label: 'Orders', section: 'Orders' },
  { icon: Ticket, label: 'Coupons', section: 'Coupons' },
  { icon: LifeBuoy, label: 'Support', section: 'Support' },
  {
    icon: FileText,
    label: 'Edit Pages',
    section: 'Edit Pages',
    hasDropdown: true,
    dropdownItems: [
      {
        label: 'Home',
        section: 'EditPagesHome',
        hasDropdown: true,
        dropdownItems: [
          { label: 'Banner', section: 'EditPagesHomeBanner' },
          { label: 'Section2', section: 'EditPagesSection2' },
          { label: 'Section8', section: 'EditPagesSection8' },
          { label: 'Section9', section: 'EditPagesSection9' },
          { label: 'Section11', section: 'EditPagesSection11' },
          { label: 'Section12', section: 'EditPagesSection12' },
          { label: 'Section Products', section: 'SectionProducts' },
        ],
      },
      {
        label: 'Footer',
        section: 'EditPagesFooter',
      },
    ],
  },
  { icon: SlidersHorizontal, label: 'Filters', section: 'Filters' },
  { icon: CreditCard, label: 'Payment', section: 'Payment' },
  // { icon: FaMoneyBill1Wave, label: "Pricing", section: "Pricing" },
  // { icon: BookOpen, label: "Blogs", section: "Blogs" },
  { icon: LogOut, label: 'Logout', section: 'Logout' },
];

const AdminDashboard = () => {
  const { setData } = useAdminAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [isEditPagesDropdownOpen, setIsEditPagesDropdownOpen] = useState(false);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile && mounted) {
      setIsSidebarOpen(false);
    }
  }, [isMobile, mounted]);

  const handleDropdownToggle = (section) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    localStorage.removeItem('adminAuthToken');
    setData({});
    return navigate('/admin/login');
  };

  const handleDropdownItemClick = (section) => {
    setSelectedDropdownItem(section === selectedDropdownItem ? null : section);
    setActiveSection(section);
    if (isMobile) setIsSidebarOpen(false);
  };

  // Content rendering function
  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Category':
        return <Category />;
      case 'Products':
        return <Products />;
      case 'Review':
        return <ReviewPage />;
      case 'User':
        return <User />;
      case 'GiftCardPage':
        return <GiftCardPage />;
      case 'Orders':
        return <Orders />;
      case 'Coupons':
        return <Coupons />;
      case 'Support':
        return <Support />;
      case 'Filters':
        return <Filters />;
      case 'Payment':
        return <Payment />;
      // case "Pricing":
      //   return <PricingForm />;
      // case "Blogs":
      //   return <Blogs />;
      case 'EditPagesHome':
        return <Editpages page="Home" />;
      case 'EditPagesHomeBanner':
        return <HomeBanner />;
      case 'EditPagesSection2':
        return <HomeSection2 />;
      case 'EditPagesSection8':
        return <HomeSection8 />;
      case 'EditPagesSection9':
        return <HomeSection9 />;
      case 'EditPagesSection11':
        return <HomeSection11 />;
      case 'EditPagesSection12':
        return <HomeSection12 />;
      case 'EditPagesFooter':
        return <EditPagesFooter />;
      case 'SectionProducts':
        return <SectionProducts />;
      case 'Logout':
        // Handle logout logic here
        return <>{handleLogout()} </>;
      default:
        return <Dashboard />;
    }
  };

  const renderDropdownItems = (items, level = 0) => {
    return (
      <AnimatePresence>
        {items.map((item, idx) => (
          <motion.div key={idx} className={`pl-${level * 4}`}>
            <Link
              to="#"
              onClick={() => {
                if (item.hasDropdown) {
                  handleDropdownToggle(item.section);
                } else {
                  handleDropdownItemClick(item.section);
                }
              }}
              className={`py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-between
                ${
                  selectedDropdownItem === item.section
                    ? 'bg-white/10 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
            >
              <span>{item.label}</span>
              {item.hasDropdown && (
                <motion.span
                  animate={{
                    rotate: openDropdowns[item.section] ? 180 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              )}
            </Link>
            {item.hasDropdown && openDropdowns[item.section] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4"
              >
                {renderDropdownItems(item.dropdownItems, level + 1)}
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    );
  };

  const sidebarVariants = {
    open: {
      width: isMobile ? '240px' : '280px',
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      width: isMobile ? '0px' : '80px',
      x: isMobile ? '-100%' : 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={isSidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        className={`fixed left-0 z-30 h-screen bg-gradient-to-b from-gray-950 to-yellow-950 dark:bg-gray-900 shadow-xl
          ${
            isMobile
              ? isSidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full'
              : ''
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={isSidebarOpen ? 'p-6' : 'pb-2 pl-2'}>
            <div className="flex items-center justify-between mb-6">
              <motion.div
                animate={{
                  width: isSidebarOpen ? 'auto' : 0,
                  opacity: isSidebarOpen ? 1 : 0,
                }}
                className="flex items-center space-x-3"
              >
                <div className="flex items-center justify-center w-10 bg-white rounded-lg">
                  <span className="text-xl font-bold text-gray-900">A</span>
                </div>
                {isSidebarOpen && (
                  <div className="text-white">
                    <p className="font-semibold">Admin Portal</p>
                  </div>
                )}
              </motion.div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg hover:bg-white/10 ${
                  !isSidebarOpen && isMobile ? 'text-black' : 'text-white'
                }`}
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 overflow-y-auto scrollbar-hidden">
            <AnimatePresence>
              {sidebarItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Link
                    to="#"
                    onClick={() => {
                      if (item.hasDropdown) {
                        handleDropdownToggle(item.section);
                      } else {
                        setActiveSection(item.section);
                        if (isMobile) setIsSidebarOpen(false);
                      }
                    }}
                    className={`flex items-center w-full p-3 mb-1 space-x-3 rounded-lg transition-colors
                      ${
                        activeSection === item.section
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      } ${
                        item.label === 'Logout'
                          ? 'mt-4 text-red-400 hover:text-red-300'
                          : ''
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {isSidebarOpen && (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        {item.hasDropdown && (
                          <motion.span
                            animate={{
                              rotate: openDropdowns[item.section] ? 180 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.span>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.hasDropdown &&
                    isSidebarOpen &&
                    openDropdowns[item.section] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-12 mt-1 space-y-1"
                      >
                        {renderDropdownItems(item.dropdownItems)}
                      </motion.div>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isMobile ? 'ml-0' : isSidebarOpen ? 'ml-[280px]' : 'ml-20'
        }`}
      >
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 h-12 z-10 flex items-center justify-between p-4 bg-white shadow-sm"></div>
        )}

        {/* Content Area */}
        <div className="h-full flex flex-col p-4 relative">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
