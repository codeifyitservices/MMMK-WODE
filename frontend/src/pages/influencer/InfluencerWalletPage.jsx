import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  LuBox,
  LuCreditCard,
  LuShoppingCart,
  LuUser,
  LuWallet,
} from 'react-icons/lu';
import { Table, Tag, Modal, Input, Select, Button, message, Space } from 'antd';
import { RefreshButton } from '../../Admin/UI/Buttons';
import {
  getPayoutHistoryApi,
  requestPayoutApi,
} from '../../apis/influencer/client';
import { useInfluencerAuth } from '../../context/InfluencerAuthProvider';

const MIN_PAYOUT = 200;

export default function InfluencerWalletPage() {
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

  const walletBalance = Number(influencer?.walletBalance || 0);
  const pendingPayoutAmount = Number(influencer?.pendingPayoutAmount || 0);
  const totalPaidOut = Number(influencer?.totalPaidOut || 0);
  const totalCommissionEarned = Number(influencer?.totalCommissionEarned || 0);
  const payoutDetails = influencer?.payoutDetails || {};

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
      message.error('Failed to load wallet data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = () => {
    setAmount('');
    setNotes('');
    setShowModal(true);
  };

  const handleMaxClick = () => {
    setAmount(walletBalance.toFixed(2));
  };

  const handleSubmitPayout = async () => {
    const reqAmt = parseFloat(amount);
    if (!reqAmt || reqAmt <= 0) {
      message.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (reqAmt < MIN_PAYOUT) {
      message.error(`Minimum withdrawal amount is AED ${MIN_PAYOUT}.`);
      return;
    }

    if (reqAmt > walletBalance) {
      message.error(`Withdrawal exceeds available balance (AED ${walletBalance.toFixed(2)}).`);
      return;
    }

    if (
      payoutMethod === 'BankTransfer' &&
      (!payoutDetails.accountNumber || !payoutDetails.accountHolderName)
    ) {
      message.warning(
        'Please configure your bank account in Profile & Banking before requesting a bank transfer.'
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
        message.success('Withdrawal request submitted! Pending store admin processing.');
        setShowModal(false);
        await refreshProfile();
        await fetchData();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit payout request.';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Payout requests table columns
  const requestColumns = useMemo(
    () => [
      {
        title: 'Request ID',
        dataIndex: '_id',
        key: '_id',
        render: (id) => (
          <span className="font-mono text-xs font-bold text-gray-900">
            #{String(id).slice(-8).toUpperCase()}
          </span>
        ),
      },
      {
        title: 'Requested Date',
        dataIndex: 'requestedAt',
        key: 'requestedAt',
        render: (date) => (
          <span className="text-xs text-gray-600 font-medium">
            {date ? new Date(date).toLocaleDateString('en-GB') : '-'}
          </span>
        ),
      },
      {
        title: 'Amount',
        dataIndex: 'requestedAmount',
        key: 'requestedAmount',
        render: (val) => (
          <span className="font-bold text-sm text-gray-900">
            AED {Number(val || 0).toFixed(2)}
          </span>
        ),
      },
      {
        title: 'Method',
        dataIndex: 'payoutMethod',
        key: 'payoutMethod',
        render: (m) => (
          <Tag color="cyan" className="text-xs font-medium">
            {m === 'BankTransfer' ? 'Bank Transfer' : m}
          </Tag>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colorMap = {
            Paid: 'green',
            Approved: 'blue',
            Pending: 'gold',
            Rejected: 'red',
          };
          return (
            <Tag color={colorMap[status] || 'default'} className="font-semibold text-xs">
              {status}
            </Tag>
          );
        },
      },
      {
        title: 'Bank Reference / UTR',
        dataIndex: 'transactionReference',
        key: 'transactionReference',
        render: (ref) =>
          ref ? (
            <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {ref}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">Pending Admin Transfer</span>
          ),
      },
    ],
    []
  );

  // Transactions ledger table columns
  const transactionColumns = useMemo(
    () => [
      {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-xs text-gray-600 font-medium">
            {date ? new Date(date).toLocaleDateString('en-GB') : '-'}
          </span>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (t) => (
          <Tag color={t?.includes('Credit') ? 'green' : 'red'} className="text-xs font-medium">
            {String(t || 'Transaction').replace(/_/g, ' ')}
          </Tag>
        ),
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (desc) => <span className="text-xs text-gray-700">{desc}</span>,
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amt, r) => {
          const isCredit = r.type?.includes('Credit') || amt > 0;
          return (
            <span
              className={`font-bold text-xs ${
                isCredit ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {isCredit ? '+' : ''}AED {Number(amt || 0).toFixed(2)}
            </span>
          );
        },
      },
      {
        title: 'Balance After',
        dataIndex: 'balanceAfter',
        key: 'balanceAfter',
        render: (bal) => (
          <span className="font-mono text-xs font-semibold text-gray-900">
            AED {Number(bal || 0).toFixed(2)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Wallet & Commission Payouts
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage your accumulated referral earnings, request withdrawals, and audit transaction records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="primary"
            onClick={handleOpenModal}
            className="bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0 shadow-sm"
          >
            Request Payout
          </Button>
          <RefreshButton onClick={fetchData} isLoading={loading} />
        </div>
      </div>

      {/* 4 Diagonal Pastel Metric Cards (Matching Admin Screenshot 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="p-4 border border-gray-200/80 rounded-xl shadow-sm bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div
            className="rotate-45 h-full w-[200%] z-0 absolute top-0 right-0 pointer-events-none"
            style={{ background: 'rgba(250, 230, 117, 0.5)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 justify-between">
              <h3 className="text-gray-700 font-medium text-sm">Available Balance</h3>
              <LuWallet size={24} color="rgb(246, 170, 28)" />
            </div>
            <p className="flex items-baseline gap-2 mt-2">
              <strong className="text-2xl sm:text-3xl font-bold text-gray-900">
                {walletBalance.toFixed(2)}
              </strong>
              <span className="text-xs font-semibold text-gray-500">AED</span>
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">Ready for withdrawal</span>
              <button
                onClick={handleOpenModal}
                className="text-xs text-[#8d6f30] hover:underline font-bold"
              >
                Withdraw &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="p-4 border border-gray-200/80 rounded-xl shadow-sm bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div
            className="rotate-45 h-full w-[200%] z-0 absolute top-0 right-0 pointer-events-none"
            style={{ background: 'rgba(188, 141, 167, 0.5)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 justify-between">
              <h3 className="text-gray-700 font-medium text-sm">Pending Clearance</h3>
              <Clock size={24} className="text-[#893663]" />
            </div>
            <p className="flex items-baseline gap-2 mt-2">
              <strong className="text-2xl sm:text-3xl font-bold text-gray-900">
                {pendingPayoutAmount.toFixed(2)}
              </strong>
              <span className="text-xs font-semibold text-gray-500">AED</span>
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">Under admin review</span>
            </div>
          </div>
        </div>

        {/* Total Paid Out */}
        <div className="p-4 border border-gray-200/80 rounded-xl shadow-sm bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div
            className="rotate-45 h-full w-[200%] z-0 absolute top-0 right-0 pointer-events-none"
            style={{ background: 'rgba(186, 237, 248, 0.5)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 justify-between">
              <h3 className="text-gray-700 font-medium text-sm">Total Paid Out</h3>
              <CheckCircle2 size={24} className="text-[#0197f6]" />
            </div>
            <p className="flex items-baseline gap-2 mt-2">
              <strong className="text-2xl sm:text-3xl font-bold text-gray-900">
                {totalPaidOut.toFixed(2)}
              </strong>
              <span className="text-xs font-semibold text-gray-500">AED</span>
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">Completed wire transfers</span>
            </div>
          </div>
        </div>

        {/* Total Commission Earned */}
        <div className="p-4 border border-gray-200/80 rounded-xl shadow-sm bg-white relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div
            className="rotate-45 h-full w-[200%] z-0 absolute top-0 right-0 pointer-events-none"
            style={{ background: 'rgba(213, 240, 175, 0.5)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-4 justify-between">
              <h3 className="text-gray-700 font-medium text-sm">Lifetime Commission</h3>
              <Coins size={24} className="text-[#8fdd21]" />
            </div>
            <p className="flex items-baseline gap-2 mt-2">
              <strong className="text-2xl sm:text-3xl font-bold text-gray-900">
                {totalCommissionEarned.toFixed(2)}
              </strong>
              <span className="text-xs font-semibold text-gray-500">AED</span>
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
              <span className="text-[11px] text-gray-500">Total earned across orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Requests Section */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Payout Withdrawal Requests
            </h2>
            <p className="text-xs text-gray-500">
              Status of all manual wire transfer requests processed by MMMK Wode finance.
            </p>
          </div>
        </div>

        <Table
          columns={requestColumns}
          dataSource={requests}
          rowKey={(r) => r._id}
          loading={loading}
          pagination={{ pageSize: 5 }}
          className="admin-clean-table"
        />
      </div>

      {/* Wallet Ledger Audit Log Section */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Wallet Transaction Ledger
            </h2>
            <p className="text-xs text-gray-500">
              Double-entry audit log of all automated commission credits and withdrawal debits.
            </p>
          </div>
        </div>

        <Table
          columns={transactionColumns}
          dataSource={transactions}
          rowKey={(t) => t._id}
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="admin-clean-table"
        />
      </div>

      {/* Clean White Ant Design Payout Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-[#8d6f30]">
              <Wallet size={16} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Request Commission Payout</h3>
              <p className="text-xs text-gray-500">Transfer available wallet earnings to your account</p>
            </div>
          </div>
        }
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmitPayout}
        confirmLoading={submitting}
        okText="Submit Payout Request"
        okButtonProps={{
          className: 'bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0 shadow-sm',
        }}
        destroyOnClose
      >
        <div className="space-y-4 py-2">
          {/* Available balance highlight */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-500">Available to Withdraw:</span>
            <span className="font-bold text-gray-900 text-sm">AED {walletBalance.toFixed(2)}</span>
          </div>

          {/* Amount Input with Max Button */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Withdrawal Amount (AED)
            </label>
            <div className="relative">
              <Input
                type="number"
                min={MIN_PAYOUT}
                max={walletBalance}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min AED ${MIN_PAYOUT}`}
                size="large"
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-bold text-[#8d6f30] bg-amber-50 hover:bg-amber-100 rounded border border-amber-200"
              >
                MAX
              </button>
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Minimum payout threshold is AED {MIN_PAYOUT}.
            </span>
          </div>

          {/* Method Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Payout Destination Method
            </label>
            <Select
              value={payoutMethod}
              onChange={setPayoutMethod}
              className="w-full"
              size="large"
              options={[
                { label: 'Bank Wire / IBAN Transfer', value: 'BankTransfer' },
                { label: 'UPI ID Transfer', value: 'UPI' },
                { label: 'PayPal Account', value: 'PayPal' },
              ]}
            />
          </div>

          {/* Bank Info Status */}
          {payoutMethod === 'BankTransfer' && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Building size={14} className="text-[#8d6f30]" />
                <span>Destination Bank Account</span>
              </div>
              {payoutDetails.accountNumber ? (
                <div className="text-gray-600 text-[11px]">
                  <span>{payoutDetails.bankName || 'Bank'}</span> •{' '}
                  <span className="font-mono">****{payoutDetails.accountNumber.slice(-4)}</span> (
                  {payoutDetails.accountHolderName})
                </div>
              ) : (
                <div className="text-amber-800 text-[11px]">
                  No bank details configured.{' '}
                  <Link to="/influencer/profile" className="underline font-bold text-amber-900">
                    Update in Profile & Banking &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Transfer Reference / Note (Optional)
            </label>
            <Input.TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Transfer to my Emirates NBD account"
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
