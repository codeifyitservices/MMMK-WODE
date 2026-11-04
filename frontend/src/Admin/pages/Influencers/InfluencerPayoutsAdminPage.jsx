import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  Select,
  Radio,
  Divider,
  message,
  Space,
  Tabs,
  Tooltip,
} from 'antd';
import {
  CheckCircle,
  XCircle,
  Coins,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getPayoutRequestsAdmin,
  updatePayoutStatusAdmin,
  getAffiliateAnalyticsAdmin,
  getPayoutScheduleSettingsAdmin,
  updatePayoutScheduleSettingsAdmin,
} from '../../../apis/admin/influencerAdmin';

const InfluencerPayoutsAdminPage = () => {
  const [requests, setRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Payout Schedule Settings State
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    cycleType: 'Monthly',
    cycleDays: 30,
    payoutWindowDurationDays: 5,
    manualOverride: 'Auto',
    minWithdrawalAmount: 200,
  });

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

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await getPayoutScheduleSettingsAdmin();
      if (res.success && res.data) {
        setScheduleData(res.data);
        if (res.data.schedule) {
          setScheduleForm({
            cycleType: res.data.schedule.cycleType || 'Monthly',
            cycleDays: res.data.schedule.cycleDays || 30,
            payoutWindowDurationDays: res.data.schedule.payoutWindowDurationDays || 5,
            manualOverride: res.data.schedule.manualOverride || 'Auto',
            minWithdrawalAmount: res.data.schedule.minWithdrawalAmount || 200,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load payout schedule settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchPayouts(1);
    fetchAnalytics();
    fetchSchedule();
  }, [fetchPayouts, fetchAnalytics, fetchSchedule]);

  const handleSaveSchedule = async () => {
    try {
      setScheduleSaving(true);
      const res = await updatePayoutScheduleSettingsAdmin(scheduleForm);
      if (res.success) {
        message.success('Payout schedule settings updated successfully!');
        setScheduleData(res.data);
        setScheduleModalVisible(false);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to update schedule settings.');
    } finally {
      setScheduleSaving(false);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageTitle
          title="Influencer Payout Requests"
          subtitle="Review, approve bank transfers, enter transaction UTR reference codes, and finalize commission payouts."
        />
        <div className="flex items-center gap-2 shrink-0">
          {scheduleData?.liveStatus && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs shadow-xs">
              <span className="text-gray-500 font-medium">Cycle:</span>
              <strong className="text-gray-900">{scheduleData.liveStatus.cycleType}</strong>
              <Tag
                color={scheduleData.liveStatus.isUnlocked ? 'success' : 'warning'}
                className="m-0 text-[11px] font-semibold flex items-center gap-1"
              >
                {scheduleData.liveStatus.isUnlocked ? <Unlock size={11} /> : <Lock size={11} />}
                <span>{scheduleData.liveStatus.isUnlocked ? 'Unlocked' : 'Locked'}</span>
              </Tag>
            </div>
          )}
          <Button
            onClick={() => setScheduleModalVisible(true)}
            className="flex items-center gap-1.5 font-medium border-gray-300 hover:border-[#dfba73] hover:text-[#8d6f30] shadow-xs"
          >
            <Settings size={15} />
            <span>Payout Schedule & Lock Rules</span>
          </Button>
        </div>
      </div>

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

      {/* Payout Schedule Settings & Lock Engine Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 pb-1">
            <Settings className="text-[#8d6f30]" size={18} />
            <span>Influencer Payout Schedule & Withdrawal Lock Engine</span>
          </div>
        }
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setScheduleModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={scheduleSaving}
            onClick={handleSaveSchedule}
            className="bg-[#dfba73] hover:bg-[#cfa557] text-black font-semibold border-0"
          >
            Save Schedule Rules
          </Button>,
        ]}
        width={620}
      >
        <div className="space-y-5 py-2">
          {/* Live System Status Banner */}
          {scheduleData?.liveStatus && (
            <div
              className={`p-3.5 rounded-xl border ${
                scheduleData.liveStatus.isUnlocked
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Current System State
                </span>
                <Tag
                  color={scheduleData.liveStatus.isUnlocked ? 'success' : 'warning'}
                  className="font-bold flex items-center gap-1 m-0 text-xs px-2 py-0.5"
                >
                  {scheduleData.liveStatus.isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                  <span>
                    {scheduleData.liveStatus.isUnlocked ? 'Withdrawals Unlocked' : 'Withdrawals Locked'}
                  </span>
                </Tag>
              </div>
              <p className="text-xs mt-1.5 leading-relaxed">
                {scheduleData.liveStatus.statusMessage}
              </p>
            </div>
          )}

          {/* Schedule Cycle Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              Automated Payout Cycle
            </label>
            <Select
              className="w-full"
              value={scheduleForm.cycleType}
              onChange={(val) => setScheduleForm((prev) => ({ ...prev, cycleType: val }))}
              options={[
                {
                  value: 'Monthly',
                  label: 'Monthly Cycle (1st to Month-End: 1st – 30th/31st) [Default]',
                },
                {
                  value: 'BiWeekly',
                  label: 'Bi-Weekly Cycle (Every 15 Days: 1st–15th & 16th–End of Month)',
                },
                {
                  value: 'Weekly',
                  label: 'Weekly Cycle (Unlocks on Weekends)',
                },
                {
                  value: 'Custom',
                  label: 'Custom Day Interval',
                },
              ]}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Commissions accumulate in influencer wallets throughout this timeline. Withdrawals are locked until the cycle concludes.
            </p>
          </div>

          {/* Custom Days Input (if Custom) */}
          {scheduleForm.cycleType === 'Custom' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Custom Interval Length
              </label>
              <InputNumber
                min={1}
                max={365}
                className="w-full"
                value={scheduleForm.cycleDays}
                onChange={(val) => setScheduleForm((prev) => ({ ...prev, cycleDays: val }))}
                addonAfter="Days"
              />
            </div>
          )}

          {/* Payout Window Duration */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              Payout Window Open Duration
            </label>
            <InputNumber
              min={1}
              max={31}
              className="w-full"
              value={scheduleForm.payoutWindowDurationDays}
              onChange={(val) =>
                setScheduleForm((prev) => ({ ...prev, payoutWindowDurationDays: val }))
              }
              addonAfter="Days open after cycle ends"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              How many days the withdrawal button remains active for influencers before locking for the next cycle.
            </p>
          </div>

          {/* Minimum Withdrawal Threshold */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              Minimum Withdrawal Threshold
            </label>
            <InputNumber
              min={1}
              max={10000}
              className="w-full"
              value={scheduleForm.minWithdrawalAmount}
              onChange={(val) =>
                setScheduleForm((prev) => ({ ...prev, minWithdrawalAmount: val }))
              }
              addonAfter="AED"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Influencers must have at least this wallet balance to submit a withdrawal request (Default: AED 200).
            </p>
          </div>

          <Divider className="my-3" />

          {/* Manual Override Controls */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5">
              Emergency Manual Override
            </label>
            <Radio.Group
              value={scheduleForm.manualOverride}
              onChange={(e) =>
                setScheduleForm((prev) => ({ ...prev, manualOverride: e.target.value }))
              }
              className="w-full flex flex-col gap-2"
            >
              <Radio value="Auto" className="text-xs">
                <span className="font-semibold text-gray-900">Auto Schedule</span>{' '}
                <span className="text-gray-500">— Follows the automated cycle timeline configured above.</span>
              </Radio>
              <Radio value="ForceUnlocked" className="text-xs">
                <span className="font-semibold text-emerald-700">Force Unlock Immediately</span>{' '}
                <span className="text-gray-500">— Unlocks withdrawal buttons for all influencers right now.</span>
              </Radio>
              <Radio value="ForceLocked" className="text-xs">
                <span className="font-semibold text-rose-700">Force Lock Immediately</span>{' '}
                <span className="text-gray-500">— Temporarily locks all influencer withdrawals regardless of date.</span>
              </Radio>
            </Radio.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InfluencerPayoutsAdminPage;
