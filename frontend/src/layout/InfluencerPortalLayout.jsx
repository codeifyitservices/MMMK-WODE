import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  WalletCards,
  UserCog,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { useInfluencerAuth } from '../context/InfluencerAuthProvider';

const InfluencerPortalLayout = () => {
  const { influencer, logout } = useInfluencerAuth();
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

  const navItems = [
    {
      label: 'Dashboard',
      to: '/influencer/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Products & Links',
      to: '/influencer/products',
      icon: PackageSearch,
    },
    {
      label: 'Attributed Orders',
      to: '/influencer/orders',
      icon: ShoppingBag,
    },
    {
      label: 'Wallet & Payouts',
      to: '/influencer/wallet',
      icon: WalletCards,
    },
    {
      label: 'Profile & Banking',
      to: '/influencer/profile',
      icon: UserCog,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col lg:flex-row font-['Poppins',sans-serif]">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-gray-950 border-b border-amber-900/30 sticky top-0 z-40">
        <Link to="/influencer/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#dfba73] to-[#8d6f30] flex items-center justify-center text-black font-bold text-sm shadow-md shadow-[#dfba73]/10">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-white">MMMK WODE</h1>
            <p className="text-[10px] tracking-widest text-[#dfba73] font-medium uppercase">
              Partner Hub
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyStoreLink}
            className="px-2.5 py-1.5 rounded-md bg-[#dfba73]/10 border border-[#dfba73]/30 text-[#dfba73] text-xs flex items-center gap-1.5 transition-all"
            title="Copy Storefront Referral Link"
          >
            {copiedStoreLink ? <Check size={13} /> : <Share2 size={13} />}
            <span className="hidden sm:inline font-mono">{referralCode}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar - Matching Admin Panel Styling */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } bg-gradient-to-b from-gray-950 via-gray-950 to-yellow-950 text-white border-r border-amber-900/30 flex flex-col justify-between transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header with Collapsible Chevron */}
          <div className="h-[56px] px-5 border-b border-amber-900/30 flex items-center justify-between">
            <Link to="/influencer/dashboard" className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-[#dfba73] via-[#caa055] to-[#866524] flex items-center justify-center text-black font-bold text-sm shadow-md shadow-[#dfba73]/20">
                M
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <h2 className="text-sm font-semibold tracking-wide text-white truncate">
                    Partner Portal
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-[#dfba73] font-medium">
                      MMMK WODE
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Collapse toggle button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Influencer Quick Identity Card */}
          {!isSidebarCollapsed ? (
            <div className="p-4 border-b border-white/5">
              <div className="bg-white/5 rounded-xl p-3.5 border border-white/5 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-[#dfba73]/30 to-[#dfba73]/10 border border-[#dfba73]/40 flex items-center justify-center text-[#dfba73] font-bold text-sm uppercase">
                    {influencer?.fullName
                      ? influencer.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                      : 'IN'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {influencer?.fullName || 'MMMK Creator'}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      @{influencer?.username || 'partner'}
                    </p>
                  </div>
                </div>

                {/* Referral Code Quick Copy Pill */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                    Code
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#dfba73]/15 hover:bg-[#dfba73]/25 border border-[#dfba73]/30 text-[#dfba73] font-mono font-medium transition-colors"
                    title="Click to copy code"
                  >
                    <span>{referralCode}</span>
                    {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>

                {/* Terms Badge */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-medium">10% Commission</span>
                  <span className="text-[#dfba73] font-medium">20% Customer Off</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 flex justify-center border-b border-white/5">
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dfba73]/30 to-[#dfba73]/10 border border-[#dfba73]/40 flex items-center justify-center text-[#dfba73] font-bold text-sm cursor-pointer"
                onClick={handleCopyCode}
                title={`Referral Code: ${referralCode}`}
              >
                {copiedCode ? <Check size={14} /> : referralCode.slice(0, 2)}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                    } py-2.5 rounded-lg text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-[#dfba73]/15 text-[#dfba73] font-semibold border-r-4 border-[#dfba73]'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:translate-x-1 duration-200'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[#dfba73]"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Balance Widget in Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-3.5 mx-3 mb-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-amber-900/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-gray-300 font-medium">
                  Wallet Balance
                </span>
                <Sparkles size={13} className="text-[#dfba73]" />
              </div>
              <div className="text-lg font-bold text-white tracking-tight">
                AED {walletBalance}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Link
                  to="/influencer/wallet"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#dfba73] hover:underline font-medium"
                >
                  Request Payout &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-3 border-t border-white/5 space-y-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center ${
                isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
              } py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors`}
              title="Visit Storefront"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} />
                {!isSidebarCollapsed && <span>Visit Storefront</span>}
              </span>
              {!isSidebarCollapsed && <span className="text-[10px] text-gray-500">mmmk-wode.com</span>}
            </a>
            <button
              onClick={logout}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? 'justify-center px-2' : 'px-3'
              } gap-2 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors`}
              title="Sign Out"
            >
              <LogOut size={14} />
              {!isSidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area - Clean, High-End SaaS Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc]">
        {/* Desktop Top Bar - Crisp White like Admin */}
        <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white border-b border-gray-200/80 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 tracking-wide">
                MMMK Partner Ecosystem
              </h2>
              <p className="text-xs text-gray-500">
                Welcome back, <span className="text-gray-900 font-semibold">{influencer?.fullName}</span>
              </p>
            </div>
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Partner • 10% Commission
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Storefront Link Copy Bar */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 gap-2 shadow-sm">
              <span className="text-gray-500 text-[11px] font-medium">Your Storefront Link:</span>
              <span className="font-mono text-[#8d6f30] font-semibold truncate max-w-[220px]">
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
