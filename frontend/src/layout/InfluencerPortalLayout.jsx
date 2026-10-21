import { useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, ConfigProvider, Layout, Menu, theme } from 'antd';
import { LuChevronLeft, LuMenu, LuX } from 'react-icons/lu';
import {
  Home,
  Box,
  ShoppingCart,
  CreditCard,
  Users,
  LogOut,
  Eye,
  Copy,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useInfluencerAuth } from '../context/InfluencerAuthProvider';
import { cn } from '../utils/cn';

const { Sider } = Layout;

const InfluencerPortalLayout = () => {
  const { influencer, logout } = useInfluencerAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);

  const referralCode = influencer?.referralCode || 'PARTNER';
  const storefrontUrl = `${window.location.origin}?ref=${referralCode}`;
  const walletBalance = Number(influencer?.walletBalance || 0).toFixed(2);

  const handleCopyCode = (e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyStoreLink = (e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(storefrontUrl);
    setCopiedStoreLink(true);
    setTimeout(() => setCopiedStoreLink(false), 2000);
  };

  const menuItems = useMemo(
    () => [
      {
        icon: <Home size={15} />,
        label: 'Dashboard',
        title: 'Dashboard',
        key: '/influencer/dashboard',
      },
      {
        icon: <Box size={15} />,
        label: 'Products',
        title: 'Products',
        key: '/influencer/products',
      },
      {
        icon: <ShoppingCart size={15} />,
        label: 'Orders',
        title: 'Orders',
        key: '/influencer/orders',
      },
      {
        icon: <CreditCard size={15} />,
        label: 'Wallet & Payouts',
        title: 'Wallet & Payouts',
        key: '/influencer/wallet',
      },
      {
        icon: <Users size={15} />,
        label: 'Profile',
        title: 'Profile',
        key: '/influencer/profile',
      },
      {
        type: 'divider',
        className: 'bg-white/10 my-2',
      },
      {
        icon: <Eye size={15} />,
        label: 'Visit Storefront',
        title: 'Visit Storefront',
        key: 'storefront',
      },
      {
        icon: <LogOut size={15} />,
        label: 'Logout',
        title: 'Logout',
        key: 'logout',
        danger: true,
      },
    ],
    []
  );

  const handleSelectMenuItem = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/influencer/login');
      return;
    }
    if (key === 'storefront') {
      window.open('/', '_blank', 'noreferrer');
      return;
    }
    setMobileMenuOpen(false);
    if (location.pathname !== key) {
      navigate(key);
    }
  };

  // Determine active key matching current pathname
  const activeKey = menuItems.find((item) => item.key === location.pathname)?.key || location.pathname;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col lg:flex-row font-['Poppins',sans-serif]">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-950 to-yellow-950 border-b border-amber-900/30 sticky top-0 z-40">
        <Link to="/influencer/dashboard" className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="MMMK WODE"
            className="w-7 h-7 rounded object-contain shrink-0"
          />
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-white">MMMK WODE</h1>
            <p className="text-[10px] tracking-widest text-[#dfba73] font-medium uppercase">
              Influencer Panel
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyStoreLink}
            className="px-2.5 py-1.5 rounded-md bg-[#dfba73]/15 border border-[#dfba73]/30 text-[#dfba73] text-xs flex items-center gap-1.5 transition-all"
            title="Copy Storefront Referral Link"
          >
            {copiedStoreLink ? <Check size={13} /> : <Share2 size={13} />}
            <span className="font-mono">{referralCode}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <LuX size={20} /> : <LuMenu size={20} />}
          </button>
        </div>
      </header>

      {/* Side Panel - Exactly matching Admin Panel Side Panel */}
      <Sider
        collapsed={isSidebarCollapsed}
        collapsible
        width={260}
        collapsedWidth={60}
        trigger={null}
        breakpoint="lg"
        className={cn(
          'transition-all duration-300 ease-in-out bg-gradient-to-b from-gray-950 to-yellow-950 dark:bg-gray-900 border-r border-[#dfba73]/20 z-50 lg:relative fixed inset-y-0 left-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header with Favicon Logo & Collapsible Chevron */}
        <div
          className={cn(
            'logo flex h-[50px] border-b border-white/10 items-center px-3',
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link
            to="/influencer/dashboard"
            className={cn(
              'flex items-center gap-2.5 overflow-hidden',
              isSidebarCollapsed ? 'justify-center' : ''
            )}
          >
            <img
              src="/favicon.png"
              alt="MMMK WODE"
              className="w-6 h-6 object-contain rounded shrink-0"
            />
            {!isSidebarCollapsed && (
              <motion.h2
                animate={{
                  width: isSidebarCollapsed ? 0 : 'auto',
                  opacity: isSidebarCollapsed ? 0 : 1,
                }}
                className="text-sm text-white font-semibold flex-1 origin-left whitespace-nowrap overflow-hidden"
              >
                Influencer Panel
              </motion.h2>
            )}
          </Link>

          {/* Sider Collapse / Mobile Close Button */}
          <div className="flex items-center">
            <Button
              ghost
              size="small"
              className="border-0 text-white/80 hover:text-white hidden lg:flex items-center justify-center p-1"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              icon={isSidebarCollapsed ? <LuMenu size={16} /> : <LuChevronLeft size={16} />}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            />
            <Button
              ghost
              size="small"
              className="border-0 text-white/80 hover:text-white lg:hidden flex items-center justify-center p-1"
              onClick={() => setMobileMenuOpen(false)}
              icon={<LuX size={18} />}
            />
          </div>
        </div>

        {/* Ant Design Menu matching Admin Panel */}
        <div className="h-[calc(100vh-50px)] overflow-y-auto scrollbar-hidden border-0 relative">
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#635D4A',
              },
            }}
          >
            <Menu
              mode="inline"
              defaultSelectedKeys={[activeKey]}
              selectedKeys={[activeKey]}
              className="border-0 mb-0 bg-transparent text-white"
              items={menuItems}
              onClick={handleSelectMenuItem}
            />
          </ConfigProvider>
        </div>
      </Sider>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content View with Crisp White Top Bar */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#f8fafc]">
        {/* Desktop Top Bar - Crisp White like Admin */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200/80 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 tracking-wide">
                MMMK Partner Ecosystem
              </h2>
              <p className="text-xs text-gray-500">
                Welcome back,{' '}
                <span className="text-gray-900 font-semibold">
                  {influencer?.fullName || 'Creator'}
                </span>
              </p>
            </div>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Partner • 10% Commission
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Referral Code Quick Copy Badge */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 gap-1.5 shadow-sm">
              <span className="text-gray-400 text-[11px] uppercase tracking-wider font-medium">
                Code:
              </span>
              <span className="font-mono font-bold text-[#8d6f30]">{referralCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors ml-0.5"
                title="Copy Referral Code"
              >
                {copiedCode ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
            </div>

            {/* Storefront Link Copy Bar */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 gap-2 shadow-sm">
              <span className="text-gray-500 text-[11px] font-medium">Your Storefront Link:</span>
              <span className="font-mono text-[#8d6f30] font-semibold truncate max-w-[200px] xl:max-w-[260px]">
                {storefrontUrl}
              </span>
              <button
                onClick={handleCopyStoreLink}
                className="px-2.5 py-1 rounded-md bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
              >
                {copiedStoreLink ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedStoreLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Wallet Pill */}
            <Link
              to="/influencer/wallet"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-gray-900 transition-all text-xs shadow-sm font-medium"
            >
              <span className="text-gray-600 text-[11px]">Wallet:</span>
              <span className="font-bold text-[#8d6f30]">AED {walletBalance}</span>
            </Link>
          </div>
        </div>

        {/* Page Content View */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default InfluencerPortalLayout;
