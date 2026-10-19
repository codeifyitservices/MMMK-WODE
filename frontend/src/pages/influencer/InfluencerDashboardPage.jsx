import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MousePointerClick,
  Users,
  ShoppingBag,
  TrendingUp,
  Coins,
  Wallet,
  Copy,
  Check,
  QrCode,
  ArrowUpRight,
  Sparkles,
  Clock,
  ArrowDownLeft,
  X,
} from 'lucide-react';
import { getInfluencerDashboardStatsApi } from '../../apis/influencer/client';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const InfluencerDashboardPage = () => {
  const { influencer } = useInfluencerAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const referralCode = influencer?.referralCode || 'PARTNER';
  const storefrontUrl = `${window.location.origin}?ref=${referralCode}`;

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInfluencerDashboardStatsApi();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const summary = data?.summary || {
    totalClicks: 0,
    uniqueVisitors: 0,
    totalOrders: 0,
    completedOrdersCount: 0,
    totalSalesVolume: 0,
    totalCommissionEarned: influencer?.totalCommissionEarned || 0,
    walletBalance: influencer?.walletBalance || 0,
    pendingPayoutAmount: influencer?.pendingPayoutAmount || 0,
    commissionRate: influencer?.commissionRate || 10,
    discountRate: influencer?.discountRate || 20,
    referralCode,
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    storefrontUrl
  )}&bgcolor=0c0c10&color=dfba73&qzone=2`;

  const kpis = [
    {
      title: 'Total Link Clicks',
      value: summary.totalClicks,
      subtitle: 'Recorded traffic visits',
      icon: MousePointerClick,
      color: 'from-amber-500/20 to-amber-500/5 text-[#dfba73] border-[#dfba73]/30',
    },
    {
      title: 'Unique Visitors',
      value: summary.uniqueVisitors,
      subtitle: 'Distinct referral sessions',
      icon: Users,
      color: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
    },
    {
      title: 'Attributed Orders',
      value: summary.totalOrders,
      subtitle: `${summary.completedOrdersCount || 0} completed orders`,
      icon: ShoppingBag,
      color: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Sales Volume',
      value: `AED ${Number(summary.totalSalesVolume || 0).toFixed(2)}`,
      subtitle: 'Gross customer order value',
      icon: TrendingUp,
      color: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
    },
    {
      title: 'Commission Earned',
      value: `AED ${Number(summary.totalCommissionEarned || 0).toFixed(2)}`,
      subtitle: `${summary.commissionRate}% net rate on all sales`,
      icon: Coins,
      color: 'from-yellow-500/20 to-yellow-500/5 text-yellow-300 border-yellow-500/30',
    },
    {
      title: 'Available Wallet',
      value: `AED ${Number(summary.walletBalance || 0).toFixed(2)}`,
      subtitle: `AED ${Number(summary.pendingPayoutAmount || 0).toFixed(2)} pending clearance`,
      icon: Wallet,
      color: 'from-[#dfba73]/25 to-[#dfba73]/10 text-[#dfba73] border-[#dfba73]/40',
      actionLink: '/influencer/wallet',
      actionText: 'Request Payout',
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="w-10 h-10 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs tracking-wider uppercase text-[#dfba73]">
          Loading Analytics Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn font-['Poppins',sans-serif]">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Performance Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#dfba73]/15 border border-[#dfba73]/30 text-[#dfba73] text-[11px] font-semibold">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Track your influence, visitor engagement, attributed orders, and accumulated commissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/influencer/products"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white font-medium flex items-center gap-1.5 transition-all"
          >
            <span>Product Referral Links</span>
            <ArrowUpRight size={14} />
          </Link>
          <Link
            to="/influencer/wallet"
            className="px-4 py-2 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#dfba73]/20"
          >
            <Wallet size={14} />
            <span>Manage Wallet</span>
          </Link>
        </div>
      </div>

      {/* Primary Referral Link Hero Card */}
      <div className="bg-gradient-to-br from-[#121218] via-[#101015] to-[#0a0a0f] border border-[#dfba73]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#dfba73]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#dfba73]/20 text-[#dfba73]">
                <Sparkles size={16} />
              </span>
              <span className="text-xs uppercase tracking-widest text-[#dfba73] font-semibold">
                Your Exclusive Referral Link
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Share Your Link & Give Followers 20% OFF
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Anyone shopping through your link automatically receives a <span className="text-white font-semibold">20% discount</span> on the entire MMMK WODE catalog. You earn a guaranteed <span className="text-[#dfba73] font-semibold">10% cash commission</span> on the net order total!
            </p>

            {/* URL Display and Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center bg-[#171720] border border-white/10 rounded-xl px-3.5 py-2.5">
                <span className="text-xs font-mono text-[#dfba73] truncate">
                  {storefrontUrl}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-5 py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#cba255] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#dfba73]/20 active:scale-95"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs flex items-center justify-center gap-2 transition-all"
                title="View QR Code"
              >
                <QrCode size={15} />
                <span>QR Code</span>
              </button>
            </div>
          </div>

          {/* Quick Code Badge */}
          <div className="bg-[#181822] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center w-full lg:w-56 shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              Your Referral Code
            </span>
            <div className="text-2xl font-mono font-extrabold text-[#dfba73] tracking-wider my-1">
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-[#0f0f15] border border-white/5 hover:border-white/15 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    {kpi.title}
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
                    {kpi.value}
                  </div>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} border flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400">{kpi.subtitle}</span>
                {kpi.actionLink && (
                  <Link
                    to={kpi.actionLink}
                    className="text-[#dfba73] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>{kpi.actionText}</span>
                    <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Recent Attributed Orders & Wallet Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#dfba73]" />
                <h3 className="text-base font-semibold text-white">
                  Recent Attributed Orders
                </h3>
              </div>
              <Link
                to="/influencer/orders"
                className="text-xs text-[#dfba73] hover:underline font-medium"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => {
                  const orderVal =
                    order.price?.total || order.amount || order.totalAmount || 0;
                  const commVal =
                    order.influencerCommissionAmount ||
                    Number((orderVal * 0.1).toFixed(2));
                  const statusColors = {
                    Complete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                  };

                  return (
                    <div
                      key={order._id || order.orderId}
                      className="p-3.5 rounded-xl bg-[#14141b] border border-white/5 hover:border-white/10 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-medium">
                            #{order.orderId || String(order._id).slice(-8)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${
                              statusColors[order.status] ||
                              'bg-gray-500/10 text-gray-300 border-gray-500/30'
                            }`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          <Clock size={11} />
                          <span>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-white font-medium">
                          AED {Number(orderVal).toFixed(2)}
                        </div>
                        <div className="text-[#dfba73] font-semibold text-[11px]">
                          +AED {Number(commVal).toFixed(2)} Comm.
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-500 text-xs">
                  <ShoppingBag size={28} className="mx-auto text-gray-600 mb-2" />
                  <p>No attributed orders recorded yet.</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Share your referral link on your social channels to generate your first order!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Ledger Activity */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-[#dfba73]" />
                <h3 className="text-base font-semibold text-white">
                  Recent Wallet Ledger
                </h3>
              </div>
              <Link
                to="/influencer/wallet"
                className="text-xs text-[#dfba73] hover:underline font-medium"
              >
                Wallet Details &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => {
                  const isCredit = (tx.amount || 0) > 0;
                  return (
                    <div
                      key={tx._id}
                      className="p-3.5 rounded-xl bg-[#14141b] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownLeft size={16} />
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium capitalize">
                            {String(tx.type || 'Transaction').replace('_', ' ')}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {tx.createdAt
                              ? new Date(tx.createdAt).toLocaleDateString()
                              : 'Recent'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            isCredit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : ''}
                          AED {Number(tx.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Bal: AED {Number(tx.balanceAfter || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-500 text-xs">
                  <Coins size={28} className="mx-auto text-gray-600 mb-2" />
                  <p>No wallet activity recorded yet.</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Your commissions will credit automatically once customer orders are paid.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101016] border border-[#dfba73]/30 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#dfba73]/10 border border-[#dfba73]/30 flex items-center justify-center text-[#dfba73] mx-auto mb-3">
              <QrCode size={24} />
            </div>

            <h3 className="text-lg font-bold text-white">Your Storefront QR Code</h3>
            <p className="text-xs text-gray-400 mt-1">
              Followers can scan this code with their smartphone camera to instantly get 20% OFF.
            </p>

            <div className="my-5 p-4 bg-[#0a0a0e] rounded-xl border border-white/5 inline-block">
              <img
                src={qrImageUrl}
                alt={`QR code for ${storefrontUrl}`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            </div>

            <div className="text-xs font-mono text-[#dfba73] bg-[#161620] py-2 px-3 rounded-lg border border-white/5 truncate mb-4">
              {storefrontUrl}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs transition-all"
            >
              {copiedLink ? 'Link Copied!' : 'Copy Storefront Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerDashboardPage;
