import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';
import {
  getPayoutHistoryApi,
  requestPayoutApi,
} from '../../apis/influencer/client';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const InfluencerWalletPage = () => {
  const { influencer, refreshProfile } = useInfluencerAuth();
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('BankTransfer');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const walletBalance = Number(influencer?.walletBalance || 0);
  const pendingPayoutAmount = Number(influencer?.pendingPayoutAmount || 0);
  const totalPaidOut = Number(influencer?.totalPaidOut || 0);
  const totalCommissionEarned = Number(influencer?.totalCommissionEarned || 0);
  const payoutDetails = influencer?.payoutDetails || {};

  const MIN_PAYOUT = 100;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPayoutHistoryApi();
      if (res.success && res.data) {
        setRequests(res.data.requests || []);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setFormError('');
    setFormSuccess('');
    setAmount('');
    setNotes('');
    setShowModal(true);
  };

  const handleMaxClick = () => {
    setAmount(walletBalance.toFixed(2));
  };

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const reqAmt = parseFloat(amount);
    if (!reqAmt || reqAmt <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    if (reqAmt < MIN_PAYOUT) {
      setFormError(`Minimum withdrawal amount is AED ${MIN_PAYOUT}.`);
      return;
    }

    if (reqAmt > walletBalance) {
      setFormError(`Withdrawal exceeds available balance (AED ${walletBalance.toFixed(2)}).`);
      return;
    }

    if (
      payoutMethod === 'BankTransfer' &&
      (!payoutDetails.accountNumber || !payoutDetails.accountHolderName)
    ) {
      setFormError(
        'Please enter your bank account details in your Profile before requesting a bank transfer payout.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await requestPayoutApi({
        amount: reqAmt,
        payoutMethod,
        notes,
      });

      if (res.success) {
        setFormSuccess('Withdrawal request submitted successfully! Pending admin approval.');
        await refreshProfile();
        await fetchData();
        setTimeout(() => {
          setShowModal(false);
        }, 1800);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit payout request.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const hasPendingRequest = requests.some((r) => r.status === 'Pending');

  return (
    <div className="space-y-8 animate-fadeIn font-['Poppins',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Wallet, Earnings & Payouts</span>
            <span className="px-2 py-0.5 rounded-full bg-[#dfba73]/15 border border-[#dfba73]/30 text-[#dfba73] text-[11px] font-semibold">
              Live Balance
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Monitor real-time commission earnings, clearance statuses, and submit withdrawal requests.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={walletBalance < MIN_PAYOUT || hasPendingRequest}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#dfba73] via-[#cca154] to-[#8d6f30] text-black font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#dfba73]/20 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Wallet size={15} />
          <span>Request Payout</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Available Wallet Balance */}
        <div className="bg-gradient-to-br from-[#181822] to-[#0e0e14] border border-[#dfba73]/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#dfba73]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Available Balance</span>
            <div className="p-1.5 rounded-lg bg-[#dfba73]/20 text-[#dfba73]">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#dfba73] tracking-tight mt-2">
            AED {walletBalance.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Cleared & ready for withdrawal
          </p>
        </div>

        {/* Pending Clearance */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Pending Clearance</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
            AED {pendingPayoutAmount.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-500 mt-3">
            Withdrawals undergoing bank approval
          </p>
        </div>

        {/* Total Paid Out */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Paid Out</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
            AED {totalPaidOut.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-500 mt-3">
            Successfully disbursed to your account
          </p>
        </div>

        {/* Lifetime Commission Earned */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Lifetime Commissions</span>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-300">
              <Coins size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2">
            AED {totalCommissionEarned.toFixed(2)}
          </div>
          <p className="text-[11px] text-gray-500 mt-3">
            Total 10% referral credits since joining
          </p>
        </div>
      </div>

      {/* Payout Notice Banner if Pending */}
      {hasPendingRequest && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-300">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            You have a withdrawal request currently under review. Our finance team processes payouts every business cycle. Once approved, the bank transfer reference (UTR) will appear below.
          </span>
        </div>
      )}

      {/* Payout History & Ledger Section */}
      <div className="space-y-6">
        {/* Payout Requests Table */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard size={16} className="text-[#dfba73]" />
              <span>Withdrawal Requests & Disbursement History</span>
            </h3>
            <span className="text-xs text-gray-500">
              Min. threshold AED {MIN_PAYOUT}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Loading payout history...
            </div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#14141c] border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-5">Request Reference</th>
                    <th className="py-3.5 px-5">Date Requested</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Method</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Bank Reference / UTR</th>
                    <th className="py-3.5 px-5">Processed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.map((req) => {
                    const statusPills = {
                      Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                      Approved: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                      Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      Rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    };

                    return (
                      <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5 font-mono text-white font-medium">
                          #{String(req._id).slice(-8).toUpperCase()}
                        </td>
                        <td className="py-4 px-5 text-gray-300">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </td>
                        <td className="py-4 px-5 font-bold text-white">
                          AED {Number(req.requestedAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-5 text-gray-300">
                          {req.payoutMethod || 'BankTransfer'}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-medium ${
                              statusPills[req.status] ||
                              'bg-gray-500/10 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          {req.transactionReference ? (
                            <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {req.transactionReference}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-gray-400">
                          {req.processedAt
                            ? new Date(req.processedAt).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              <Wallet size={32} className="mx-auto text-gray-600 mb-2" />
              <p>No withdrawal requests submitted yet.</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Once your available balance reaches AED 100, click &quot;Request Payout&quot; above.
              </p>
            </div>
          )}
        </div>

        {/* Audit Wallet Ledger Table */}
        <div className="bg-[#0f0f15] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Coins size={16} className="text-[#dfba73]" />
              <span>Wallet Audit Ledger Transactions</span>
            </h3>
            <span className="text-xs text-gray-500">Immutable financial ledger</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              Loading ledger...
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#14141c] border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="py-3.5 px-5">Transaction Type</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Amount</th>
                    <th className="py-3.5 px-5">Balance Before</th>
                    <th className="py-3.5 px-5">Balance After</th>
                    <th className="py-3.5 px-5">Notes / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => {
                    const isCredit = (tx.amount || 0) > 0;
                    return (
                      <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-semibold text-white capitalize">
                            {String(tx.type || 'Transaction').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-gray-400">
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleDateString()
                            : 'Recent'}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`font-bold ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isCredit ? '+' : ''}
                            AED {Number(tx.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-gray-400">
                          AED {Number(tx.balanceBefore || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-5 font-medium text-white">
                          AED {Number(tx.balanceAfter || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-5 text-gray-400 truncate max-w-xs">
                          {tx.notes || (tx.orderId ? `Order #${tx.orderId}` : '-')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-xs">
              No ledger transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Request Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101016] border border-[#dfba73]/40 rounded-2xl p-6 sm:p-7 max-w-lg w-full relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#dfba73]/15 border border-[#dfba73]/30 flex items-center justify-center text-[#dfba73]">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Request Wallet Payout</h3>
                <p className="text-xs text-gray-400">
                  Withdraw your accrued commission earnings
                </p>
              </div>
            </div>

            {/* Error or Success Alerts */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayout} className="space-y-4">
              {/* Available Balance Box */}
              <div className="p-3.5 rounded-xl bg-[#171720] border border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Available to Withdraw:</span>
                <span className="text-base font-bold text-[#dfba73]">
                  AED {walletBalance.toFixed(2)}
                </span>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider text-gray-300 font-medium">
                    Withdrawal Amount (AED)
                  </label>
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="text-[11px] text-[#dfba73] hover:underline font-semibold"
                  >
                    Withdraw All
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-xs font-semibold pointer-events-none">
                    AED
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={MIN_PAYOUT}
                    max={walletBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Min. ${MIN_PAYOUT}`}
                    required
                    className="w-full pl-12 pr-4 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#dfba73] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Minimum withdrawal threshold: AED {MIN_PAYOUT}
                </p>
              </div>

              {/* Payout Method */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-300 font-medium mb-1.5">
                  Payout Method
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#171720] border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-[#dfba73]"
                >
                  <option value="BankTransfer">Bank Transfer (Wire / NEFT / RTGS)</option>
                  <option value="UPI">UPI Transfer</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>

              {/* Payout Details Snapshot Confirmation */}
              <div className="p-3.5 rounded-xl bg-[#14141c] border border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between text-gray-400 pb-1 border-b border-white/5">
                  <span className="font-semibold text-white">Disbursement Destination:</span>
                  <Link
                    to="/influencer/profile"
                    onClick={() => setShowModal(false)}
                    className="text-[11px] text-[#dfba73] hover:underline"
                  >
                    Edit in Profile &rarr;
                  </Link>
                </div>
                {payoutMethod === 'BankTransfer' ? (
                  <div className="text-[11px] text-gray-300 space-y-0.5 pt-1">
                    <div>
                      <span className="text-gray-500">Holder:</span>{' '}
                      {payoutDetails.accountHolderName || 'Not configured'}
                    </div>
                    <div>
                      <span className="text-gray-500">Bank:</span>{' '}
                      {payoutDetails.bankName || 'Not configured'}
                    </div>
                    <div>
                      <span className="text-gray-500">Account / IBAN:</span>{' '}
                      {payoutDetails.accountNumber ? `••••${String(payoutDetails.accountNumber).slice(-4)}` : 'Not configured'}
                    </div>
                  </div>
                ) : payoutMethod === 'UPI' ? (
                  <div className="text-[11px] text-gray-300 pt-1">
                    <span className="text-gray-500">UPI ID:</span>{' '}
                    {payoutDetails.upiId || 'Not configured in profile'}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-300 pt-1">
                    <span className="text-gray-500">PayPal Email:</span>{' '}
                    {payoutDetails.paypalEmail || influencer?.email}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-300 font-medium mb-1">
                  Optional Note for Finance Team
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions or tax references..."
                  className="w-full px-3.5 py-2 bg-[#171720] border border-white/10 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#dfba73]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#dfba73] hover:bg-[#caa055] text-black text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfluencerWalletPage;
