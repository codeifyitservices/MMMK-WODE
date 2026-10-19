import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  message,
  Space,
  Tabs,
} from 'antd';
import {
  CheckCircle,
  XCircle,
  Coins,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getPayoutRequestsAdmin,
  updatePayoutStatusAdmin,
  getAffiliateAnalyticsAdmin,
} from '../../../apis/admin/influencerAdmin';

const InfluencerPayoutsAdminPage = () => {
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Processing Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('Paid'); // 'Paid' or 'Rejected'
  const [transactionReference, setTransactionReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPayouts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getPayoutRequestsAdmin({
        page,
        limit: pagination.limit,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setRequests(res.data.payoutRequests || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
          });
        }
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load payout requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.limit]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getAffiliateAnalyticsAdmin();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.warn('Failed to load affiliate analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchPayouts(1);
    fetchAnalytics();
  }, [fetchPayouts, fetchAnalytics]);

  const handleOpenProcessModal = (record, type = 'Paid') => {
    setSelectedRequest(record);
    setActionType(type);
    setTransactionReference('');
    setAdminNote('');
    setModalVisible(true);
  };

  const handleSubmitProcess = async () => {
    if (!selectedRequest) return;

    if (actionType === 'Paid' && !transactionReference.trim()) {
      message.error('Please enter the Bank UTR / Transaction Reference number.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await updatePayoutStatusAdmin(selectedRequest._id, {
        status: actionType,
        transactionReference: transactionReference.trim(),
        adminNote: adminNote.trim(),
      });

      if (res.success) {
        message.success(
          actionType === 'Paid'
            ? 'Payout marked as Paid! Notification email sent to influencer.'
            : 'Payout rejected. Held funds refunded to influencer wallet.'
        );
        setModalVisible(false);
        fetchPayouts(pagination.page);
        fetchAnalytics();
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update payout status.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Request ID',
        dataIndex: '_id',
        key: '_id',
        render: (id) => (
          <span className="font-mono font-bold text-gray-900">
            #{String(id).slice(-8).toUpperCase()}
          </span>
        ),
      },
      {
        title: 'Influencer',
        key: 'influencer',
        render: (_, record) => {
          const inf = record.influencerId || {};
          return (
            <div>
              <div className="font-semibold text-gray-900">{inf.fullName || 'Partner'}</div>
              <div className="text-xs text-gray-500">@{inf.username}</div>
              <div className="text-xs text-[#b8860b] font-medium font-mono">
                Code: {inf.referralCode}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Requested Amount',
        dataIndex: 'requestedAmount',
        key: 'requestedAmount',
        render: (amt) => (
          <span className="font-bold text-base text-gray-900">
            AED {Number(amt || 0).toFixed(2)}
          </span>
        ),
      },
      {
        title: 'Disbursement Method',
        dataIndex: 'payoutMethod',
        key: 'payoutMethod',
        render: (method) => (
          <Tag color="blue">{method || 'BankTransfer'}</Tag>
        ),
      },
      {
        title: 'Bank / Destination Details',
        key: 'details',
        render: (_, record) => {
          const snap = record.payoutDetailsSnapshot || {};
          return (
            <div className="text-xs text-gray-700 space-y-0.5 max-w-xs">
              <div>
                <span className="text-gray-400">Holder:</span>{' '}
                <strong>{snap.accountHolderName || '-'}</strong>
              </div>
              <div>
                <span className="text-gray-400">Bank:</span> {snap.bankName || '-'}
              </div>
              <div>
                <span className="text-gray-400">Account:</span>{' '}
                <span className="font-mono">{snap.accountNumber || snap.iban || '-'}</span>
              </div>
              {snap.swiftCode && (
                <div>
                  <span className="text-gray-400">SWIFT:</span>{' '}
                  <span className="font-mono">{snap.swiftCode}</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: 'Date Requested',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => (
          <span className="text-xs text-gray-500">
            {date ? new Date(date).toLocaleDateString() : '-'}
          </span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const colors = {
            Pending: 'gold',
            Approved: 'blue',
            Paid: 'green',
            Rejected: 'red',
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        },
      },
      {
        title: 'Bank UTR / Ref',
        dataIndex: 'transactionReference',
        key: 'transactionReference',
        render: (ref) =>
          ref ? (
            <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
              {ref}
            </span>
          ) : (
            <span className="text-gray-400 italic text-xs">-</span>
          ),
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => {
          if (record.status === 'Pending') {
            return (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleOpenProcessModal(record, 'Paid')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                >
                  <CheckCircle size={13} />
                  <span>Mark as Paid</span>
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleOpenProcessModal(record, 'Rejected')}
                  className="flex items-center gap-1"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </Button>
              </Space>
            );
          }
          if (record.status === 'Paid') {
            return (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>Disbursed</span>
              </span>
            );
          }
          return <span className="text-xs text-gray-400">Rejected & Refunded</span>;
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <PageTitle
        title="Influencer Payout Requests"
        subtitle="Review, approve bank transfers, enter transaction UTR reference codes, and finalize commission payouts."
      />

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pending Disbursements
            </span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              AED {analytics?.pendingPayoutTotal || 0}
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock size={22} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Lifetime Paid Out
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              AED {analytics?.completedPayoutTotal || 0}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Attributed Sales
            </span>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              AED {analytics?.totalSalesVolume || 0}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Coins size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key)}
          items={[
            { key: 'Pending', label: 'Pending Processing' },
            { key: 'Paid', label: 'Completed (Paid)' },
            { key: 'Rejected', label: 'Rejected' },
            { key: 'All', label: 'All Requests' },
          ]}
        />
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => fetchPayouts(page),
            showSizeChanger: false,
          }}
        />
      </div>

      {/* PROCESS PAYOUT MODAL */}
      <Modal
        title={
          actionType === 'Paid'
            ? 'Confirm Bank Disbursement & Enter UTR Reference'
            : 'Reject Payout Request'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmitProcess}
        confirmLoading={submitting}
        okText={actionType === 'Paid' ? 'Mark as Paid & Email Influencer' : 'Confirm Rejection'}
        okButtonProps={
          actionType === 'Paid'
            ? { className: 'bg-emerald-600 hover:bg-emerald-700' }
            : { danger: true }
        }
        width={540}
      >
        <div className="py-2 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
            <div className="flex items-center justify-between text-gray-800">
              <span>Influencer:</span>
              <strong>{selectedRequest?.influencerId?.fullName}</strong>
            </div>
            <div className="flex items-center justify-between text-gray-800">
              <span>Requested Amount:</span>
              <strong className="text-base text-emerald-700">
                AED {Number(selectedRequest?.requestedAmount || 0).toFixed(2)}
              </strong>
            </div>
            <div className="flex items-center justify-between text-gray-800">
              <span>Method:</span>
              <span>{selectedRequest?.payoutMethod || 'BankTransfer'}</span>
            </div>
          </div>

          {/* Bank Destination Snapshot */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-0.5 text-[11px]">
            <div className="font-semibold text-xs text-amber-950 mb-1">
              Bank Wire Destination:
            </div>
            <div>
              Holder:{' '}
              <strong>
                {selectedRequest?.payoutDetailsSnapshot?.accountHolderName || '-'}
              </strong>
            </div>
            <div>Bank: {selectedRequest?.payoutDetailsSnapshot?.bankName || '-'}</div>
            <div>
              Account / IBAN:{' '}
              <span className="font-mono">
                {selectedRequest?.payoutDetailsSnapshot?.accountNumber ||
                  selectedRequest?.payoutDetailsSnapshot?.iban ||
                  '-'}
              </span>
            </div>
            <div>
              SWIFT / IFSC:{' '}
              <span className="font-mono">
                {selectedRequest?.payoutDetailsSnapshot?.swiftCode || '-'}
              </span>
            </div>
          </div>

          {actionType === 'Paid' ? (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Bank Transfer Reference / UTR Number <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. UTR-20261019-983124 or SWIFT-109283"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                required
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                This transaction reference will be emailed to the influencer as proof of payment.
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Rejection Reason (Will be sent to influencer and recorded in ledger)
              </label>
              <Input.TextArea
                rows={3}
                placeholder="e.g. Bank account details incorrect or invalid IBAN..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <span className="text-[11px] text-amber-700 mt-1 block">
                Held funds (AED {selectedRequest?.requestedAmount}) will be immediately refunded back to the influencer&apos;s wallet balance.
              </span>
            </div>
          )}

          {actionType === 'Paid' && (
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Optional Admin Note
              </label>
              <Input
                placeholder="Internal memo or wire receipt notes..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InfluencerPayoutsAdminPage;
