import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getInfluencerOrdersApi } from '../../apis/influencer/client';

const InfluencerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const res = await getInfluencerOrdersApi({
          page,
          limit: 10,
          status: statusFilter || undefined,
        });

        if (res.success && res.data) {
          setOrders(res.data.orders || []);
          if (res.data.pagination) {
            setPagination(res.data.pagination);
          }
        }
      } catch (err) {
        console.error('Failed to load attributed orders:', err);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const statusConfig = {
    Complete: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2,
    },
    Processing: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: Clock,
    },
    Pending: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Clock,
    },
    Cancelled: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      icon: XCircle,
    },
  };

  const commStatusConfig = {
    Earned: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Reversed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <div className="space-y-6 animate-fadeIn font-['Poppins',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Attributed Customer Orders</span>
            <span className="px-2 py-0.5 rounded-full bg-[#dfba73]/15 border border-[#dfba73]/30 text-[#dfba73] text-[11px] font-semibold">
              {pagination.total} Total
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time feed of purchases referred through your links or discount code.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#121217] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-[#121217]">All Order Statuses</option>
            <option value="Complete" className="bg-[#121217]">Complete</option>
            <option value="Processing" className="bg-[#121217]">Processing</option>
            <option value="Pending" className="bg-[#121217]">Pending</option>
            <option value="Cancelled" className="bg-[#121217]">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-[#0f0f15] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-10 h-10 border-2 border-[#dfba73] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs uppercase tracking-wider text-[#dfba73]">
              Loading Attributed Orders...
            </p>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#14141c] border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                  <th className="py-4 px-5">Order Reference</th>
                  <th className="py-4 px-5">Date & Time</th>
                  <th className="py-4 px-5">Order Amount</th>
                  <th className="py-4 px-5">Customer 20% Discount</th>
                  <th className="py-4 px-5">Your 10% Commission</th>
                  <th className="py-4 px-5">Order Status</th>
                  <th className="py-4 px-5">Commission Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const orderVal =
                    order.price?.total || order.amount || order.totalAmount || 0;
                  const discountVal =
                    order.influencerDiscountAmount ||
                    order.price?.influencerDiscount ||
                    0;
                  const commVal =
                    order.influencerCommissionAmount ||
                    Number((orderVal * 0.1).toFixed(2));
                  const conf = statusConfig[order.status] || {
                    bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
                    icon: Clock,
                  };
                  const StatusIcon = conf.icon;
                  const commStatus = order.influencerCommissionStatus || (order.status === 'Complete' ? 'Earned' : 'Pending');

                  return (
                    <tr
                      key={order._id || order.orderId}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Order Reference */}
                      <td className="py-4 px-5">
                        <div className="font-mono text-white font-semibold">
                          #{order.orderId || String(order._id).slice(-8)}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {order.products?.length || 1} item(s) purchased
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-500" />
                          <span>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 pl-5">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </div>
                      </td>

                      {/* Order Amount */}
                      <td className="py-4 px-5 font-bold text-white">
                        AED {Number(orderVal).toFixed(2)}
                      </td>

                      {/* Customer Discount */}
                      <td className="py-4 px-5 text-[#dfba73] font-medium">
                        -AED {Number(discountVal).toFixed(2)}
                      </td>

                      {/* Commission */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <Coins size={13} />
                          +AED {Number(commVal).toFixed(2)}
                        </span>
                      </td>

                      {/* Order Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium ${conf.bg}`}
                        >
                          <StatusIcon size={12} />
                          <span>{order.status || 'Pending'}</span>
                        </span>
                      </td>

                      {/* Commission Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${
                            commStatusConfig[commStatus] ||
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}
                        >
                          {commStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">
            <ShoppingBag size={36} className="mx-auto text-gray-600 mb-2" />
            <p className="text-sm font-medium text-gray-400">No attributed orders found.</p>
            <p className="text-xs text-gray-600 mt-1">
              When followers purchase with your link or code, their orders appear here in real time.
            </p>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 bg-[#14141c] border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <div>
              Page <span className="text-white font-medium">{pagination.page}</span> of{' '}
              <span className="text-white font-medium">{pagination.pages}</span> ({pagination.total} orders)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f15] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg bg-[#0f0f15] border border-white/10 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerOrdersPage;
