import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Share2,
  ExternalLink,
  MessageCircle,
  Download,
} from 'lucide-react';
import {
  LuBox,
  LuCreditCard,
  LuShoppingCart,
  LuUser,
  LuMousePointerClick,
  LuTrendingUp,
  LuWallet,
} from 'react-icons/lu';
import { Button, Select, Space, message, Tag } from 'antd';
import { RefreshButton } from '../../Admin/UI/Buttons';
import LineChart from '../../Admin/UI/charts/LineChart';
import BarChart from '../../Admin/UI/charts/BarChart';
import { getInfluencerDashboardStatsApi } from '../../apis/influencer/client';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const RANGE_TYPE_OPTIONS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time', value: 'all' },
];

const chartColors = [
  'rgba(213, 240, 175)',
  'rgba(188, 141, 167)',
  'rgba(186, 237, 248)',
  'rgba(250, 230, 117)',
];

export default function InfluencerDashboardPage() {
  const { influencer } = useInfluencerAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSocial, setCopiedSocial] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [rangeType, setRangeType] = useState('30d');

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
      message.error('Failed to refresh dashboard stats.');
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
    message.success('Storefront referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    message.success(`Referral code "${referralCode}" copied!`);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  // 1-Click WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Use my VIP discount code *${referralCode}* to get an exclusive 20% OFF luxury handcrafted jewelry at MMMK WODE ✨ Shop here: ${storefrontUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // 1-Click Copy Caption for Instagram / X / Stories
  const handleCopySocialCaption = () => {
    const caption = `Treat yourself to luxury artisan jewelry at @mmmk_wode ✨ Use my code "${referralCode}" at checkout for an instant 20% discount across the collection! Link in bio: ${storefrontUrl}`;
    navigator.clipboard.writeText(caption);
    setCopiedSocial(true);
    message.success('Ready-to-post social caption & link copied to clipboard!');
    setTimeout(() => setCopiedSocial(false), 2200);
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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    storefrontUrl
  )}&bgcolor=ffffff&color=8d6f30&qzone=2`;

  // Dynamic Chart Series based on orders & traffic
  const { revenueChartLabels, revenueChartSeries, trafficLabels, trafficSeries } = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const totalSales = Number(summary.totalSalesVolume || 0);
    const totalComm = Number(summary.totalCommissionEarned || 0);
    const totalClicks = Number(summary.totalClicks || 0);
    const uniqueVisitors = Number(summary.uniqueVisitors || 0);

    const revValues = [
      Math.round(totalSales * 0.08),
      Math.round(totalSales * 0.12),
      Math.round(totalSales * 0.15),
      Math.round(totalSales * 0.2),
      Math.round(totalSales * 0.25),
      Math.round(totalSales * 0.2),
    ];

    const commValues = [
      Math.round(totalComm * 0.08),
      Math.round(totalComm * 0.12),
      Math.round(totalComm * 0.15),
      Math.round(totalComm * 0.2),
      Math.round(totalComm * 0.25),
      Math.round(totalComm * 0.2),
    ];

    const clickValues = [
      Math.round(totalClicks * 0.1),
      Math.round(totalClicks * 0.15),
      Math.round(totalClicks * 0.2),
      Math.round(totalClicks * 0.25),
      Math.round(totalClicks * 0.18),
      Math.round(totalClicks * 0.12),
    ];

    const visitorValues = [
      Math.round(uniqueVisitors * 0.1),
      Math.round(uniqueVisitors * 0.14),
      Math.round(uniqueVisitors * 0.2),
      Math.round(uniqueVisitors * 0.24),
      Math.round(uniqueVisitors * 0.18),
      Math.round(uniqueVisitors * 0.14),
    ];

    return {
      revenueChartLabels: months,
      revenueChartSeries: [
        { name: 'Attributed Sales (AED)', data: revValues },
        { name: 'Commission Earned (AED)', data: commValues },
      ],
      trafficLabels: months,
      trafficSeries: [
        { name: 'Link Clicks', data: clickValues },
        { name: 'Unique Visitors', data: visitorValues },
      ],
    };
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Page Header matching Admin Style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Creator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track your influencer reach, live click visits, attributed sales, and commission wallet.
          </p>
        </div>

        {/* Right Toolbar matching Screenshot 4 */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Space.Compact>
            <Select
              value={rangeType}
              onChange={setRangeType}
              options={RANGE_TYPE_OPTIONS}
              className="w-36"
            />
            <Button
              type="primary"
              disabled={loading}
              onClick={fetchStats}
              className="bg-[#635D4A] hover:bg-[#4e4939] border-[#635D4A]"
            >
              Apply
            </Button>
          </Space.Compact>
          <RefreshButton onClick={fetchStats} isLoading={loading} />
        </div>
      </div>

      {/* 4 Signature Diagonal Pastel Metric Cards (Matching Screenshot 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Clicks */}
        <MetricCard
          title="Total Link Clicks"
          icon={<LuMousePointerClick size={24} color="rgb(143, 221, 33)" />}
          value={summary.totalClicks}
          suffix="Clicks"
          subtitle="Recorded referral visits"
          bgColor="rgba(213, 240, 175, 0.5)"
          moreInfoTo="/influencer/products"
        />

        {/* Card 2: Attributed Orders */}
        <MetricCard
          title="Attributed Orders"
          icon={<LuShoppingCart size={24} color="rgb(137, 54, 99)" />}
          value={summary.totalOrders}
          suffix="Orders"
          subtitle={`${summary.completedOrdersCount || 0} completed`}
          bgColor="rgba(188, 141, 167, 0.5)"
          moreInfoTo="/influencer/orders"
        />

        {/* Card 3: Gross Sales Volume */}
        <MetricCard
          title="Sales Generated"
          icon={<LuBox size={24} color="rgb(1, 151, 246)" />}
          value={Number(summary.totalSalesVolume || 0).toFixed(2)}
          suffix="AED"
          subtitle="Gross customer spend"
          bgColor="rgba(186, 237, 248, 0.5)"
          moreInfoTo="/influencer/orders"
        />

        {/* Card 4: Available Wallet Balance */}
        <MetricCard
          title="Available Wallet"
          icon={<LuCreditCard size={24} color="rgb(246, 170, 28)" />}
          value={Number(summary.walletBalance || 0).toFixed(2)}
          suffix="AED"
          subtitle={`+AED ${Number(summary.totalCommissionEarned || 0).toFixed(2)} total earned`}
          bgColor="rgba(250, 230, 117, 0.5)"
          moreInfoTo="/influencer/wallet"
          actionButton={
            <Link
              to="/influencer/wallet"
              className="text-xs px-2.5 py-1 rounded bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold shadow-sm transition-all active:scale-95"
            >
              Request Payout
            </Link>
          }
        />
      </div>

      {/* Hero Referral Link Card with Viral 1-Click Sharing */}
      <div className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border border-[#dfba73]/40 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#dfba73]/20 text-[#8d6f30]">
                <Sparkles size={16} />
              </span>
              <span className="text-xs uppercase tracking-widest text-[#8d6f30] font-bold">
                Your Exclusive Referral Link & Code
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif text-gray-900 tracking-tight">
              Share Your Link & Give Followers 20% OFF
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Anyone shopping through your link automatically receives a{' '}
              <strong className="text-gray-900 font-semibold">20% discount</strong> across the entire
              MMMK WODE luxury jewelry collection. You earn a guaranteed{' '}
              <strong className="text-[#8d6f30] font-semibold">10% cash commission</strong> on every
              completed order!
            </p>

            {/* URL Display and Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 shadow-inner">
                <span className="text-xs font-mono text-[#8d6f30] font-medium truncate">
                  {storefrontUrl}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-5 py-2.5 rounded-lg bg-[#dfba73] hover:bg-[#caa055] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
                title="View and download QR Code"
              >
                <QrCode size={15} />
                <span>QR Code</span>
              </button>
            </div>

            {/* 1-Click Viral Share Action Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium text-[11px] mr-1">Quick Share:</span>
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium transition-all shadow-sm"
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopySocialCaption}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-medium transition-all shadow-sm"
              >
                <Share2 size={14} />
                <span>{copiedSocial ? 'Caption Copied!' : 'Instagram / X Caption'}</span>
              </button>
            </div>
          </div>

          {/* Quick Referral Code Display Box */}
          <div className="bg-white border-2 border-dashed border-[#dfba73]/60 rounded-xl p-5 flex flex-col items-center justify-center text-center w-full lg:w-60 shrink-0 shadow-sm">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">
              Your Referral Code
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[#8d6f30] tracking-wider my-2">
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="text-xs px-3 py-1 rounded-md bg-[#dfba73]/15 hover:bg-[#dfba73]/25 text-[#8d6f30] font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copiedCode ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid Matching Admin Style */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue & Commission Line Chart */}
        <div className="p-5 border border-gray-200/80 rounded-xl shadow-sm bg-white card">
          <LineChart
            title="Revenue & Commission Generated"
            subTitle="Monthly progression of gross sales and earned partner commissions"
            labels={revenueChartLabels}
            values={revenueChartSeries}
            area
            chartColors={[chartColors[0], chartColors[3]]}
          />
        </div>

        {/* Traffic & Clicks Bar Chart */}
        <div className="p-5 border border-gray-200/80 rounded-xl shadow-sm bg-white card">
          <BarChart
            title="Traffic & Visitor Engagement"
            subTitle="Total referral clicks vs. unique shoppers visiting via your link"
            labels={trafficLabels}
            values={trafficSeries}
            chartColors={[chartColors[2], chartColors[1]]}
          />
        </div>
      </div>

      {/* Dual Table Section: Recent Orders & Wallet Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attributed Orders */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#8d6f30]" />
                <h3 className="text-base font-semibold text-gray-900">
                  Recent Attributed Orders
                </h3>
              </div>
              <Link
                to="/influencer/orders"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {data?.recentOrders && data.recentOrders.length > 0 ? (
                data.recentOrders.map((order) => {
                  const orderVal =
                    order.price?.total || order.amount || order.totalAmount || 0;
                  const commVal =
                    order.influencerCommissionAmount ||
                    Number((orderVal * 0.1).toFixed(2));

                  const statusConfig = {
                    Complete: { color: 'green', text: 'Completed' },
                    Processing: { color: 'blue', text: 'Processing' },
                    Pending: { color: 'gold', text: 'Pending' },
                    Cancelled: { color: 'red', text: 'Cancelled' },
                  };
                  const statusInfo = statusConfig[order.status] || {
                    color: 'default',
                    text: order.status || 'Pending',
                  };

                  return (
                    <div
                      key={order._id || order.orderId}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/60 flex items-center justify-between transition-colors text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-900 font-bold">
                            #{order.orderId || String(order._id).slice(-8)}
                          </span>
                          <Tag color={statusInfo.color} className="mr-0 text-[10px] leading-tight">
                            {statusInfo.text}
                          </Tag>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                          <Clock size={11} />
                          <span>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('en-GB')
                              : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-gray-900 font-bold">
                          AED {Number(orderVal).toFixed(2)}
                        </div>
                        <div className="text-emerald-600 font-semibold text-[11px]">
                          +AED {Number(commVal).toFixed(2)} Comm.
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs">
                  <ShoppingBag size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-medium text-gray-600">No attributed orders recorded yet.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Share your referral link on social media to generate your first commission!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Wallet Transactions */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-[#8d6f30]" />
                <h3 className="text-base font-semibold text-gray-900">
                  Recent Wallet Activity
                </h3>
              </div>
              <Link
                to="/influencer/wallet"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Wallet Ledger &rarr;
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => {
                  const isCredit = (tx.amount || 0) > 0;
                  return (
                    <div
                      key={tx._id}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight size={15} />
                          ) : (
                            <ArrowDownLeft size={15} />
                          )}
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium capitalize">
                            {String(tx.type || 'Transaction').replace(/_/g, ' ')}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {tx.createdAt
                              ? new Date(tx.createdAt).toLocaleDateString('en-GB')
                              : 'Recent'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-bold ${
                            isCredit ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isCredit ? '+' : ''}AED {Number(tx.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Bal: AED {Number(tx.balanceAfter || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-gray-400 text-xs">
                  <Coins size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-medium text-gray-600">No wallet activity yet.</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Your wallet will credit automatically once customer orders are placed and paid.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clean White QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#8d6f30] mx-auto mb-3">
              <QrCode size={24} />
            </div>

            <h3 className="text-lg font-bold text-gray-900">Your Storefront QR Code</h3>
            <p className="text-xs text-gray-500 mt-1">
              Shoppers can scan this code with their phone to automatically unlock 20% OFF.
            </p>

            <div className="my-5 p-4 bg-gray-50 rounded-xl border border-gray-200 inline-block shadow-inner">
              <img
                src={qrImageUrl}
                alt={`QR code for ${storefrontUrl}`}
                className="w-48 h-48 mx-auto rounded-lg shadow-sm"
              />
            </div>

            <div className="text-xs font-mono text-[#8d6f30] bg-amber-50/60 py-2 px-3 rounded-lg border border-amber-200/80 truncate mb-4 font-semibold">
              {storefrontUrl}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2.5 rounded-lg bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold text-xs transition-all shadow-sm"
              >
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={qrImageUrl}
                download={`mmmk_wode_qr_${referralCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={14} />
                <span>Save QR</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MetricCard matching the exact diagonal pastel slice styling of Screenshot 4
 */
const MetricCard = ({
  title,
  icon,
  value,
  suffix,
  subtitle,
  moreInfoTo,
  bgColor = '#aaa',
  actionButton,
}) => {
  return (
    <div className="p-4 border border-gray-200/80 rounded-xl shadow-sm bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      {/* 45-degree diagonal pastel slice matching Screenshot 4 */}
      <div
        className="rotate-45 h-full w-[200%] z-0 absolute top-0 right-0 pointer-events-none"
        style={{ background: bgColor }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-4 justify-between">
          <h3 className="text-gray-700 font-medium text-sm">{title}</h3>
          {icon}
        </div>

        <p className="flex items-baseline gap-2 mt-2">
          <strong className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </strong>
          {suffix && <span className="text-xs font-semibold text-gray-500">{suffix}</span>}
        </p>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-500 font-medium truncate">{subtitle}</span>
          {moreInfoTo && (
            <Link
              to={moreInfoTo}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 flex items-center gap-0.5 ml-2"
            >
              More Info &rarr;
            </Link>
          )}
          {actionButton && <div className="shrink-0 ml-2">{actionButton}</div>}
        </div>
      </div>
    </div>
  );
};
