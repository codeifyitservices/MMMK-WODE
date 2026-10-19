import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  InputNumber,
  message,
  Tabs,
  Space,
  Tooltip,
} from 'antd';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  UserCheck,
  Search,
} from 'lucide-react';
import PageTitle from '../../UI/PageTitle';
import {
  getInfluencerApplicationsAdmin,
  approveInfluencerApplicationAdmin,
  rejectInfluencerApplicationAdmin,
} from '../../../apis/admin/influencerAdmin';

const InfluencerApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  // Modal States
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Approval Form State
  const [approvalForm, setApprovalForm] = useState({
    customUsername: '',
    customReferralCode: '',
    customPassword: '',
    commissionRate: 10,
    discountRate: 20,
  });

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchApplications = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getInfluencerApplicationsAdmin({
        page,
        limit: pagination.limit,
        status: statusFilter,
        search: search || undefined,
      });

      if (res.success && res.data) {
        setApplications(res.data.applications || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
          });
        }
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, pagination.limit]);

  useEffect(() => {
    fetchApplications(1);
  }, [fetchApplications]);

  const handleOpenApproveModal = (record) => {
    setSelectedApp(record);
    // Generate suggested username and referral code based on full name
    const cleanName = (record.fullName || 'partner')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '_');
    const codeBase = (record.fullName || 'WODE')
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 6);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    setApprovalForm({
      customUsername: `${cleanName}_${record._id.slice(-3)}`,
      customReferralCode: `${codeBase || 'WODE'}20`,
      customPassword: `Wode@${randomSuffix}`,
      commissionRate: 10,
      discountRate: 20,
    });
    setApproveModalVisible(true);
  };

  const handleOpenRejectModal = (record) => {
    setSelectedApp(record);
    setRejectionReason('Your application does not meet our current influencer requirements.');
    setRejectModalVisible(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      const res = await approveInfluencerApplicationAdmin(selectedApp._id, approvalForm);
      if (res.success) {
        message.success(
          `Approved! Welcome credentials dispatched to ${selectedApp.email}.`
        );
        setApproveModalVisible(false);
        fetchApplications(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to approve application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedApp) return;

    try {
      setSubmitting(true);
      const res = await rejectInfluencerApplicationAdmin(selectedApp._id, {
        reason: rejectionReason,
      });
      if (res.success) {
        message.success('Application marked as Rejected.');
        setRejectModalVisible(false);
        fetchApplications(pagination.page);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Failed to reject application.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Applicant',
        dataIndex: 'fullName',
        key: 'fullName',
        render: (name, record) => (
          <div>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
            {record.phoneNumber && (
              <div className="text-xs text-gray-400">{record.phoneNumber}</div>
            )}
          </div>
        ),
      },
      {
        title: 'Niche & Followers',
        key: 'niche',
        render: (_, record) => (
          <div>
            <div className="text-sm font-medium text-gray-800">
              {record.niche || 'General'}
            </div>
            <div className="text-xs text-[#b8860b] font-semibold">
              {record.followerCount || 'Not specified'} followers
            </div>
          </div>
        ),
      },
      {
        title: 'Social Channels',
        key: 'socialMedia',
        render: (_, record) => {
          const sm = record.socialMedia || {};
          const links = [
            sm.instagram && { label: 'Instagram', url: sm.instagram },
            sm.tiktok && { label: 'TikTok', url: sm.tiktok },
            sm.youtube && { label: 'YouTube', url: sm.youtube },
            sm.other && { label: 'Website', url: sm.other },
          ].filter(Boolean);

          return links.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {links.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-[#dfba73]/20 hover:text-[#8a6820] text-gray-700 transition-colors"
                >
                  <span>{item.label}</span>
                  <ExternalLink size={10} />
                </a>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-400">None provided</span>
          );
        },
      },
      {
        title: 'Bio / Note',
        dataIndex: 'bio',
        key: 'bio',
        render: (bio) => (
          <Tooltip title={bio}>
            <span className="text-xs text-gray-600 line-clamp-2 max-w-xs">
              {bio || '-'}
            </span>
          </Tooltip>
        ),
      },
      {
        title: 'Date Submitted',
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
            Approved: 'green',
            Rejected: 'red',
            Suspended: 'volcano',
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        },
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
                  onClick={() => handleOpenApproveModal(record)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                >
                  <CheckCircle size={13} />
                  <span>Approve</span>
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleOpenRejectModal(record)}
                  className="flex items-center gap-1"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </Button>
              </Space>
            );
          }
          if (record.status === 'Approved') {
            return (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck size={14} />
                <span>Code: {record.referralCode}</span>
              </span>
            );
          }
          return (
            <span className="text-xs text-gray-400">
              {record.rejectionReason || 'Rejected'}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <PageTitle
        title="Influencer Applications"
        subtitle="Review, approve, and auto-dispatch login credentials to aspiring influencers."
      />

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <Tabs
          activeKey={statusFilter}
          onChange={(key) => setStatusFilter(key)}
          className="w-full sm:w-auto"
          items={[
            { key: 'Pending', label: 'Pending Review' },
            { key: 'Approved', label: 'Approved' },
            { key: 'Rejected', label: 'Rejected' },
            { key: 'All', label: 'All Applications' },
          ]}
        />

        <div className="w-full sm:w-72">
          <Input
            prefix={<Search size={14} className="text-gray-400 mr-1" />}
            placeholder="Search applicant name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => fetchApplications(page),
            showSizeChanger: false,
          }}
        />
      </div>

      {/* APPROVE INFLUENCER MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <UserCheck size={18} className="text-emerald-600" />
            <span>Approve Application: {selectedApp?.fullName}</span>
          </div>
        }
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={handleApproveSubmit}
        confirmLoading={submitting}
        okText="Approve & Send Welcome Email"
        okButtonProps={{ className: 'bg-emerald-600 hover:bg-emerald-700' }}
        width={560}
      >
        <div className="py-2 space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-800 flex items-start gap-2">
            <Send size={15} className="shrink-0 mt-0.5" />
            <span>
              Approving will create an active influencer account and automatically dispatch a branded welcome email with these credentials to <strong>{selectedApp?.email}</strong>.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Portal Username
              </label>
              <Input
                value={approvalForm.customUsername}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, customUsername: e.target.value })
                }
                placeholder="e.g. jatin_style"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Unique Referral Code
              </label>
              <Input
                value={approvalForm.customReferralCode}
                onChange={(e) =>
                  setApprovalForm({
                    ...approvalForm,
                    customReferralCode: e.target.value.toUpperCase(),
                  })
                }
                placeholder="e.g. JATIN20"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Temporary Password
              </label>
              <Input
                value={approvalForm.customPassword}
                onChange={(e) =>
                  setApprovalForm({ ...approvalForm, customPassword: e.target.value })
                }
                placeholder="Initial password"
              />
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">
                Commission Rate (%)
              </label>
              <InputNumber
                min={1}
                max={50}
                className="w-full"
                value={approvalForm.commissionRate}
                onChange={(val) =>
                  setApprovalForm({ ...approvalForm, commissionRate: val })
                }
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-600 font-medium mb-1">
                Customer Discount Rate (%)
              </label>
              <InputNumber
                min={0}
                max={50}
                className="w-full"
                value={approvalForm.discountRate}
                onChange={(val) =>
                  setApprovalForm({ ...approvalForm, discountRate: val })
                }
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Referred customers automatically get this discount at cart and checkout.
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        title="Reject Influencer Application"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={handleRejectSubmit}
        confirmLoading={submitting}
        okText="Confirm Rejection"
        okButtonProps={{ danger: true }}
      >
        <div className="py-2 space-y-3 text-xs">
          <p className="text-gray-600">
            Are you sure you want to reject the application for{' '}
            <strong>{selectedApp?.fullName}</strong> ({selectedApp?.email})?
          </p>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Rejection Reason (Internal & Feedback Note)
            </label>
            <Input.TextArea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this application was not approved..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InfluencerApplicationsPage;
