import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
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
  Share2,
} from 'lucide-react';
import { useInfluencerAuth } from '../context/InfluencerAuthProvider';

const InfluencerPortalLayout = () => {
  const { influencer, logout } = useInfluencerAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#070709] text-gray-200 flex flex-col lg:flex-row font-['Poppins',sans-serif]">
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-[#0d0d11] border-b border-white/5 sticky top-0 z-40">
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

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0c0c10] border-r border-white/5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <Link to="/influencer/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#dfba73] via-[#caa055] to-[#866524] flex items-center justify-center text-black font-extrabold text-base shadow-lg shadow-[#dfba73]/20">
                M
              </div>
              <div>
                <span className="text-base font-bold tracking-wider text-white font-['Belleza']">
                  MMMK WODE
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#dfba73] animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-[#dfba73] font-semibold">
                    Influencer Portal
                  </span>
                </div>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Influencer Quick Identity Card */}
          <div className="p-5 border-b border-white/5">
            <div className="bg-[#121217] rounded-xl p-4 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#dfba73]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#dfba73]/20 to-[#dfba73]/5 border border-[#dfba73]/40 flex items-center justify-center text-[#dfba73] font-bold text-sm uppercase">
                  {influencer?.fullName
                    ? influencer.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'IN'}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold text-white truncate">
                    {influencer?.fullName || 'MMMK Influencer'}
                  </h2>
                  <p className="text-xs text-gray-400 truncate">
                    @{influencer?.username || 'partner'}
                  </p>
                </div>
              </div>

              {/* Referral Code Quick Copy Pill */}
              <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                  Referral Code
                </span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#dfba73]/10 hover:bg-[#dfba73]/20 border border-[#dfba73]/30 text-[#dfba73] font-mono font-medium transition-colors"
                  title="Click to copy code"
                >
                  <span>{referralCode}</span>
                  {copiedCode ? <Check size={11} /> : <Copy size={11} />}
                </button>
              </div>

              {/* Terms Badge */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                <span className="text-emerald-400 font-medium">10% Commission</span>
                <span className="text-[#dfba73]">20% Customer Off</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex-1 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#dfba73]/15 to-transparent text-[#dfba73] border-l-2 border-[#dfba73]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#dfba73]" />
                </NavLink>
              );
            })}
          </nav>

          {/* Quick Balance Widget in Sidebar */}
          <div className="p-4 mx-4 mb-4 rounded-xl bg-gradient-to-br from-[#13131a] to-[#0a0a0f] border border-[#dfba73]/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider text-gray-400">
                Available Wallet
              </span>
              <Sparkles size={13} className="text-[#dfba73]" />
            </div>
            <div className="text-xl font-bold text-white tracking-tight">
              AED {walletBalance}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Link
                to="/influencer/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs text-[#dfba73] hover:underline font-medium"
              >
                Request Payout &rarr;
              </Link>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/5 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} />
                Visit Storefront
              </span>
              <span className="text-[10px] text-gray-400">mmmk-wode.com</span>
            </a>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#0a0a0e] border-b border-white/5 sticky top-0 z-30">
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              MMMK Partner Ecosystem
            </h2>
            <p className="text-xs text-gray-400">
              Welcome back, <span className="text-white font-medium">{influencer?.fullName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Storefront Link Copy Button */}
            <div className="flex items-center bg-[#121217] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 gap-2">
              <span className="text-gray-400 text-[11px]">Your Storefront Link:</span>
              <span className="font-mono text-[#dfba73] truncate max-w-[200px]">
                {storefrontUrl}
              </span>
              <button
                onClick={handleCopyStoreLink}
                className="px-2 py-1 rounded bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                {copiedStoreLink ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedStoreLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Wallet Pill */}
            <Link
              to="/influencer/wallet"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#dfba73]/10 border border-[#dfba73]/30 text-white hover:bg-[#dfba73]/20 transition-all text-xs"
            >
              <span className="text-gray-400 text-[11px]">Balance:</span>
              <span className="font-bold text-[#dfba73]">AED {walletBalance}</span>
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
